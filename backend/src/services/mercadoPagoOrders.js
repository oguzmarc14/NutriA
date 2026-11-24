const orderIdPattern = /^[a-z0-9_-]{1,100}$/i

function cardOrder({ reference, cents, email, card }) {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new TypeError('Importe de la orden inválido.')
  if (!['credit_card', 'debit_card'].includes(card.type)) throw new TypeError('Tipo de tarjeta inválido.')
  const amount = (cents / 100).toFixed(2)
  return {
    type: 'online',
    processing_mode: 'automatic',
    external_reference: reference,
    total_amount: amount,
    description: 'Consulta NutriA',
    payer: { email },
    transactions: { payments: [{
      amount,
      payment_method: { id: card.payment_method_id, type: card.type, token: card.token, installments: card.installments },
    }] },
  }
}

function orderResult(order, { reference, cents }) {
  if (!orderIdPattern.test(order?.id || '') || order.external_reference !== reference) return null
  if (['failed', 'canceled'].includes(order.status)) return { id: order.id, status: 'rejected' }
  const payments = order.transactions?.payments
  if (order.status !== 'processed' || payments?.[0]?.status !== 'processed' ||
      payments[0].status_detail !== 'accredited') return { id: order.id, status: 'processing' }
  const amount = (cents / 100).toFixed(2)
  if ((order.currency ?? order.currency_id) !== 'MXN' || payments?.length !== 1 || order.total_amount !== amount || payments[0].amount !== amount) {
    return { id: order.id, status: 'review' }
  }
  return { id: order.id, status: 'approved' }
}

module.exports = { cardOrder, orderResult, orderIdPattern }
