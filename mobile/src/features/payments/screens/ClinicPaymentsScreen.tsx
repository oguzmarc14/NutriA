import { showNotice } from '@/shared/ui/NoticeDialog'
import { useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { ApiError, request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { PaymentList } from '../PaymentList'
import { money, type Payment, type PaymentData } from '../models'

export default function ClinicPaymentsScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<PaymentData>(valid ? '/pagos/consultorio?pacienteId=' + patient : null)
  const { session } = useAuth()
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  useUnsavedChanges(false, !!reviewing)
  async function review(payment: Payment, status: 'confirmado' | 'rechazado') {
    if (!session || submitting.current || payment.estado !== 'reportado') return
    submitting.current = true; setReviewing(payment._id); setError('')
    try {
      await request('/pagos/consultorio/' + payment._id + '/estado', { token: session.token, method: 'PATCH', body: { estado: status } })
      resource.reload()
      showNotice('Reporte revisado', status === 'confirmado' ? 'Se confirmó la recepción del pago.' : 'El reporte quedó rechazado.', [{ text: 'Aceptar' }])
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) resource.reload()
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el reporte. Revisa su estado antes de intentarlo otra vez.')
    } finally { submitting.current = false; setReviewing(null) }
  }
  function confirm(payment: Payment, status: 'confirmado' | 'rechazado') {
    if (submitting.current) return
    showNotice(status === 'confirmado' ? 'Confirmar recepción del pago' : 'Rechazar reporte',
      `${resource.data?.paciente?.name || 'Paciente'} · ${money(payment.montoCentavos)} MXN\n${payment.concepto}\nFecha: ${payment.fechaPago.slice(0, 10)}\n${status === 'confirmado' ? 'Confirma únicamente si verificaste que recibiste el pago.' : 'El paciente verá este reporte como rechazado.'} Esta revisión no podrá cambiarse desde la app.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: status === 'confirmado' ? 'Confirmar recepción' : 'Rechazar reporte', style: status === 'confirmado' ? 'default' : 'destructive', onPress: () => void review(payment, status) },
      ])
  }
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para revisar sus pagos.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'payments' } })} /></Page>
  return <Page bottomInset>
    <Text style={styles.title}>{resource.data?.paciente?.name || 'Pagos del paciente'}</Text>
    <Text style={styles.body}>Revisa los pagos reportados por el paciente y confirma los que hayas recibido.</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {reviewing ? <Text style={styles.body}>Actualizando reporte…</Text> : <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />}
    {resource.data && <PaymentList payments={resource.data.pagos} reviewing={reviewing} onReview={confirm} />}
  </Page>
}
