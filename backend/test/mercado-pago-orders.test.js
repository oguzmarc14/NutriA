const assert = require('node:assert/strict')
const { test } = require('node:test')
const { cardOrder, orderResult } = require('../src/services/mercadoPagoOrders')

const expected = { cents: 12550, reference: 'reserva-ficticia' }
const approved = {
  id: 'ORD01TEST',
  external_reference: expected.reference,
  total_amount: '125.50',
  status: 'processed',
  currency_id: 'MXN',
  transactions: { payments: [{ amount: '125.50', status: 'processed', status_detail: 'accredited' }] },
}

test('prepara una orden de tarjeta con el importe exacto de la reserva', () => {
  const body = cardOrder({
    ...expected,
    email: 'sandbox@example.test',
    card: { type: 'credit_card', payment_method_id: 'master', token: 'token-ficticio', installments: 1 },
  })
  assert.equal(body.total_amount, '125.50')
  assert.equal(body.external_reference, expected.reference)
  assert.deepEqual(body.transactions.payments[0], {
    amount: '125.50',
    payment_method: { id: 'master', type: 'credit_card', token: 'token-ficticio', installments: 1 },
  })
  assert.throws(() => cardOrder({ ...expected, cents: 0, card: {} }), /Importe/)
})

test('solo confirma una orden con referencia, importe y transacción acreditada', () => {
  assert.deepEqual(orderResult(approved, expected), { id: approved.id, status: 'approved' })
  assert.equal(orderResult({ ...approved, external_reference: 'otra' }, expected), null)
  assert.equal(orderResult({ ...approved, total_amount: '150.00' }, expected).status, 'review')
  const pending = { ...approved, transactions: { payments: [{ amount: '125.50', status: 'action_required' }] } }
  assert.equal(orderResult(pending, expected).status, 'processing')
  assert.equal(orderResult({ ...approved, status: 'canceled' }, expected).status, 'rejected')
})
