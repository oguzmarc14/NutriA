import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useResource } from '@/shared/hooks/useResource'
import { Page, styles } from '@/shared/ui/primitives'
import { Shortcut } from '@/shared/ui/Shortcut'
import { ListState } from '@/shared/ui/ListState'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Users, PendingRecipe } from './models'
export default function AdminDashboard() {
  const { session } = useAuth()
  const users = useResource<Users>('/usuarios')
  const recipes = useResource<PendingRecipe[]>('/community/moderacion/pendientes')
  return <Page><Text style={styles.title}>Panel de administración</Text>
    <Text style={styles.body}>Hola, {session?.user.name}. Administra los accesos y la comunidad de NutriA.</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Usuarios autorizados</Text>
      {users.data ? <><Text style={styles.title}>{users.data.administradores.length + users.data.nutriologos.length}</Text>
        <Text style={styles.body}>{users.data.administradores.length} administradores · {users.data.nutriologos.length} nutriólogos</Text></> : <ListState {...users} />}</View>
    <View style={styles.card}><Text style={styles.cardTitle}>Recetas pendientes de revisión</Text>
      {recipes.data ? <Text style={styles.title}>{recipes.data.length}{recipes.data.length === 100 ? '+' : ''}</Text> : <ListState {...recipes} />}</View>
    <Shortcut title="Usuarios y accesos" detail="Consulta las cuentas y su estado" icon="people-outline" onPress={() => router.push('/usuarios')} />
    <Shortcut title="Moderación de recetas" detail="Revisa las publicaciones pendientes" icon="shield-checkmark-outline" onPress={() => router.push('/moderacion')} />
    <Shortcut title="Notificaciones" icon="notifications-outline" onPress={() => router.push('/notificaciones')} />
    <Shortcut title="NutriA Community" icon="book-outline" onPress={() => router.push('/comunidad')} />
  </Page>
}
