import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function programReminders(appointments: { _id: string; inicio: string; estado: string }[]) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Recordatorios de citas', importance: Notifications.AndroidImportance.HIGH,
    })
  }
  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) throw new Error('Activa las notificaciones de NutriA en los ajustes del teléfono.')
  await clearReminders()
  let count = 0
  try {
    const events = appointments.filter(item => ['programada', 'confirmada'].includes(item.estado))
      .flatMap(item => [24, 2].map(hours => ({ item, hours, at: Date.parse(item.inicio) - hours * 3600000 })))
      .filter(event => Number.isFinite(event.at) && event.at > Date.now())
      .sort((a, b) => a.at - b.at).slice(0, 50)
    for (const event of events) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'nutria-' + event.item._id + '-' + event.hours,
        content: {
          title: 'Recordatorio de NutriA',
          body: 'Tienes una consulta próxima. Revisa Mis citas.',
          sound: 'default',
          data: { kind: 'nutria-appointment', route: '/mis-citas' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(event.at), channelId: 'appointments' },
      })
      count++
    }
  } catch (error) {
    await clearReminders()
    throw error
  }
  return count
}

export async function clearReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(scheduled.filter(item => item.content.data.kind === 'nutria-appointment')
    .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)))
}
