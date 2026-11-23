import { useEffect, useRef, useState } from 'react'
import { router } from 'expo-router'
import { AppState, Linking, Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { PushControls } from '@/features/notifications/PushControls'
import { enableReminders, disableReminders } from '@/features/notifications/reminders'
import { Button, Page, styles } from '@/shared/ui/primitives'

type Citas = { citas: { _id: string; inicio: string; estado: string }[] }

export default function Preferences() {
  const { session } = useAuth()
  const staff = session?.user.role === 'nutritionist'
  const patient = session?.user.role === 'patient'
  const calendar = useResource<{ connected: boolean }>(staff ? '/calendar/status' : null)
  const appointments = useResource<Citas>(patient ? '/mi-perfil/citas' : null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const reloadCalendar = useRef(calendar.reload)
  useEffect(() => { reloadCalendar.current = calendar.reload }, [calendar.reload])
  useEffect(() => {
    if (!staff) return
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') reloadCalendar.current()
    })
    return () => subscription.remove()
  }, [staff])

  async function run(action: () => Promise<string>) {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try { setMessage(await action()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo aplicar el cambio.') }
    finally { setBusy(false) }
  }
  if (!session) return null
  const { token, user } = session
  return <Page bottomInset>
    <Text accessibilityRole="header" style={styles.title}>Avisos y calendarios</Text>
    <PushControls />
    <Button label="Permisos en ajustes del teléfono" selected={false} onPress={() => void run(async () => {
      await Linking.openSettings(); return ''
    })} />
    {patient && <View style={styles.card}>
      <Text style={styles.cardTitle}>Recordatorios de citas</Text>
      <Text style={styles.body}>Recibe un recordatorio local el día anterior y dos horas antes de tus citas próximas.</Text>
      {!!appointments.error && <Text accessibilityRole="alert" style={styles.error}>{appointments.error}</Text>}
      <Button label="Programar recordatorios" disabled={busy || !appointments.data} onPress={() => void run(async () => {
        const count = await enableReminders(user.id, appointments.data?.citas || [])
        return count ? 'Recordatorios programados.' : 'No hay recordatorios futuros para programar.'
      })} />
      <Button label="Desactivar recordatorios" selected={false} disabled={busy} onPress={() => void run(async () => {
        await disableReminders(user.id); return 'Recordatorios desactivados.'
      })} />
    </View>}
    {(staff || patient) && <View style={styles.card}>
      <Text style={styles.cardTitle}>Calendarios</Text>
      <Text style={styles.body}>{staff
        ? 'Conecta Google Calendar para sincronizar las citas de tu consultorio.'
        : 'Desde Mis citas puedes enviar una cita a Google Calendar o compartir un archivo de calendario con tu teléfono.'}</Text>
      {patient && <Button label="Abrir Mis citas" selected={false} onPress={() => router.navigate('/mis-citas')} />}
      {staff && <>
        <Text style={styles.body}>{calendar.loading ? 'Consultando conexión…' : calendar.data?.connected ? 'Google Calendar conectado' : calendar.error || 'Google Calendar sin conectar'}</Text>
        <Button label={calendar.data?.connected ? 'Desconectar Google Calendar' : 'Conectar Google Calendar'}
          disabled={busy || calendar.loading} onPress={() => void run(async () => {
            if (calendar.data?.connected) {
              await request('/calendar/disconnect', { token, method: 'DELETE' }); calendar.reload(); return 'Calendario desconectado.'
            }
            const { url } = await request<{ url: string }>('/calendar/connect', { token })
            await Linking.openURL(url)
            return 'Completa el acceso de Google y vuelve a NutriA.'
          })} />
        <Button label="Actualizar conexión" selected={false} disabled={busy} onPress={calendar.reload} />
      </>}
    </View>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </Page>
}
