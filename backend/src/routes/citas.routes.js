const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Patient = require('../models/Pacientes')
const Cita = require('../models/Cita')
const User = require('../models/User')
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
  const inicio = new Date(data.inicio)
  if (inicio <= new Date()) { res.status(400).json({ message: 'No se permiten citas en fechas u horas pasadas' }); return null }
  const fin = new Date(inicio.getTime() + 60 * 60 * 1000)
  const nutricionista = await User.findById(req.user._id).select('horarioLaboral').lean()
  const horario = nutricionista?.horarioLaboral
  if (horario?.configurado) {
    const partes = fecha => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: horario.zonaHoraria, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(fecha).filter(p => ['weekday','hour','minute'].includes(p.type)).map(p => [p.type,p.value]))
    const local = partes(inicio)
    const dia = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }[local.weekday]
    const minutos = Number(local.hour)*60 + Number(local.minute)
    const [hi,mi] = horario.inicio.split(':').map(Number)
    const [hf,mf] = horario.fin.split(':').map(Number)
    if (!horario.dias.includes(dia) || minutos < hi*60+mi || minutos+60 > hf*60+mf) {
      res.status(400).json({ message:'La cita debe estar dentro de tus días y horas laborales. Modifica tu horario desde Editar perfil.' })
      return null
    }
  }
  const paciente = await Patient.exists({ _id: data.patient, nutritionist: req.user._id, active: true })
  if (!paciente) { res.status(404).json({ message: 'Paciente no encontrado' }); return null }
  return { ...data, inicio, fin }
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
