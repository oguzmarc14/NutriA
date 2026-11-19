import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { request } from '@/core/api/client'

const key = 'nutria.push-token'

export async function registerPush(token: string) {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) throw new Error('Falta vincular esta compilación al proyecto de notificaciones de Expo.')
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new Error('Dispositivo no compatible.')
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Citas de NutriA', importance: Notifications.AndroidImportance.HIGH,
    })
  }
  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) throw new Error('Activa las notificaciones de NutriA en los ajustes del teléfono.')
  const deviceToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  await SecureStore.setItemAsync(key, deviceToken)
  await request('/push/devices', { token, body: { token: deviceToken, platform: Platform.OS } })
}

export async function unregisterPush(token: string) {
  const deviceToken = await SecureStore.getItemAsync(key)
  if (!deviceToken) return
  await request('/push/devices/remove', { token, body: { token: deviceToken, platform: Platform.OS } })
  await SecureStore.deleteItemAsync(key)
}
