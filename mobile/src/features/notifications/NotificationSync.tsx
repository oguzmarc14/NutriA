import { useEffect } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { programReminders, reminderPreference } from './reminders'
import { onAppointmentsChanged } from './reminderSync'
export function NotificationSync() {
  const { session } = useAuth()
  useEffect(() => {
    if (!session || session.user.role !== 'patient') return
    let active = true, running = false, again = false
    const controller = new AbortController()
    async function sync() {
      if (!active) return
      if (running) { again = true; return }
      running = true
      try {
        const enabled = await SecureStore.getItemAsync(reminderPreference(session!.user.id))
        if (enabled !== 'true' || !active) return
        const data = await request<{ citas: Parameters<typeof programReminders>[0] }>('/mi-perfil/citas', { token: session!.token, signal: controller.signal })
        if (active) await programReminders(data.citas, false)
      } catch { /* Keep existing reminders on a failed fetch; retry when foregrounded. */ }
      finally { running = false; if (again && active) { again = false; void sync() } }
    }
    void sync()
    const stop = onAppointmentsChanged(() => void sync())
    const app = AppState.addEventListener('change', state => { if (state === 'active') void sync() })
    const notice = Notifications.addNotificationReceivedListener(() => void sync())
    const timer = setInterval(() => { if (AppState.currentState === 'active') void sync() }, 60000)
    return () => { active = false; controller.abort(); stop(); app.remove(); notice.remove(); clearInterval(timer) }
  }, [session?.token, session?.user.id, session?.user.role])
  return null
}
