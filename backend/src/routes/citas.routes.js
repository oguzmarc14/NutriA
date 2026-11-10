const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Patient = require('../models/Pacientes')
const Cita = require('../models/Cita')
const User = require('../models/User')
const { syncAppointment, deleteAppointment } = require('../services/calendar.service')
const { fechaProgramable, requiereReiniciarRecordatorios, estadoPermitidoEnFecha } = require('../utils/citas.utils')
async function intentarSincronizar(cita) {
  try { return Boolean(await syncAppointment(cita)) }
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
async function validar(req, res, original = null) {
  const parsed = input.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Datos de cita inválidos', issues: parsed.error.issues }); return null }
  const data = parsed.data
  const inicio = new Date(data.inicio)
  const seCambioFecha = !original || inicio.getTime() !== new Date(original.inicio).getTime()
  if (!fechaProgramable(inicio, original?.inicio)) {
    res.status(400).json({ message: 'No se permite crear o reprogramar citas en fechas pasadas' })
    return null
  }
  if (data.estado === 'completada' && inicio > new Date()) {
    res.status(400).json({ message: 'Una cita solo puede marcarse completada después de su horario' })
    return null
  }
  if (!original && ['cancelada', 'completada'].includes(data.estado)) {
    res.status(400).json({ message: 'Las citas nuevas deben estar programadas o confirmadas' })
    return null
  }
  const fin = new Date(inicio.getTime() + 60 * 60 * 1000)
  const nutricionista = await User.findById(req.user._id).select('horarioLaboral').lean()
  const horario = nutricionista?.horarioLaboral
  // Si solo cambia el estado o las notas de una cita anterior, no exigir
  // que siga coincidiendo con el horario laboral configurado hoy.
  if (seCambioFecha && horario?.configurado && data.estado !== 'cancelada') {
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
    const cita = await Cita.findOne({ _id: req.params.id, nutritionist: req.user._id })
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    const data = await validar(req,res,cita); if (!data) return
    if (data.estado !== 'cancelada' && await conflicto(req.user._id, data.inicio, data.fin, cita._id))
      return res.status(409).json({ message: 'Ya existe una cita en ese horario' })

    const reiniciarRecordatorios = requiereReiniciarRecordatorios(cita, data)
    Object.assign(cita, data)
    if (reiniciarRecordatorios) {
      cita.recordatorio24hEnviado = null
      cita.recordatorio2hEnviado = null
    }
    await cita.save()
    const calendarSynced = await intentarSincronizar(cita)
    res.json({ ...cita.toObject(), calendarSynced })
  } catch(e) { next(e) }
})

const cambioEstadoSchema = z.object({
  estado: z.enum(['programada', 'confirmada', 'cancelada', 'completada']),
}).strict()

// Cambiar solo el estado no exige mover una cita pasada y no altera sus datos clínicos.
router.patch('/:id/estado', async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const parsed = cambioEstadoSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Estado de cita inválido' })
    const cita = await Cita.findOne({ _id: req.params.id, nutritionist: req.user._id })
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    const estado = parsed.data.estado
    if (estado === cita.estado) return res.json({ ...cita.toObject(), calendarSynced: true })
    const now = new Date()
    if (!estadoPermitidoEnFecha(estado, cita.inicio, now))
      return res.status(400).json({
        message: estado === 'completada'
          ? 'La cita todavía no puede marcarse completada'
          : 'Una cita pasada no puede reactivarse como próxima',
      })
    if (['programada','confirmada'].includes(estado) && await conflicto(req.user._id,cita.inicio,cita.fin,cita._id))
      return res.status(409).json({ message: 'Ya existe una cita en ese horario' })
    cita.estado = estado
    cita.recordatorio24hEnviado = null
    cita.recordatorio2hEnviado = null
    await cita.save()
    const calendarSynced = await intentarSincronizar(cita)
    res.json({ ...cita.toObject(), calendarSynced })
  } catch(e) { next(e) }
})

// Eliminar de forma definitiva con confirmación del cliente y propietario verificado.
router.delete('/:id', async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'ID inválido' })
    const cita = await Cita.findOne({ _id: req.params.id, nutritionist: req.user._id }).select('+calendarEventId')
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })

    let calendarSynced
    try {
      calendarSynced = await deleteAppointment(cita)
    } catch (error) {
      console.error('No se pudo retirar la cita de Google Calendar:', error.message)
      return res.status(502).json({
        message: 'Google Calendar no permitió eliminar la cita. No se eliminó en NutriA para evitar inconsistencias.',
      })
    }
    await cita.deleteOne()
    return res.json({
      message: 'Cita eliminada correctamente',
      calendarSynced,
    })
  } catch(e) { next(e) }
})

module.exports = router
