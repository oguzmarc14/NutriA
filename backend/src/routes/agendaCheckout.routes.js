const crypto = require('node:crypto')
const express = require('express')
const { z } = require('zod')
const User = require('../models/User')
const Cita = require('../models/Cita')
const { Booking, Seller } = require('../models/AgendaCheckout')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const mp = require('../services/mercadoPago.service')
const checkout = require('../services/agendaCheckout.service')

const router = express.Router()
const staff = [requireAuth, allowRoles('nutritionist')]
const patient = [requireAuth, allowRoles('patient')]
const objectId = z.string().regex(/^[a-f0-9]{24}$/i)
const bookingId = z.string().regex(/^[a-f0-9-]{36}\.[a-zA-Z0-9_-]{43}$/)
function bookingKey(id) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update('agenda-checkout:' + id).digest('base64url')
}
const cents = z.number().int().min(0).max(10000000)
const prices = z.object({ primeraCentavos: cents, seguimientoCentavos: cents }).strict()
const reserveInput = z.object({ nutritionist: objectId, inicio: z.iso.datetime({ offset: true }), montoCentavos: cents }).strict()
const card = z.object({
  token: z.string().min(12).max(512),
  payment_method_id: z.string().regex(/^[a-z0-9_-]{1,40}$/i),
  issuer_id: z.coerce.string().regex(/^\d{1,20}$/).optional(),
  installments: z.number().int().min(1).max(1),
}).strict()
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

function validated(schema, input) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw checkout.fail(400, 'Datos de pago o reserva inválidos.')
  return parsed.data
}

router.get('/configuracion', ...staff, async (req, res) => {
  const seller = await Seller.exists({ nutritionist: req.user._id })
  const settings = req.user.cobrosAgenda
  res.json({ habilitado: mp.configured(), conectado: Boolean(seller),
    primeraCentavos: settings?.primeraCentavos || 0, seguimientoCentavos: settings?.seguimientoCentavos || 0 })
})
router.put('/configuracion', ...staff, async (req, res) => {
  const values = validated(prices, req.body)
  await User.updateOne({ _id: req.user._id }, { $set: {
    'cobrosAgenda.primeraCentavos': values.primeraCentavos,
    'cobrosAgenda.seguimientoCentavos': values.seguimientoCentavos,
  } })
  res.json(values)
})
router.get('/conectar', ...staff, (req, res) => res.json({ url: mp.authorize(req.user._id) }))
router.get('/callback', async (req, res) => {
  const page = new URL('/mi-clinica', process.env.CLIENT_URL || 'http://localhost:5173')
  try {
    await mp.connect(req.query.code, req.query.state, id => User.exists({ _id: id, role: 'nutritionist', active: true }))
    page.searchParams.set('mercadoPago', 'conectado')
  } catch { page.searchParams.set('mercadoPago', 'error') }
  res.redirect(page.toString())
})

router.get('/tarifa/:nutritionist', ...patient, async (req, res) => {
  const nutritionist = validated(objectId, req.params.nutritionist)
  const { tipo, montoCentavos } = await checkout.quote(req.user, nutritionist)
  res.json({ tipo, montoCentavos, moneda: 'MXN' })
})
function summary(booking) {
  return {
    status: booking.status === 'reserved' && +booking.expiresAt <= Date.now() ? 'expired' : booking.status,
    montoCentavos: booking.montoCentavos, tipo: booking.tipo, inicio: booking.inicio,
    zonaHoraria: booking.zonaHoraria, expiresAt: booking.expiresAt,
    ...(booking.status === 'processing' && booking.challengeUrl && booking.challengeRequest && {
      challenge: { url: booking.challengeUrl, creq: booking.challengeRequest },
    }),
  }
}
router.post('/reservar', ...patient, async (req, res) => {
  const data = validated(reserveInput, req.body)
  const booking = await checkout.reserve(req.user, data.nutritionist, data.inicio, data.montoCentavos)
  res.status(201).json({ reserva: booking._id + '.' + bookingKey(booking._id), ...summary(booking) })
})
async function loadBooking(req) {
  const [id, signature] = validated(bookingId, req.get('X-Booking-Token')).split('.')
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(bookingKey(id))))
    throw checkout.fail(404, 'Reserva no disponible.')
  const booking = await Booking.findById(id)
  if (!booking) throw checkout.fail(404, 'Reserva no disponible.')
  return booking
}
router.get('/reserva', async (req, res) => {
  const booking = await loadBooking(req)
  const seller = booking.status === 'reserved' && +booking.expiresAt > Date.now()
    ? await Seller.findOne({ nutritionist: booking.nutritionist, merchant: booking.merchant }).lean() : null
  res.json({ ...summary(booking), publicKey: seller?.publicKey })
})
router.post('/pagar', async (req, res) => {
  const data = validated(card, req.body)
  const booking = await loadBooking(req)
  if (booking.status !== 'reserved' || +booking.expiresAt <= Date.now()) return res.json(summary(booking))
  const buyer = await User.findOne({ _id: booking.buyer, active: true, role: 'patient', patient: booking.patient }).select('email').lean()
  if (!buyer?.email) throw checkout.fail(403, 'La cuenta del paciente ya no está disponible.')
  const access = await mp.accessFor(booking.merchant)
  const started = await Booking.findOneAndUpdate({
    _id: booking._id, status: 'reserved', expiresAt: { $gt: new Date() },
  }, { $set: { status: 'processing', nextCheckAt: new Date(Date.now() + 30000) } }, { new: true })
  if (!started) return res.json(summary(await loadBooking(req)))
  let payment
  try {
    payment = await mp.provider('/v1/payments', { access, idempotency: booking._id, body: {
      ...data, transaction_amount: booking.montoCentavos / 100, description: 'Consulta NutriA',
      payer: { email: buyer.email }, external_reference: booking._id,
      notification_url: process.env.MP_WEBHOOK_URL, three_d_secure_mode: 'optional',
      capture: true, binary_mode: false,
    } })
  } catch (error) {
    if ([400, 422].includes(error.providerStatus)) {
      await Booking.updateOne({ _id: booking._id, status: 'processing', paymentId: { $exists: false } }, { status: 'rejected' })
    }
    return res.json(summary(await loadBooking(req)))
  }
  const current = await checkout.applyPayment(booking.merchant, payment) || await loadBooking(req)
  res.json(summary(current))
})
router.post('/webhook', async (req, res) => {
  const id = String(req.query['data.id'] || '')
  if (req.query.type !== 'payment' || !mp.validWebhook({ id, requestId: req.get('x-request-id'), signature: req.get('x-signature') })) return res.sendStatus(401)
  const merchant = String(req.body?.user_id || '')
  if (!/^\d{1,24}$/.test(merchant) || !await Seller.exists({ merchant })) return res.sendStatus(200)
  await checkout.verifiedPayment(merchant, id)
  res.sendStatus(200)
})

router.get('/revision', ...staff, async (req, res) => {
  const reviews = await Booking.find({ nutritionist: req.user._id, status: 'review' })
    .select('inicio zonaHoraria tipo montoCentavos paymentId changeReason patient').populate('patient', 'name').sort({ createdAt: -1 }).limit(50).lean()
  const citas = await Cita.find({ nutritionist: req.user._id, estado: 'confirmada',
    cobroAgenda: { $exists: true }, enteradoAt: null,
  }).select('inicio zonaHoraria tipo montoPagadoCentavos patient').populate('patient', 'name').sort({ inicio: 1 }).limit(50).lean()
  res.json({ reviews, citas })
})
router.patch('/citas/:id/enterado', ...staff, async (req, res) => {
  const id = validated(objectId, req.params.id)
  const filtro = { _id: id, nutritionist: req.user._id, cobroAgenda: { $exists: true } }
  const updated = await Cita.findOneAndUpdate({ ...filtro, enteradoAt: null }, { enteradoAt: new Date() }, { new: true }) ||
    await Cita.findOne(filtro)
  if (!updated) return res.status(404).json({ message: 'Cita pagada no encontrada.' })
  res.json({ enteradoAt: updated.enteradoAt })
})

router.use((error, _req, res, _next) => {
  const status = error.status || (error.providerStatus ? 502 : 500)
  if (status >= 500 && status !== 503) console.error('Falló agenda-cobros:', error.name)
  res.status(status).json({ message: status < 500 || status === 503
    ? error.message : 'No se pudo completar esta operación. Consulta el estado antes de intentarlo otra vez.' })
})

module.exports = router
