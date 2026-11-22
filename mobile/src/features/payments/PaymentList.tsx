import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { methods, money, paymentTotals, statuses, type Payment, type PaymentStatus } from './models'

export function PaymentList({ payments, reviewing, onReview }: {
  payments: Payment[]; reviewing?: string | null; onReview?: (payment: Payment, status: 'confirmado' | 'rechazado') => void
}) {
  const [filter, setFilter] = useState<PaymentStatus | 'todos'>('todos')
  const totals = paymentTotals(payments)
  const visible = payments.filter(payment => filter === 'todos' || payment.estado === filter)
  return <>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Resumen de reportes cargados · MXN</Text>
      <Text style={styles.body}>Por revisar: {money(totals.reportado)}</Text>
      <Text style={styles.body}>Confirmados: {money(totals.confirmado)}</Text>
      <Text style={styles.body}>Rechazados: {money(totals.rechazado)}</Text>
      <Text style={styles.body}>Se muestran hasta los últimos 200 reportes. Estos importes no representan un saldo pendiente.</Text>
    </View>
    <View style={styles.row}>
      <Button expand disabled={!!reviewing} selected={filter === 'todos'} label="Todos" onPress={() => setFilter('todos')} />
      {Object.entries(statuses).map(([value, label]) => <Button expand key={value} disabled={!!reviewing} selected={filter === value} label={label} onPress={() => setFilter(value as PaymentStatus)} />)}
    </View>
    {!visible.length && <Text style={styles.body}>No hay pagos en esta categoría.</Text>}
    {visible.map(payment => <View key={payment._id} style={[styles.card, { gap: 10 }]}>
      <Text style={styles.cardTitle}>{money(payment.montoCentavos)} {payment.moneda}</Text>
      <Text style={styles.body}>{payment.concepto}</Text>
      <Text style={styles.body}>{payment.fechaPago.slice(0, 10)} · {methods[payment.metodo]} · {statuses[payment.estado]}</Text>
      {!!payment.referencia && <Text style={styles.body}>Referencia: {payment.referencia}</Text>}
      {!!payment.revisadoAt && <Text style={styles.body}>Revisado: {payment.revisadoAt.slice(0, 10)}</Text>}
      {onReview && payment.estado === 'reportado' && <>
        <Button disabled={!!reviewing} label={reviewing === payment._id ? 'Actualizando…' : 'Confirmar recepción'} onPress={() => onReview(payment, 'confirmado')} />
        <Button selected={false} disabled={!!reviewing} label="Rechazar reporte" onPress={() => onReview(payment, 'rechazado')} />
      </>}
    </View>)}
  </>
}
