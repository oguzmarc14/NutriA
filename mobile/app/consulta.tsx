import { useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { ApiError, request } from '../src/api'
import { useAuth } from '../src/auth'
import { appointmentPath, dateTime, type Appointment } from '../src/clinic'
import { Shortcut } from '../src/clinic-ui'
import { ListState } from '../src/list-state'
import { Button, Page, styles } from '../src/ui'
import { useResource } from '../src/use-resource'

export default function AppointmentDetail() {
  const { id, start } = useLocalSearchParams<{ id?: string; start?: string }>()
  const timestamp = typeof start === 'string' ? Date.parse(start) : NaN
  const valid = typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) && Number.isFinite(timestamp)
  const list = useResource<Appointment[]>(valid ? appointmentPath(new Date(timestamp), new Date(timestamp + 1)) : null)
  const appointment = list.data?.find(item => item._id === id)
  const { session, signOut } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const locked = useRef(false)

  async function confirm() {
    if (!appointment || !session || locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      const result = await request<{ calendarSynced: boolean }>('/citas/' + appointment._id + '/estado', {
        token: session.token, method: 'PATCH', body: { estado: 'confirmada' },
      })
      setMessage(result.calendarSynced === false
        ? 'Cita confirmada. Google Calendar no confirmó la sincronización.'
        : 'Cita confirmada.')
      list.reload()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        try { await signOut(); return } catch { /* Show the API error if storage fails. */ }
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la cita.')
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  const canReschedule = appointment?.patient && ['programada', 'confirmada'].includes(appointment.estado) && Date.parse(appointment.inicio) > Date.now()

  return (
    <Page bottomInset>
      {list.loading || list.error || !appointment ? <ListState {...list} empty="Cita no disponible." /> : (
        <>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>{appointment.patient?.name ?? 'Consulta'}</Text>
            <Text style={styles.body}>{dateTime.format(new Date(appointment.inicio))}</Text>
            <Text style={styles.body}>{appointment.tipo} · {appointment.estado}</Text>
            {!!appointment.notas && <Text style={styles.body}>{appointment.notas}</Text>}
          </View>
          {appointment.patient && (
            <Shortcut icon="person-outline" title="Abrir ficha del paciente"
              onPress={() => router.push({ pathname: '/paciente', params: { id: appointment.patient!._id } })} />
          )}
          {canReschedule && (
            <Shortcut icon="calendar-outline" title="Reprogramar cita" detail="Elige otro horario disponible"
              onPress={() => router.push({ pathname: '/agendar', params: { id: appointment._id, start: appointment.inicio } })} />
          )}
          {appointment.estado === 'programada' && Date.parse(appointment.inicio) > Date.now() && (
            <Button label={saving ? 'Confirmando…' : 'Confirmar asistencia'} disabled={saving}
              onPress={() => Alert.alert('Confirmar asistencia', '¿Confirmar esta cita?', [
                { text: 'Volver', style: 'cancel' }, { text: 'Confirmar', onPress: () => void confirm() },
              ])} />
          )}
        </>
      )}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
