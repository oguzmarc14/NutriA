import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

let revision = 0
export async function programReminders(appointments: { _id: string; inicio: string; estado: string }[], prompt = true) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Recordatorios de citas', importance: Notifications.AndroidImportance.HIGH,
    })
  }
  const permission = prompt ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync()
  if (!permission.granted) throw new Error('Activa las notificaciones de NutriA en los ajustes del teléfono.')
  await clearReminders()
  const current = revision
  let count = 0
  try {
    const events = appointments.filter(item => ['programada', 'confirmada'].includes(item.estado))
      .flatMap(item => [24, 2].map(hours => ({ item, hours, at: Date.parse(item.inicio) - hours * 3600000 })))
      .filter(event => Number.isFinite(event.at) && event.at > Date.now())
      .sort((a, b) => a.at - b.at).slice(0, 50)
    for (const event of events) {
      if (current !== revision) return count
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
      if (current !== revision) { await Notifications.cancelScheduledNotificationAsync('nutria-' + event.item._id + '-' + event.hours); return count }
      count++
    }
  } catch (error) {
    if (current === revision) await clearReminders()
    throw error
  }
  return count
}

export async function clearReminders() {
  revision++
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(scheduled.filter(item => item.content.data.kind === 'nutria-appointment')
    .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)))
}

export const reminderPreference = (user: string) => 'nutria.reminders.enabled.' + user
export async function enableReminders(user: string, appointments: Parameters<typeof programReminders>[0]) {
  const count = await programReminders(appointments)
  await SecureStore.setItemAsync(reminderPreference(user), 'true')
  return count
}
export async function disableReminders(user: string) {
  await SecureStore.deleteItemAsync(reminderPreference(user))
  await clearReminders()
}
