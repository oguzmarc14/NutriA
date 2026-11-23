import PatientOverview from './PatientOverview'
import AdminDashboard from '@/features/admin/AdminDashboard'
import ClinicDashboard from './ClinicDashboard'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { canViewClinic, roleLabels } from '@/features/auth/access'
import { Shortcut } from '@/shared/ui/Shortcut'
import { Button, Page, styles } from '@/shared/ui/primitives'

export default function Dashboard() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState('')
  if (!session) return null
  const { user } = session
  if (user.role === 'admin') return <AdminDashboard />
  if (canViewClinic(user.role)) return <ClinicDashboard />
  return (
    <Page>
      <View style={styles.card}>
        <Text style={styles.title}>Hola, {user.name}</Text>
        <Text style={styles.body}>{roleLabels[user.role]}</Text>
        <Text style={styles.body}>{user.email}</Text>
      </View>
      {user.role === 'patient' && <PatientOverview />}
      <Text style={styles.cardTitle}>Accesos rápidos</Text>
      <Shortcut icon="stats-chart-outline" title="Mi progreso" detail="Gráficas de peso, IMC y composición corporal" onPress={() => router.navigate('/progreso')} />
      {user.role === 'patient' && <Shortcut icon="wallet-outline" title="Mis pagos" detail="Reporta un pago y consulta su revisión" onPress={() => router.push('/mis-pagos')} />}
      {user.role === 'patient' && <Shortcut icon="notifications-outline" title="Mis notificaciones"
        detail="Avisos y recordatorios de tus consultas" onPress={() => router.push('/notificaciones')} />}
      {user.role === 'patient' && <Shortcut icon="nutrition-outline" title="Mi plan alimenticio"
        detail="Consulta tu dieta por fecha" onPress={() => router.navigate('/mi-plan')} />}
      {user.role === 'patient' && <Shortcut primary icon="calendar-outline" title="Mis citas"
        detail="Confirma tu asistencia y consulta tu historial" onPress={() => router.navigate('/mis-citas')} />}
      <Button label="Cerrar sesión" selected={false} onPress={() => {
        void signOut().catch(() => setError('No se pudo borrar la sesión del dispositivo.'))
      }} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
