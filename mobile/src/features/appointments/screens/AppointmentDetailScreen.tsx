import { AppDialog } from '@/shared/ui/AppDialog'
import { useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { ApiError, request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { appointmentPath, dateTime, type Appointment } from '@/features/appointments/models'
import { Shortcut } from '@/shared/ui/Shortcut'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'

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
  const [pending, setPending] = useState<'confirmada' | 'cancelada' | 'completada' | null>(null)
  const locked = useRef(false)

  async function changeState(estado: 'confirmada' | 'cancelada' | 'completada') {
    if (!appointment || !session || locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      const result = await request<{ calendarSynced: boolean }>('/citas/' + appointment._id + '/estado', {
        token: session.token, method: 'PATCH', body: { estado },
      })
      setMessage((estado === 'confirmada' ? 'Cita confirmada.' : estado === 'cancelada' ? 'Cita cancelada. Se conserva en el historial.' : 'Consulta completada.') + (result.calendarSynced === false ? ' Google Calendar no confirmó la sincronización.' : ''))
      list.reload()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        try { await signOut(); return } catch { /* Show the API error if storage fails. */ }
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la cita.')
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
          {appointment.estado === 'programada' && Date.parse(appointment.inicio) > Date.now() && <Button label="Confirmar asistencia" disabled={saving} onPress={() => setPending('confirmada')} />}
          {canReschedule && <Button selected={false} label="Cancelar cita" disabled={saving} onPress={() => setPending('cancelada')} />}
          {['programada','confirmada'].includes(appointment.estado) && Date.parse(appointment.inicio) <= Date.now() && <Button label="Marcar consulta completada" disabled={saving} onPress={() => setPending('completada')} />}
        </>
      )}
      <AppDialog visible={!!pending} title={pending === 'cancelada' ? '¿Cancelar cita?' : pending === 'completada' ? '¿Completar consulta?' : '¿Confirmar asistencia?'} message={pending === 'completada' ? 'Confirma que esta consulta ya fue atendida. Se conservará en el historial.' : 'El cambio se guardará en NutriA y se intentará sincronizar con Google Calendar.'} onClose={() => { if (!saving) setPending(null) }}>
        <Button label={saving ? 'Guardando…' : 'Aceptar'} disabled={saving} onPress={() => { if (pending) { const next = pending; setPending(null); void changeState(next) } }} />
        <Button label="Volver" selected={false} disabled={saving} onPress={() => setPending(null)} />
      </AppDialog>
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
