import { validCalendarDay } from '../../shared/utils/dates.ts'
export const methods = { transferencia: 'Transferencia', efectivo: 'Efectivo', deposito: 'Depósito', otro: 'Otro' } as const
export const statuses = { reportado: 'Por revisar', confirmado: 'Confirmado', rechazado: 'Rechazado' } as const
export type PaymentStatus = keyof typeof statuses
export type Payment = { _id: string; montoCentavos: number; moneda: string; metodo: keyof typeof methods;
  fechaPago: string; estado: PaymentStatus; referencia: string; concepto: string; revisadoAt?: string; createdAt: string }
export type PaymentData = { pagos: Payment[]; paciente?: { _id: string; name: string } }
export const money = (cents: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
export function amountToCents(value: string): number {
  const text = value.trim()
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) throw new Error('Escribe el importe sin separadores de miles y con un máximo de dos decimales.')
  const [whole, decimal = ''] = text.replace(',', '.').split('.')
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 10000000) throw new Error('El importe debe ser mayor que cero y no superar $100,000 MXN.')
  return cents
}
export function paymentPayload(form: { amount: string; method: string; date: string; reference: string; concept: string }, today: string) {
  const cents = amountToCents(form.amount)
  if (!validCalendarDay(form.date) || form.date > today) throw new Error('La fecha debe ser válida y no puede estar en el futuro.')
  if (!Object.hasOwn(methods, form.method)) throw new Error('Selecciona el método de pago.')
  if (form.reference.trim().length > 80 || form.concept.trim().length < 2 || form.concept.trim().length > 120) throw new Error('Revisa el concepto (2 a 120 caracteres) y la referencia (hasta 80).')
  return { monto: cents / 100, metodo: form.method, fechaPago: form.date, referencia: form.reference.trim(), concepto: form.concept.trim() }
}
export function paymentTotals(payments: Payment[]) {
  const totals = { reportado: 0, confirmado: 0, rechazado: 0 }
  for (const payment of payments) if (payment.moneda === 'MXN' && Object.hasOwn(totals, payment.estado) && Number.isSafeInteger(payment.montoCentavos) && payment.montoCentavos > 0) totals[payment.estado] += payment.montoCentavos
  return totals
}
