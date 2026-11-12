import { Stack } from 'expo-router'
import { ActivityIndicator, Text } from 'react-native'
import { AuthProvider, useAuth } from '../src/auth'
import { Button, Page, styles } from '../src/ui'
import { useState } from 'react'

function Navigation() {
  const { loading, session, restoreError, retry, signOut } = useAuth()
  const [storageError, setStorageError] = useState('')
  if (loading) return <Page title="NutriA"><ActivityIndicator accessibilityLabel="Cargando sesión" /></Page>
  if (restoreError) {
    return (
      <Page title="NutriA">
        <Text style={styles.error}>{storageError || restoreError}</Text>
        <Button label="Reintentar" onPress={() => { setStorageError(''); retry() }} />
        <Button label="Cerrar sesión" onPress={() => {
          void signOut().catch(() => setStorageError('No se pudo borrar la sesión del dispositivo.'))
        }} />
      </Page>
    )
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return <AuthProvider><Navigation /></AuthProvider>
}
