const express = require('express')
const { z } = require('zod')
const mongoose = require('mongoose')
const Pacientes = require('../models/Pacientes')
const Medicion = require('../models/Medicion')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const Calculo = require('../models/CalculoNutricional')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const { calcularEnergiaPediatrica, edadEnMedicion } = require('../utils/energiaPediatrica')
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))

const schema = z.object({
  medicionId: z.string(),
  sexoCalculo: z.enum(['male', 'female']),
  factorActividad: z.number().min(1.0).max(2.5),
  actividadPediatrica: z.enum(['inactiva', 'ligera', 'activa', 'muy-activa']).optional(),
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
    const [mediciones, calculos, expediente] = await Promise.all([
      Medicion.find({ paciente: paciente._id, nutritionist: req.user.id }).sort({ fecha: -1, createdAt: -1, _id: -1 }).limit(20).lean(),
      Calculo.find({ paciente: paciente._id, nutritionist: req.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
      ExpedienteClinico.findOne({ paciente: paciente._id, nutritionist: req.user.id }).lean(),
    ])
    const medicionesPorId = new Map(mediciones.map(item => [String(item._id), item]))
    const idsAnteriores = [...new Set(calculos
      .filter(calculo => !calculo.fechaMedicion && calculo.medicion && !medicionesPorId.has(String(calculo.medicion)))
      .map(calculo => String(calculo.medicion)))]
    if (idsAnteriores.length) {
      const anteriores = await Medicion.find({
        _id: { $in: idsAnteriores }, paciente: paciente._id, nutritionist: req.user.id,
      }).select('fecha createdAt').lean()
      for (const item of anteriores) medicionesPorId.set(String(item._id), item)
    }
    const historial = calculos.map(calculo => {
      const medicion = medicionesPorId.get(String(calculo.medicion))
      return calculo.fechaMedicion || !medicion ? calculo : {
        ...calculo, fechaMedicion: medicion.fecha, fechaRegistroMedicion: medicion.createdAt,
      }
    })
    const medidasParaCalculo = mediciones.map(medicion => {
      const edadReal = edadEnMedicion(medicion.edad, paciente.birthDate, medicion.fecha)
      return { ...medicion, edad: edadReal ? Math.floor(edadReal.meses / 12) : medicion.edad,
        edadCalculoValida: Boolean(edadReal), fuenteEdadCalculo: edadReal?.fuente }
    })
    return res.json({ paciente, mediciones: medidasParaCalculo, calculos: historial, expediente })
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
    const estaturaCm = medicion.estatura * 100
    const edadReal = edadEnMedicion(medicion.edad, paciente.birthDate, medicion.fecha)
    if (!edadReal) return res.status(400).json({ message: 'Revisa la fecha de nacimiento y la fecha de medición para calcular la edad.' })
    const edad = Math.floor(edadReal.meses / 12)
    const pediatrico = edad < 19
    const basal = pediatrico ? null : 10 * medicion.peso + 6.25 * estaturaCm - 5 * edad + (d.sexoCalculo === 'male' ? 5 : -161)
    const estimacion = pediatrico ? calcularEnergiaPediatrica({
      edad, peso: medicion.peso, estaturaCm, sexo: d.sexoCalculo,
      actividad: d.actividadPediatrica, nacimiento: paciente.birthDate, fechaMedicion: medicion.fecha,
    }) : null
    const gastoTotal = pediatrico ? (estimacion?.kcal ?? null) : basal * d.factorActividad
    if (pediatrico && gastoTotal === null) return res.status(400).json({
      message: 'Revisa la edad, la fecha de nacimiento y la fecha de medición. Desde los 3 años debes seleccionar una categoría pediátrica de actividad.',
    })
    const objetivo = gastoTotal + (pediatrico ? 0 : d.ajusteKcal)
    if (objetivo <= 0 || !Number.isFinite(objetivo)) return res.status(400).json({ message: 'Objetivo energético inválido' })
    const redondear = n => Math.round(n * 10) / 10
    const calculo = await Calculo.create({
      paciente: paciente._id, nutritionist: req.user.id, medicion: medicion._id,
      fechaMedicion: medicion.fecha, fechaRegistroMedicion: medicion.createdAt,
      formula: pediatrico ? 'eer-dri-2023' : 'mifflin',
      ...(pediatrico && { versionMotor: '2.1.0', detalleFormula: estimacion.detalle }),
      ...(pediatrico && edad >= 3 && { actividadPediatrica: d.actividadPediatrica }),
      sexoCalculo: d.sexoCalculo, edad,
      peso: medicion.peso, estaturaCm, factorActividad: pediatrico ? 1 : d.factorActividad,
      ajusteKcal: pediatrico ? 0 : d.ajusteKcal, porcentajes: d.porcentajes, observaciones: d.observaciones,
      resultado: {
        ...(!pediatrico && { metabolismoBasal: redondear(basal) }), gastoTotal: redondear(gastoTotal),
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
