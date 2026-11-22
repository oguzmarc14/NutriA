import test from 'node:test'
import assert from 'node:assert/strict'
import { amountToCents, paymentPayload, paymentTotals } from '../src/features/payments/models.ts'

test('money input converts decimal comma and point into exact cents', () => {
  assert.equal(amountToCents('125,50'), 12550)
  assert.equal(amountToCents('0.01'), 1)
  assert.equal(amountToCents('100000'), 10000000)
  assert.equal(amountToCents(' 19.9 '), 1990)
  assert.equal(amountToCents('0.29'), 29)
})
test('invalid money never silently rounds or treats thousands separators as decimal amounts', () => {
  for (const value of ['', '0', '-1', '1,000', '1.000', '1e3', '0.001', 'NaN', 'Infinity', '100000.01', '1 000']) assert.throws(() => amountToCents(value), value)
})
const form = { amount: '125,50', method: 'transferencia', date: '2026-11-21', reference: ' ABC ', concept: ' Consulta ' }
test('payment report preserves exact data and never supplies ownership or confirmation state', () => {
  assert.deepEqual(paymentPayload(form, '2026-11-21'), { monto: 125.5, metodo: 'transferencia', fechaPago: '2026-11-21', referencia: 'ABC', concepto: 'Consulta' })
})
test('future dates, impossible dates and unknown methods are rejected before submission', () => {
  assert.throws(() => paymentPayload({ ...form, date: '2026-11-22' }, '2026-11-21'))
  assert.throws(() => paymentPayload({ ...form, date: '2026-02-30' }, '2026-11-21'))
  assert.throws(() => paymentPayload({ ...form, method: 'constructor' }, '2026-11-21'))
  assert.throws(() => paymentPayload({ ...form, reference: 'x'.repeat(81) }, '2026-11-21'))
  assert.throws(() => paymentPayload({ ...form, concept: 'x' }, '2026-11-21'))
})
test('reported, confirmed and rejected amounts remain separate and unknown currency is not converted', () => {
  const rows = [{ montoCentavos: 12550, moneda: 'MXN', estado: 'reportado' }, { montoCentavos: 10000, moneda: 'MXN', estado: 'confirmado' },
    { montoCentavos: 500, moneda: 'MXN', estado: 'rechazado' }, { montoCentavos: 99999, moneda: 'USD', estado: 'confirmado' }]
  assert.deepEqual(paymentTotals(rows), { reportado: 12550, confirmado: 10000, rechazado: 500 })
})
