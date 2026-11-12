import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../src/auth'
import { canViewClinic, roleLabels } from '../../src/access'
import { Button, Page, styles } from '../../src/ui'

export default function Dashboard() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState('')
  if (!session) return null
  const { user } = session
  return (
    <Page>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hola, {user.name}</Text>
        <Text style={styles.body}>{roleLabels[user.role]}</Text>
        <Text style={styles.body}>{user.email}</Text>
      </View>
      {canViewClinic(user.role) && (
        <>
          <Button label="Ver pacientes" onPress={() => router.navigate('/pacientes')} />
          <Button label="Ver agenda" onPress={() => router.navigate('/citas')} />
        </>
      )}
      <Button label="Cerrar sesión" selected={false} onPress={() => {
        void signOut().catch(() => setError('No se pudo borrar la sesión del dispositivo.'))
      }} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
