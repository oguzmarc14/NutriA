import { useEffect } from 'react'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useAuth } from '@/features/auth/AuthProvider'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
})

export default function NotificationNavigation() {
  const { session } = useAuth()
  useEffect(() => {
    if (session?.user.role !== 'patient') return
    function open(response: Notifications.NotificationResponse) {
      if (response.notification.request.content.data.kind !== 'nutria-appointment') return
      router.navigate('/mis-citas')
      void Notifications.clearLastNotificationResponseAsync()
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(open)
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) open(response)
    }).catch(() => {})
    return () => subscription.remove()
  }, [session?.user.id, session?.user.role])
  return null
}
