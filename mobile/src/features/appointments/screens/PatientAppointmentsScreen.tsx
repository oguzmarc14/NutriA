import { useState } from 'react'
import { ActivityIndicator, Alert, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'

type Appointment = {
  _id: string
  inicio: string
  zonaHoraria?: string
  estado: string
  tipo: string
}
type Appointments = { citas: Appointment[]; zonaHoraria: string; profesional: string }
const labels: Record<string, string> = {
  programada: 'Pendiente de confirmar', confirmada: 'Confirmada',
  cancelada: 'Cancelada', completada: 'Completada',
}

export default function MyAppointments() {
  const { session, signOut } = useAuth()
  const { data, loading, error, reload } = useResource<Appointments>('/mi-perfil/citas')
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')

  async function update(appointment: Appointment, action: 'confirmar' | 'cancelar') {
    if (busy || !session) return
    setBusy(appointment._id)
    setActionError('')
    try {
      await request('/mi-perfil/citas/' + encodeURIComponent(appointment._id) + '/' + action, {
        token: session.token, method: 'PATCH',
      })
      reload()
      Alert.alert(action === 'confirmar' ? 'Cita confirmada' : 'Cita cancelada',
        action === 'confirmar' ? 'Tu asistencia quedó confirmada.' : 'La cita se canceló correctamente.',
        [{ text: 'Aceptar' }])
    } catch (cause) {
      if (cause instanceof Error && 'status' in cause && cause.status === 401) {
        await signOut().catch(() => setActionError('La sesión expiró. Vuelve a iniciar sesión.'))
        return
      }
      setActionError(cause instanceof Error ? cause.message : 'No se pudo actualizar la cita.')
      reload()
    } finally {
      setBusy('')
    }
  }

  const upcoming = (data?.citas ?? []).filter(item =>
    ['programada', 'confirmada'].includes(item.estado) && Date.parse(item.inicio) > Date.now())
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
  const history = (data?.citas ?? []).filter(item => !upcoming.some(next => next._id === item._id))

  function card(item: Appointment) {
    const future = Date.parse(item.inicio) > Date.now()
    const date = new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'full', timeStyle: 'short', timeZone: item.zonaHoraria || data?.zonaHoraria,
    }).format(new Date(item.inicio))
    return <View key={item._id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.tipo === 'primera' ? 'Primera consulta' : 'Consulta'}</Text>
      <Text style={styles.body}>{date}</Text>
      <Text style={styles.body}>{labels[item.estado] || item.estado}</Text>
      {future && item.estado === 'programada' && <Button label={busy === item._id ? 'Procesando…' : 'Confirmar cita'}
        disabled={!!busy} onPress={() => void update(item, 'confirmar')} />}
      {future && ['programada', 'confirmada'].includes(item.estado) && <Button label="Cancelar cita"
        selected={false} disabled={!!busy} onPress={() => Alert.alert('¿Cancelar esta cita?',
          'Se conservará en tu historial.', [
            { text: 'Conservar cita', style: 'cancel' },
            { text: 'Sí, cancelar', style: 'destructive', onPress: () => void update(item, 'cancelar') },
          ])} />}
    </View>
  }

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mis citas</Text>
    {data && <Text style={styles.body}>Consultas con {data.profesional}</Text>}
    {loading && <ActivityIndicator accessibilityLabel="Cargando citas" />}
    {!!(error || actionError) && <Text accessibilityRole="alert" style={styles.error}>{actionError || error}</Text>}
    {data && <>
      <Text style={styles.cardTitle}>Próximas consultas</Text>
      {upcoming.length ? upcoming.map(card) : <Text style={styles.body}>No tienes citas próximas.</Text>}
      <Text style={styles.cardTitle}>Historial</Text>
      {history.length ? history.map(card) : <Text style={styles.body}>Todavía no hay citas en tu historial.</Text>}
    </>}
  </Page>
}
