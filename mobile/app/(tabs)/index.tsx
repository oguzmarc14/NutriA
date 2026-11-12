import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../src/auth'
import { canViewClinic, roleLabels } from '../../src/access'
import { period } from '../../src/agenda'
import { appointmentPath, time, type Appointment } from '../../src/clinic'
import { Shortcut } from '../../src/clinic-ui'
import { useList } from '../../src/use-list'
import { ListState } from '../../src/list-state'
import { Button, Page, styles } from '../../src/ui'

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
      <Button label="Cerrar sesión" selected={false} onPress={() => {
        void signOut().catch(() => setError('No se pudo borrar la sesión del dispositivo.'))
      }} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  )
}
