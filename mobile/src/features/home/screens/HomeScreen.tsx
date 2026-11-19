import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { canViewClinic, roleLabels } from '@/features/auth/access'
import { period } from '@/features/appointments/calendar'
import { appointmentPath, time, type Appointment } from '@/features/appointments/models'
import { Shortcut } from '@/shared/ui/Shortcut'
import { useList } from '@/shared/hooks/useList'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, styles } from '@/shared/ui/primitives'

function ClinicHome() {
  const today = useList<Appointment>(appointmentPath(...period(new Date(), 'Día')))
  const upcoming = today.rows.filter(item => Date.parse(item.inicio) >= Date.now() &&
    ['programada', 'confirmada'].includes(item.estado)).slice(0, 3)

  return (
    <>
      <Shortcut primary icon="calendar-outline" title="Agendar cita"
        detail="Busca un paciente y elige un horario" onPress={() => router.push('/agendar')} />
      <Shortcut icon="time-outline" title="Ver agenda" detail="Día, semana y mes" onPress={() => router.navigate('/citas')} />
      <Shortcut icon="people-outline" title="Ver pacientes" onPress={() => router.navigate('/pacientes')} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Próximas citas de hoy</Text>
      {today.loading || today.error || !upcoming.length ? (
        <ListState {...today} empty="No hay más citas para hoy." />
      ) : upcoming.map(item => (
        <Shortcut key={item._id} icon="calendar-outline" title={item.patient?.name ?? 'Consulta'}
          detail={time.format(new Date(item.inicio)) + ' · ' + item.estado}
          onPress={() => router.push({ pathname: '/consulta', params: { id: item._id, start: item.inicio } })} />
      ))}
    </>
  )
}

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
      {canViewClinic(user.role) && <ClinicHome />}
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
