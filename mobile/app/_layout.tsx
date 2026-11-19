import { StatusBar } from 'expo-status-bar'
import { router, Stack } from 'expo-router'
import { ActivityIndicator, Text } from 'react-native'
import { AuthProvider, useAuth } from '../src/auth'
import { BackButton, Button, colors, Page, styles } from '../src/ui'
import { useState } from 'react'
import { canViewClinic } from '../src/access'

const clinicHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  headerLeft: () => <BackButton label="Regresar" onPress={() => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }} />,
}

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
      <Stack.Protected guard={canViewClinic(session?.user.role)}>
        <Stack.Screen name="paciente" options={{ ...clinicHeader, title: 'Ficha del paciente' }} />
        <Stack.Screen name="consulta" options={{ ...clinicHeader, title: 'Detalle de cita' }} />
        <Stack.Screen name="agendar" options={{ ...clinicHeader, title: 'Agendar cita' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navigation />
    </AuthProvider>
  )
}
