const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')
const User = require('../models/User')
const Patient = require('../models/Pacientes')
const Cita = require('../models/Cita')
const Notice = require('../models/Notification')
const { Seller, Booking } = require('../models/AgendaCheckout')
const { partesLocales, sumarDias, construirDisponibilidad } = require('../utils/agenda-publica.utils')
const mp = require('./mercadoPago.service')
const { sendAppointmentPush } = require('./push.service')
const { syncAppointment } = require('./calendar.service')

const activeHolds = ['reserved', 'processing']
const fail = (status, message) => Object.assign(new Error(message), { status })

async function lockClinic(nutritionist, action) {
  return mongoose.connection.transaction(async session => {
    await User.updateOne({ _id: nutritionist }, { $inc: { revisionAgenda: 1 } }, { session })
    return action(session)
  })
}

function overlap(inicio, fin) {
  return { inicio: { $lt: fin }, fin: { $gt: inicio } }
}

async function publicCheckoutEnabled(user) {
  return mp.configured() && Boolean(user.cobrosAgenda?.primeraCentavos || user.cobrosAgenda?.seguimientoCentavos) &&
    Boolean(await Seller.exists({ nutritionist: user._id }))
}

function visibleHolds(nutritionist, desde, hasta) {
  return Booking.find({ nutritionist, ...overlap(desde, hasta), status: { $in: activeHolds },
    expiresAt: { $gt: new Date() },
  }).select('inicio fin -_id').lean()
}

async function occupied(nutritionist, inicio, fin, { session, excludeBooking, excludeAppointment } = {}) {
  const rango = overlap(inicio, fin)
  const cita = await Cita.exists({ nutritionist, ...rango, estado: { $ne: 'cancelada' },
    ...(excludeAppointment && { _id: { $ne: excludeAppointment } }),
  }).session(session || null)
  if (cita) return true
  return Boolean(await Booking.exists({ nutritionist, ...rango, status: { $in: activeHolds },
    expiresAt: { $gt: new Date() }, ...(excludeBooking && { _id: { $ne: excludeBooking } }),
  }).session(session || null))
}

async function quote(user, nutritionist, session) {
  const clinic = await User.findOne({ _id: nutritionist, active: true, role: 'nutritionist' }).session(session || null).lean()
  const patient = await Patient.findOne({ _id: user.patient, active: true, nutritionist }).session(session || null).lean()
  const seller = await Seller.findOne({ nutritionist }).session(session || null).lean()
  if (!patient) throw fail(403, 'Inicia sesión con la cuenta de paciente de este consultorio.')
  if (!mp.configured() || !seller || !clinic?.horarioCitas?.publicado || !clinic?.horarioLaboral?.configurado) {
    throw fail(503, 'El pago en línea no está disponible en esta agenda.')
  }
  const seguimiento = await Cita.exists({ nutritionist, patient: patient._id, estado: 'completada' }).session(session || null)
  const tipo = seguimiento ? 'seguimiento' : 'primera'
  const montoCentavos = clinic.cobrosAgenda?.[tipo + 'Centavos']
  if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) throw fail(409, 'El consultorio aún no configuró esta tarifa.')
  return { clinic, patient, seller, tipo, montoCentavos }
}

async function reserve(user, nutritionist, instant, expectedAmount) {
  return lockClinic(nutritionist, async session => {
    const { clinic, patient, seller, tipo, montoCentavos } = await quote(user, nutritionist, session)
    if (expectedAmount !== montoCentavos) throw fail(409, 'El precio cambió. Vuelve a consultar la tarifa.')
    const zonaHoraria = clinic.horarioLaboral.zonaHoraria
    const now = new Date()
    const inicio = new Date(instant)
    const fin = new Date(+inicio + 3600000)
    const { fecha } = partesLocales(inicio, zonaHoraria)
    if (fecha > sumarDias(partesLocales(now, zonaHoraria).fecha, 30) ||
        !construirDisponibilidad(fecha, clinic.horarioCitas, clinic.horarioLaboral, [], now)
          .some(slot => slot.inicio === inicio.toISOString())) {
      throw fail(409, 'Ese horario dejó de estar disponible.')
    }
    const existing = await Booking.findOne({ buyer: user._id, nutritionist, inicio,
      status: { $in: activeHolds }, expiresAt: { $gt: now } }).session(session)
    if (existing) {
      if (existing.montoCentavos !== montoCentavos) throw fail(409, 'Ya tienes una reserva con otra tarifa. Espera a que expire.')
      return existing
    }
    if (await Booking.exists({ buyer: user._id, status: { $in: activeHolds }, expiresAt: { $gt: now } }).session(session)) {
      throw fail(409, 'Ya tienes una reserva en curso. Termina ese pago o espera a que venza.')
    }
    if (await occupied(nutritionist, inicio, fin, { session })) throw fail(409, 'Alguien ya apartó este horario.')
    const [booking] = await Booking.create([{
      _id: randomUUID(), merchant: seller.merchant, nutritionist, buyer: user._id, patient: patient._id,
      inicio, fin, zonaHoraria, tipo, montoCentavos, expiresAt: new Date(+now + 15 * 60000),
    }], { session })
    return booking
  })
}

async function applyPayment(merchant, payment) {
  if (!payment?.external_reference || !/^\d+$/.test(String(payment.id)) || String(payment.collector_id) !== merchant) return
  const booking = await Booking.findOne({ _id: payment.external_reference, merchant })
  if (!booking) return
  return lockClinic(booking.nutritionist, async session => {
    const current = await Booking.findOne({ _id: booking._id, merchant }).session(session)
    if (!current || current.status !== 'processing' || (current.paymentId && current.paymentId !== String(payment.id))) return
    current.paymentId = String(payment.id)
    const challenge = payment.status_detail === 'pending_challenge' && payment.three_ds_info
    current.challengeUrl = challenge && /^https:\/\//.test(challenge.external_resource_url || '')
      ? challenge.external_resource_url : undefined
    current.challengeRequest = current.challengeUrl && typeof challenge.creq === 'string'
      ? challenge.creq : undefined
    if (['rejected', 'cancelled'].includes(payment.status)) {
      current.status = 'rejected'
    } else if (payment.status === 'approved') {
      const amountOK = payment.currency_id === 'MXN' && Math.round(Number(payment.transaction_amount) * 100) === current.montoCentavos
      const activePatient = await Patient.exists({ _id: current.patient, nutritionist: current.nutritionist, active: true }).session(session)
      const clinic = await User.findOne({ _id: current.nutritionist, role: 'nutritionist', active: true }).session(session).lean()
      const start = new Date(current.inicio)
      const validSchedule = clinic?.horarioCitas?.publicado && clinic?.horarioLaboral?.configurado &&
        construirDisponibilidad(partesLocales(start, current.zonaHoraria).fecha, clinic.horarioCitas,
          clinic.horarioLaboral, [], new Date(+start - 4 * 86400000)).some(slot => slot.inicio === start.toISOString())
      const blocked = !activePatient || !validSchedule || +start <= Date.now() ||
        await occupied(current.nutritionist, current.inicio, current.fin, { session, excludeBooking: current._id })
      if (!amountOK || blocked) {
        current.status = 'review'
        current.changeReason = !amountOK ? 'El importe de Mercado Pago difiere de la reserva.' : 'El horario ya no está disponible.'
      } else {
        const [appointment] = await Cita.create([{
          nutritionist: current.nutritionist, patient: current.patient, inicio: current.inicio, fin: current.fin,
          zonaHoraria: current.zonaHoraria, tipo: current.tipo, estado: 'confirmada',
          cobroAgenda: current._id, montoPagadoCentavos: current.montoCentavos,
        }], { session })
        current.status = 'confirmed'
        current.cita = appointment._id
      }
      current.notifyAt = new Date()
      const confirmed = current.status === 'confirmed'
      const title = confirmed ? 'Cita confirmada y pagada' : 'Pago recibido · Requiere revisión'
      await Notice.create([
        { user: current.nutritionist, route: '/citas',
          detalle: confirmed ? 'Abre tu agenda y marca la cita como enterado.' : 'Abre Citas para revisar el pago y resolver el horario.' },
        { user: current.buyer, route: '/mis-citas',
          detalle: confirmed ? 'Tu pago fue aprobado y la cita ya aparece en Mis citas.' : 'Recibimos tu pago. El consultorio revisará tu cita.' },
      ].map(notice => ({ ...notice, kind: 'nutria-appointment', titulo: title, expiresAt: new Date(Date.now() + 30 * 86400000) })), { session })
    } else {
      current.nextCheckAt = new Date(Date.now() + 60000)
    }
    await current.save({ session })
    return current
  })
}

async function verifiedPayment(merchant, paymentId) {
  const access = await mp.accessFor(merchant)
  const payment = await mp.provider('/v1/payments/' + paymentId, { access })
  return applyPayment(merchant, payment)
}

let checking = false
async function reconcile() {
  if (checking || !mp.configured()) return
  checking = true
  try {
    const pendingNotices = await Booking.find({ notifyAt: { $lte: new Date() } }).sort({ notifyAt: 1 }).limit(12).lean()
    for (const item of pendingNotices) {
      const claimed = await Booking.updateOne({ _id: item._id, notifyAt: item.notifyAt }, { notifyAt: new Date(Date.now() + 180000) })
      if (!claimed.modifiedCount) continue
      try {
        await sendAppointmentPush([{ user: item.nutritionist, route: '/citas' }, { user: item.buyer, route: '/mis-citas' }])
        if (item.cita) {
          const cita = await Cita.findById(item.cita)
          if (cita) await syncAppointment(cita).catch(() => {})
        }
        await Booking.updateOne({ _id: item._id }, { $unset: { notifyAt: 1 } })
      } catch { /* Persistent in-app notices already exist. Retry the push delivery later. */ }
    }
    const pending = await Booking.find({ status: 'processing', nextCheckAt: { $lte: new Date() },
      createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
    }).sort({ nextCheckAt: 1 }).limit(12).lean()
    for (const booking of pending) {
      await Booking.updateOne({ _id: booking._id, status: 'processing' }, { nextCheckAt: new Date(Date.now() + 120000) })
      try {
        if (booking.paymentId) await verifiedPayment(booking.merchant, booking.paymentId)
        else {
          const access = await mp.accessFor(booking.merchant)
          const result = await mp.provider('/v1/payments/search?' + new URLSearchParams({ external_reference: booking._id }), { access })
          const payment = result.results?.find(item => item.external_reference === booking._id)
          if (payment) await verifiedPayment(booking.merchant, String(payment.id))
        }
      } catch { /* Webhooks and subsequent scheduled checks can recover a connection failure. */ }
    }
  } finally { checking = false }
}

module.exports = { fail, lockClinic, occupied, visibleHolds, publicCheckoutEnabled, quote, reserve, applyPayment, verifiedPayment, reconcile }
