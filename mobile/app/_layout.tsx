import NotificationNavigation from '@/features/notifications/NotificationNavigation'
import { StatusBar } from 'expo-status-bar'
import { router, Stack } from 'expo-router'
import { ActivityIndicator, Text } from 'react-native'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { BackButton, Button, colors, Page, styles } from '@/shared/ui/primitives'
import { useState } from 'react'
import { canViewClinic } from '@/features/auth/access'

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
        <Stack.Screen name="cuenta" options={{ ...clinicHeader, title: 'Mi cuenta' }} />
      </Stack.Protected>
      <Stack.Protected guard={session?.user.role === 'patient'}>
        <Stack.Screen name="mis-pagos" options={{ ...clinicHeader, title: 'Mis pagos' }} />
        <Stack.Screen name="reportar-pago" options={{ ...clinicHeader, title: 'Reportar pago' }} />
        <Stack.Screen name="registrar-comida" options={{ ...clinicHeader, title: 'Registrar comida' }} />
        <Stack.Screen name="notificaciones" options={{ ...clinicHeader, title: 'Mis notificaciones' }} />
      </Stack.Protected>
      <Stack.Protected guard={canViewClinic(session?.user.role)}>
        <Stack.Screen name="comunidad" options={{ ...clinicHeader, title: 'NutriA Community' }} />
        <Stack.Screen name="pagos-paciente" options={{ ...clinicHeader, title: 'Pagos del paciente' }} />
        <Stack.Screen name="seguimiento-paciente" options={{ ...clinicHeader, title: 'Seguimiento de comidas' }} />
        <Stack.Screen name="paciente" options={{ ...clinicHeader, title: 'Ficha del paciente' }} />
        <Stack.Screen name="consulta" options={{ ...clinicHeader, title: 'Detalle de cita' }} />
        <Stack.Screen name="elegir-paciente" options={{ ...clinicHeader, title: 'Elegir paciente' }} />
        <Stack.Screen name="planes" options={{ ...clinicHeader, title: 'Planes alimenticios' }} />
        <Stack.Screen name="dieta" options={{ ...clinicHeader, title: 'Editor de dieta' }} />
        <Stack.Screen name="expediente" options={{ ...clinicHeader, title: 'Expediente clínico' }} />
        <Stack.Screen name="calculo" options={{ ...clinicHeader, title: 'Cálculo nutricional' }} />
        <Stack.Screen name="mediciones" options={{ ...clinicHeader, title: 'Mediciones' }} />
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
      <NotificationNavigation />
    </AuthProvider>
  )
}
