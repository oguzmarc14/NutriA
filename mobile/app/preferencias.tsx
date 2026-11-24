import { useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { PushControls } from '@/features/notifications/PushControls'
import { enableReminders, disableReminders } from '@/features/notifications/reminders'
import { Button, Page, styles } from '@/shared/ui/primitives'

type Citas = { citas: { _id: string; inicio: string; estado: string }[] }

export default function Preferences() {
  const { session } = useAuth()
  const patient = session?.user.role === 'patient'
  const appointments = useResource<Citas>(patient ? '/mi-perfil/citas' : null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function run(action: () => Promise<string>) {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try { setMessage(await action()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo aplicar el cambio.') }
    finally { setBusy(false) }
  }
  if (!session) return null
  const { user } = session
  return <Page bottomInset>
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
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </Page>
}
