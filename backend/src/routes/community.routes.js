const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Receta = require('../models/RecetaCommunity')
const User = require('../models/User')
const DietaGuardada = require('../models/DietaGuardada')
const Plan = require('../models/PlanAlimenticio')

const router = express.Router()
router.use(requireAuth)

const recetaInput = z.object({
  titulo: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().max(1200).default(''),
  instrucciones: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
  ingredientes: z.array(z.object({
    alimento: z.string().regex(/^[a-f0-9]{24}$/i).nullable().optional(),
    nombre: z.string().trim().min(1).max(120),
    cantidad: z.number().positive(),
    unidad: z.string().trim().min(1).max(40),
    gramos: z.number().nonnegative().nullable().optional(),
  })).min(1).max(100),
  porciones: z.number().int().min(1).max(100),
  nutrimentosPorPorcion: z.object({
    kcal: z.number().nonnegative().nullable().optional(),
    proteina: z.number().nonnegative().nullable().optional(),
    carbohidratos: z.number().nonnegative().nullable().optional(),
    grasas: z.number().nonnegative().nullable().optional(),
  }).optional(),
  etiquetas: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
}).strict()

const fail = (res, error) => res.status(400).json({
  message: 'Datos de receta inválidos',
  details: error.issues?.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
})
const validId = id => mongoose.isValidObjectId(id)

const plantillaInput = z.object({
  planId: z.string().regex(/^[a-f\d]{24}$/i),
  nombre: z.string().trim().min(3).max(100),
}).strict()

function totalesDietaGuardada(comidas) {
  const alimentos = (comidas || []).flatMap(comida => comida.alimentos || [])
  return Object.fromEntries(['kcal', 'proteina', 'carbohidratos', 'grasas'].map(clave => {
    const aportes = alimentos.map(alimento => {
      const cantidad = Number(alimento.cantidad ?? 1)
      const valor = alimento.nutrimentos?.[clave]
      return valor == null || !Number.isFinite(cantidad) || cantidad <= 0 ? NaN : Number(valor) * cantidad
    })
    return [clave, aportes.length && aportes.every(Number.isFinite) ? aportes.reduce((a, b) => a + b, 0) : null]
  }))
}

router.get('/mis-dietas', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    const list = await DietaGuardada.find({ autor: req.user._id })
      .select('nombre fechaGuardado comidasCount metaEnergiaKcal plan.comidas.alimentos.cantidad plan.comidas.alimentos.nutrimentos')
      .sort({ fechaGuardado: -1 }).limit(100).lean()
    res.json(list.map(({ plan, ...dieta }) => ({ ...dieta, totales: totalesDietaGuardada(plan?.comidas) })))
  } catch (error) { next(error) }
})
router.post('/mis-dietas', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    const parsed = plantillaInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Indica nombre y plan válidos para guardar la dieta.' })
    const original = await Plan.findOne({
      _id: parsed.data.planId,
      nutritionist: req.user._id,
    }).lean()
    if (!original) return res.status(404).json({ message: 'No encontramos ese plan entre tus pacientes.' })
    if (!original.comidas?.length) return res.status(400).json({ message: 'La dieta no tiene comidas para guardar.' })
    // No copiar paciente, nutritionist ni identificadores privados a la plantilla.
    const snapshot = {
      nombre: original.nombre,
      objetivo: original.objetivo || '',
      fechaInicio: original.fechaInicio,
      metaEnergiaKcal: original.metaEnergiaKcal ?? null,
      comidas: original.comidas.map(meal => ({
        nombre: meal.nombre, hora: meal.hora, platillo: meal.platillo,
        descripcion: meal.descripcion, porcentajeDistribucion: meal.porcentajeDistribucion,
        preparaciones: meal.preparaciones,
        alimentos: meal.alimentos,
      })),
    }
    const stored = await DietaGuardada.create({
      autor: req.user._id, nombre: parsed.data.nombre,
      origenPlan: original._id, plan: snapshot,
      comidasCount: snapshot.comidas.length, metaEnergiaKcal: snapshot.metaEnergiaKcal,
    })
    res.status(201).json({ _id: stored._id, nombre: stored.nombre, fechaGuardado: stored.fechaGuardado })
  } catch (error) { next(error) }
})
router.get('/mis-dietas/:id', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Dieta inválida' })
    const item = await DietaGuardada.findOne({ _id: req.params.id, autor: req.user._id }).lean()
    if (!item) return res.status(404).json({ message: 'No encontramos esa dieta guardada.' })
    res.json(item)
  } catch (error) { next(error) }
})
router.delete('/mis-dietas/:id', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Dieta inválida' })
    const item = await DietaGuardada.findOneAndDelete({ _id: req.params.id, autor: req.user._id })
    if (!item) return res.status(404).json({ message: 'Dieta guardada no encontrada.' })
    res.json({ message: 'Dieta eliminada de tu biblioteca privada.' })
  } catch (error) { next(error) }
})

router.get('/', allowRoles('nutritionist', 'admin'), async (req, res, next) => {
  try {
    const recetas = await Receta.find({ estado: 'publicada' })
      .sort({ publicadaEn: -1 }).limit(100)
      .populate('autor', 'name')
      .lean()
    res.json(recetas)
  } catch (error) { next(error) }
})

router.get('/mias', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    res.json(await Receta.find({ autor: req.user._id }).sort({ updatedAt: -1 }).lean())
  } catch (error) { next(error) }
})

router.post('/', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    const parsed = recetaInput.safeParse(req.body)
    if (!parsed.success) return fail(res, parsed.error)
    const receta = await Receta.create({ ...parsed.data, autor: req.user._id })
    res.status(201).json(receta)
  } catch (error) { next(error) }
})

router.post('/:id/publicar', allowRoles('nutritionist'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const user = await User.findById(req.user._id).select('+communityTrusted')
    const estado = user.communityTrusted ? 'publicada' : 'pendiente'
    const receta = await Receta.findOneAndUpdate(
      { _id: req.params.id, autor: req.user._id, estado: { $in: ['privada', 'rechazada'] } },
      { $set: { estado, publicadaEn: estado === 'publicada' ? new Date() : null, revision: {} } },
      { new: true, runValidators: true },
    )
    if (!receta) return res.status(404).json({ message: 'Receta no encontrada o no publicable' })
    void req.app?.locals?.notificarReceta?.(receta,receta.estado==='pendiente')
    res.json(receta)
  } catch (error) { next(error) }
})

router.get('/moderacion/pendientes', allowRoles('admin'), async (req, res, next) => {
  try {
    res.json(await Receta.find({ estado: 'pendiente' }).sort({ createdAt: 1 }).limit(100).populate('autor', 'name email').lean())
  } catch (error) { next(error) }
})

router.patch('/:id/moderar', allowRoles('admin'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const parsed = z.object({ aprobar: z.boolean(), motivo: z.string().trim().max(500).default('') }).strict().safeParse(req.body)
    if (!parsed.success) return fail(res, parsed.error)
    if (!parsed.data.aprobar && !parsed.data.motivo) return res.status(400).json({ message: 'Indica el motivo del rechazo' })
    const receta = await Receta.findOneAndUpdate(
      { _id: req.params.id, estado: 'pendiente' },
      { $set: {
        estado: parsed.data.aprobar ? 'publicada' : 'rechazada',
        publicadaEn: parsed.data.aprobar ? new Date() : null,
        revision: { revisadoPor: req.user._id, fecha: new Date(), motivo: parsed.data.motivo },
      } },
      { new: true, runValidators: true },
    )
    if (!receta) return res.status(404).json({ message: 'Receta pendiente no encontrada' })
    void req.app?.locals?.notificarReceta?.(receta,receta.estado==='pendiente')
    res.json(receta)
  } catch (error) { next(error) }
})

router.patch('/colaboradores/:id/confianza', allowRoles('admin'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const parsed = z.object({ confiable: z.boolean() }).strict().safeParse(req.body)
    if (!parsed.success) return fail(res, parsed.error)
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'nutritionist' },
      { $set: { communityTrusted: parsed.data.confiable } },
      { new: true },
    ).select('name email communityTrusted').select('+communityTrusted')
    if (!user) return res.status(404).json({ message: 'Nutriólogo no encontrado' })
    res.json(user)
  } catch (error) { next(error) }
})

module.exports = router
