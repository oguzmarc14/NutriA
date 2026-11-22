import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNotices } from '../useNotices'
import PatientNotificationsScreen from './PatientNotificationsScreen'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
function StaffNotices() {
  const { session } = useAuth()
  const notices = useNotices()
  const admin = session?.user.role === 'admin'
  return <Page><Text style={styles.title}>Notificaciones</Text>
    <Text style={styles.body}>{admin ? 'Publicaciones que esperan revisión.' : 'Citas pendientes de confirmar durante los próximos 14 días.'}</Text>
    <ListState {...notices} empty={!notices.notices.length ? 'No tienes avisos pendientes en esta sección.' : undefined} />
    {!!notices.storageError && <Text accessibilityRole="alert" style={styles.error}>{notices.storageError}</Text>}
    {notices.notices.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.body}>{item.detalle}</Text><Text style={styles.body}>{notices.seen?.includes(item.id) ? 'Visto' : 'Nuevo'}</Text></View>)}
    {!!notices.unread && <Button label="Marcar como vistos" disabled={notices.saving} onPress={() => void notices.markSeen()} />}
    <Button label={admin ? 'Abrir moderación' : 'Ver agenda'} onPress={() => admin ? router.push('/moderacion') : router.navigate('/citas')} />
  </Page>
}
export default function RoleNotifications() {
  const { session } = useAuth()
  return session?.user.role === 'patient' ? <PatientNotificationsScreen /> : <StaffNotices />
}
