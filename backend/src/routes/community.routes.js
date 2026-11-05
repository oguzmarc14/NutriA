const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Receta = require('../models/RecetaCommunity')
const User = require('../models/User')

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
