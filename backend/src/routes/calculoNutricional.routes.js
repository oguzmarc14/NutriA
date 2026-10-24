const express = require('express')
const { z } = require('zod')
const mongoose = require('mongoose')
const Pacientes = require('../models/Pacientes')
const Medicion = require('../models/Medicion')
const Calculo = require('../models/CalculoNutricional')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))

const schema = z.object({
  medicionId: z.string(),
  sexoCalculo: z.enum(['male', 'female']),
  factorActividad: z.number().min(1.0).max(2.5),
  ajusteKcal: z.number().min(-1000).max(1000),
  porcentajes: z.object({
    carbohidratos: z.number().min(0).max(100),
    proteinas: z.number().min(0).max(100),
    grasas: z.number().min(0).max(100),
  }),
  observaciones: z.string().max(1000).default(''),
}).strict()

async function verificarPaciente(req, res) {
  if (!mongoose.isValidObjectId(req.params.pacienteId)) {
    res.status(400).json({ message: 'Identificador de paciente inválido' })
    return null
  }
  const paciente = await Pacientes.findOne({ _id: req.params.pacienteId, nutritionist: req.user.id, active: true })
  if (!paciente) res.status(404).json({ message: 'Paciente no encontrado' })
  return paciente
}

router.get('/:pacienteId', async (req, res, next) => {
  try {
    const paciente = await verificarPaciente(req, res)
    if (!paciente) return
    const [mediciones, calculos] = await Promise.all([
      Medicion.find({ paciente: paciente._id, nutritionist: req.user.id }).sort({ fecha: -1 }).limit(20).lean(),
      Calculo.find({ paciente: paciente._id, nutritionist: req.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
    ])
    return res.json({ paciente, mediciones, calculos })
  } catch (error) { next(error) }
})

router.post('/:pacienteId', async (req, res, next) => {
  try {
    const paciente = await verificarPaciente(req, res)
    if (!paciente) return
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Parámetros de cálculo inválidos', errors: parsed.error.flatten() })
    const d = parsed.data
    if (!mongoose.isValidObjectId(d.medicionId)) return res.status(400).json({ message: 'Medición inválida' })
    const suma = d.porcentajes.carbohidratos + d.porcentajes.proteinas + d.porcentajes.grasas
    if (Math.abs(suma - 100) > 0.001) return res.status(400).json({ message: 'Los macronutrientes deben sumar 100%' })
    const medicion = await Medicion.findOne({ _id: d.medicionId, paciente: paciente._id, nutritionist: req.user.id })
    if (!medicion) return res.status(404).json({ message: 'Medición no encontrada' })
    if (medicion.edad < 18) return res.status(400).json({ message: 'Esta primera versión solo admite cálculos para adultos (18+)' })
    const estaturaCm = medicion.estatura * 100
    const basal = 10 * medicion.peso + 6.25 * estaturaCm - 5 * medicion.edad + (d.sexoCalculo === 'male' ? 5 : -161)
    const gastoTotal = basal * d.factorActividad
    const objetivo = gastoTotal + d.ajusteKcal
    if (objetivo <= 0 || !Number.isFinite(objetivo)) return res.status(400).json({ message: 'Objetivo energético inválido' })
    const redondear = n => Math.round(n * 10) / 10
    const calculo = await Calculo.create({
      paciente: paciente._id, nutritionist: req.user.id, medicion: medicion._id,
      formula: 'mifflin', sexoCalculo: d.sexoCalculo, edad: medicion.edad,
      peso: medicion.peso, estaturaCm, factorActividad: d.factorActividad,
      ajusteKcal: d.ajusteKcal, porcentajes: d.porcentajes, observaciones: d.observaciones,
      resultado: {
        metabolismoBasal: redondear(basal), gastoTotal: redondear(gastoTotal),
        objetivoKcal: redondear(objetivo),
        carbohidratosGramos: redondear(objetivo * d.porcentajes.carbohidratos / 100 / 4),
        proteinasGramos: redondear(objetivo * d.porcentajes.proteinas / 100 / 4),
        grasasGramos: redondear(objetivo * d.porcentajes.grasas / 100 / 9),
      },
    })
    return res.status(201).json({ message: 'Borrador de cálculo guardado', calculo })
  } catch (error) { next(error) }
})
module.exports = router
