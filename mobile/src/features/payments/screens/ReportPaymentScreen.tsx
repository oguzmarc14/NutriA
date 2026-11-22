import { useRef, useState } from 'react'
import { router } from 'expo-router'
import { Alert, Text } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { FormField } from '@/shared/ui/FormField'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { todayLocal } from '@/shared/utils/dates'
import { methods, money, paymentPayload } from '../models'

export default function ReportPaymentScreen() {
  const { session } = useAuth()
  const [form, setForm] = useState({ amount: '', method: '', date: todayLocal(), reference: '', concept: 'Consulta nutricional' })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  useUnsavedChanges(dirty, busy)
  function change(key: keyof typeof form, value: string) { setForm(previous => ({ ...previous, [key]: value })); setDirty(true); setError('') }
  async function submit(body: ReturnType<typeof paymentPayload>) {
    if (!session || submitting.current || sent) return
    submitting.current = true; setBusy(true); setError('')
    try {
      await request('/pagos/mios', { token: session.token, body })
      setSent(true); setDirty(false)
      Alert.alert('Pago reportado', 'Tu reporte quedó pendiente de revisión por tu nutrióloga.', [{ text: 'Aceptar' }])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo confirmar el reporte. Consulta tu historial antes de volver a enviarlo.') }
    finally { submitting.current = false; setBusy(false) }
  }
  function confirm() {
    if (busy || sent) return
    try {
      const body = paymentPayload(form, todayLocal())
      Alert.alert('Confirmar reporte', `${money(Math.round(body.monto * 100))} MXN · ${methods[body.metodo as keyof typeof methods]}\nFecha: ${body.fechaPago}\n${body.concepto}\n¿Reportar este pago?`, [
        { text: 'Revisar datos', style: 'cancel' }, { text: 'Reportar', onPress: () => void submit(body) },
      ])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa los datos del pago.') }
  }
  return <Page bottomInset>
    <Text style={styles.title}>Reportar un pago</Text>
    <Text style={styles.body}>Registra únicamente un pago que ya realizaste. La nutrióloga revisará su recepción.</Text>
    <FormField label="Importe en MXN (sin separadores de miles)" numeric disabled={busy || sent} value={form.amount} onChange={value => change('amount', value)} />
    <FormField label="Fecha del pago (AAAA-MM-DD)" disabled={busy || sent} value={form.date} onChange={value => change('date', value)} />
    <Text style={styles.cardTitle}>Método de pago</Text>
    {Object.entries(methods).map(([value, label]) => <Button key={value} disabled={busy || sent} selected={form.method === value} label={label} onPress={() => change('method', value)} />)}
    <FormField label="Concepto (2 a 120 caracteres)" disabled={busy || sent} value={form.concept} onChange={value => change('concept', value)} />
    <FormField label="Referencia · opcional (hasta 80 caracteres)" disabled={busy || sent} value={form.reference} onChange={value => change('reference', value)} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {sent ? <Text accessibilityRole="alert" style={styles.body}>Reporte enviado. Puedes consultar su estado en Mis pagos.</Text> : <Button label={busy ? 'Enviando…' : 'Revisar y reportar pago'} disabled={busy || !dirty} onPress={confirm} />}
    <Button selected={false} disabled={busy} label="Ver mis pagos" onPress={() => router.canGoBack() ? router.back() : router.replace('/mis-pagos')} />
  </Page>
}
