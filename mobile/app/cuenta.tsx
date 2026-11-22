import { useState } from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/access'
import { Button, Page, styles } from '@/shared/ui/primitives'
export default function Account() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!session) return null
  return <Page><View style={styles.card}><Text style={styles.title}>{session.user.name}</Text>
    <Text style={styles.body}>{roleLabels[session.user.role]}</Text><Text style={styles.body}>{session.user.email}</Text></View>
    <Button label={busy ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={busy} onPress={() => {
      setBusy(true); void signOut().catch(() => { setError('No se pudo cerrar la sesión. Intenta de nuevo.'); setBusy(false) })
    }} />{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </Page>
}
