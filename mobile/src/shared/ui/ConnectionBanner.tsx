import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useSyncExternalStore } from 'react'
import { AppState, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { checkConnection } from '@/core/api/client'
import { getConnectionInterrupted, subscribeConnection } from '@/core/api/connection'

export function ConnectionBanner() {
  const interrupted = useSyncExternalStore(subscribeConnection, getConnectionInterrupted)
  const { bottom } = useSafeAreaInsets()
  useEffect(() => {
    let controller: AbortController | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    function probe() {
      if (AppState.currentState !== 'active' || controller) return
      controller = new AbortController()
      timeout = setTimeout(() => controller?.abort(), 10000)
      void checkConnection(controller.signal).finally(() => {
        clearTimeout(timeout)
        controller = undefined
      })
    }
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') probe() })
    probe()
    const poll = setInterval(() => { if (getConnectionInterrupted()) probe() }, 15000)
    return () => {
      foreground.remove()
      clearInterval(poll)
      clearTimeout(timeout)
      controller?.abort()
    }
  }, [interrupted])
  if (!interrupted) return null
  return <View pointerEvents="none" style={{
    marginHorizontal: 12, marginBottom: Math.max(8, bottom),
    backgroundColor: '#fff3d6', borderColor: '#cba168', borderWidth: 1, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12,
  }}>
    <Ionicons name="cloud-offline-outline" size={21} color="#74450a" />
    <Text accessibilityRole="alert" style={{ flex: 1, color: '#624012', fontWeight: '600' }}>
      No hay conexión con NutriA. Revisa internet y vuelve a intentar desde esta pantalla.
    </Text>
  </View>
}
