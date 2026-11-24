const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function bookingFixture({ blocked = false } = {}) {
  const date = new Date(Date.now() + 86400000)
  const current = {
    _id: 'reserva', merchant: '123', nutritionist: 'nutriologo', patient: 'paciente', buyer: 'cuenta',
    inicio: date, fin: new Date(+date + 3600000), zonaHoraria: 'America/Mexico_City',
    tipo: 'primera', montoCentavos: 75000, status: 'processing',
    save: async () => {},
  }
  const appointments = [], notices = []
  const deps = {
    mongoose: { connection: { transaction: fn => fn({}) } },
    'node:crypto': crypto,
    '../models/User': { updateOne: async () => {}, findOne: () => ({ session: () => ({
      lean: async () => ({ horarioCitas: { publicado: true }, horarioLaboral: { configurado: true } }),
    }) }) },
    '../models/Pacientes': { exists: () => ({ session: async () => true }) },
    '../models/Cita': { exists: () => ({ session: async () => blocked }), create: async data => {
      appointments.push(...data)
      return [{ _id: 'cita' }]
    } },
    '../models/Notification': { create: async data => notices.push(...data) },
    '../models/AgendaCheckout': { Booking: {
      findOne: ({ _id, merchant }) => ({
        then: resolve => resolve(_id === current._id && merchant === current.merchant ? current : null),
        session: async () => current,
      }),
      exists: () => ({ session: async () => false }),
    } },
    '../utils/agenda-publica.utils': {
      partesLocales: () => ({ fecha: '2026-12-10' }),
      construirDisponibilidad: () => [{ inicio: date.toISOString() }],
    },
    './mercadoPago.service': {},
    './push.service': {},
    './calendar.service': {},
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/agendaCheckout.service.js'), 'utf8'), {
    module, require: name => { assert.ok(deps[name], name); return deps[name] },
  })
  const payment = { id: 123456, external_reference: 'reserva', collector_id: 123, currency_id: 'MXN', transaction_amount: 750, status: 'approved' }
  return { ...module.exports, current, appointments, notices, payment }
}

test('el pago aprobado crea una cita y dos avisos, aun con webhook repetido', async () => {
  const f = bookingFixture()
  await f.applyPayment('123', f.payment)
  await f.applyPayment('123', f.payment)
  assert.equal(f.current.status, 'confirmed')
  assert.equal(f.appointments.length, 1)
  assert.equal(f.appointments[0].montoPagadoCentavos, 75000)
  assert.equal(f.notices.length, 2)
})

test('un horario ocupado o un importe distinto genera revisión, sin crear otra cita', async () => {
  for (const blocked of [false, true]) {
    const f = bookingFixture({ blocked })
    await f.applyPayment('123', { ...f.payment, transaction_amount: blocked ? 750 : 1 })
    assert.equal(f.current.status, 'review')
    assert.equal(f.appointments.length, 0)
    assert.equal(f.notices.length, 2)
  }
})

test('la cuenta receptora y la referencia deben coincidir antes de registrar el cobro', async () => {
  const f = bookingFixture()
  await f.applyPayment('123', { ...f.payment, collector_id: 999 })
  await f.applyPayment('123', { ...f.payment, external_reference: 'otra' })
  assert.equal(f.current.status, 'processing')
  assert.equal(f.notices.length, 0)
})

test('un rechazo libera la reserva para una nueva elección', async () => {
  const f = bookingFixture()
  await f.applyPayment('123', { ...f.payment, status: 'rejected' })
  assert.equal(f.current.status, 'rejected')
  assert.equal(f.appointments.length, 0)
})

test('un webhook alterado o vencido no puede confirmar un pago', () => {
  const env = {
    MP_CLIENT_ID: 'test', MP_CLIENT_SECRET: 'test', MP_WEBHOOK_SECRET: 'test-webhook',
    MP_REDIRECT_URI: 'https://app.example/callback', MP_WEBHOOK_URL: 'https://app.example/webhook',
    MP_ENCRYPTION_KEY: 'a'.repeat(64),
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/mercadoPago.service.js'), 'utf8'), {
    module, process: { env }, Buffer,
    require: name => name === 'node:crypto' ? crypto : {},
  })
  const { validWebhook } = module.exports
  const id = '123456', requestId = 'req-test'
  const signature = timestamp => 'ts=' + timestamp + ',v1=' + crypto.createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update('id:' + id + ';request-id:' + requestId + ';ts:' + timestamp + ';').digest('hex')
  const now = Date.now()
  assert.equal(validWebhook({ id, requestId, signature: signature(now) }), true)
  assert.equal(validWebhook({ id: '123457', requestId, signature: signature(now) }), false)
  assert.equal(validWebhook({ id, requestId, signature: signature(now - 15 * 60000) }), false)
})
