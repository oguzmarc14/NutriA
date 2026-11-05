const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Patient = require('../models/Pacientes')
const Cita = require('../models/Cita')
const { syncAppointment } = require('../services/calendar.service')
async function intentarSincronizar(cita) {
  try { await syncAppointment(cita); return true }
  catch (error) { console.error('Error de sincronización Calendar:', error.message); return false }
}
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))

const input = z.object({
  patient: z.string().regex(/^[a-f\d]{24}$/i),
  inicio: z.iso.datetime({ offset: true }),
  fin: z.iso.datetime({ offset: true }),
  zonaHoraria: z.string().min(3).max(80),
  tipo: z.enum(['primera', 'seguimiento', 'otra']).default('seguimiento'),
  estado: z.enum(['programada', 'confirmada', 'cancelada', 'completada']).default('programada'),
  notas: z.string().trim().max(500).default(''),
}).strict()

async function conflicto(nutritionist, inicio, fin, excluir) {
  return Cita.exists({ nutritionist, estado: { $nin: ['cancelada'] },
    inicio: { $lt: fin }, fin: { $gt: inicio },
    ...(excluir ? { _id: { $ne: excluir } } : {}) })
}
async function validar(req, res) {
  const parsed = input.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Datos de cita inválidos', issues: parsed.error.issues }); return null }
  const data = parsed.data
  if (Date.parse(data.fin) <= Date.parse(data.inicio)) { res.status(400).json({ message: 'La hora final debe ser posterior a la inicial' }); return null }
  const paciente = await Patient.exists({ _id: data.patient, nutritionist: req.user._id, active: true })
  if (!paciente) { res.status(404).json({ message: 'Paciente no encontrado' }); return null }
  return { ...data, inicio: new Date(data.inicio), fin: new Date(data.fin) }
}
router.get('/', async (req,res,next) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : new Date(Date.now() - 30 * 86400000)
    const hasta = req.query.hasta ? new Date(req.query.hasta) : new Date(Date.now() + 90 * 86400000)
    if (!Number.isFinite(+desde) || !Number.isFinite(+hasta) || hasta <= desde || hasta - desde > 366 * 86400000) return res.status(400).json({ message: 'Rango inválido' })
    res.json(await Cita.find({ nutritionist: req.user._id, inicio: { $lt: hasta }, fin: { $gt: desde } }).sort({ inicio: 1 }).limit(500).populate('patient', 'name email').lean())
  } catch(e) { next(e) }
})
router.post('/', async (req,res,next) => {
  try {
    const data = await validar(req,res); if (!data) return
    if (data.estado !== 'cancelada' && await conflicto(req.user._id, data.inicio, data.fin)) return res.status(409).json({ message: 'Ya existe una cita en ese horario' })
    const cita = await Cita.create({ ...data, nutritionist: req.user._id })
    const calendarSynced = await intentarSincronizar(cita)
    res.status(201).json({ ...cita.toObject(), calendarSynced })
  } catch(e) { next(e) }
})
router.put('/:id', async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const data = await validar(req,res); if (!data) return
    const cita = await Cita.findOne({ _id: req.params.id, nutritionist: req.user._id })
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    if (data.estado !== 'cancelada' && await conflicto(req.user._id, data.inicio, data.fin, cita._id)) return res.status(409).json({ message: 'Ya existe una cita en ese horario' })
    Object.assign(cita, data)
    cita.recordatorio24hEnviado = null
    cita.recordatorio2hEnviado = null
    await cita.save()
    const calendarSynced = await intentarSincronizar(cita)
    res.json({ ...cita.toObject(), calendarSynced })
  } catch(e) { next(e) }
})
module.exports = router
