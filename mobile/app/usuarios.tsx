import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import type { Users } from '@/features/admin/models'
export default function UsersScreen() {
  const resource = useResource<Users>('/usuarios')
  const [search, setSearch] = useState('')
  const rows = [...(resource.data?.administradores || []), ...(resource.data?.nutriologos || [])]
  const results = rows.filter(user => (user.name + ' ' + user.email).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <Page><Text style={styles.title}>Usuarios y accesos</Text>
    <TextInput accessibilityLabel="Buscar usuarios" placeholder="Nombre o correo" style={styles.input} value={search} onChangeText={setSearch} />
    <ListState {...resource} />
    {resource.data && !results.length && <Text style={styles.body}>No hay usuarios que coincidan.</Text>}
    {results.map(user => <View key={user.id} style={styles.card}><Text style={styles.cardTitle}>{user.name}</Text>
      <Text style={styles.body}>{user.email}</Text><Text style={styles.body}>{user.role === 'admin' ? 'Administrador' : 'Nutriólogo'} · {user.active ? 'Activo' : 'Desactivado'}</Text>
      <Text style={styles.body}>{user.googleVerified ? 'Cuenta vinculada a Google' : 'Primer acceso con Google pendiente'}</Text></View>)}
    <Text style={styles.body}>La autorización y los cambios de acceso siguen disponibles en la web.</Text>
  </Page>
}
