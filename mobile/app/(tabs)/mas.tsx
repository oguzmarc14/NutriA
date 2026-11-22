import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { ClinicMenu } from '@/features/navigation/ClinicMenu'
import { canViewClinic } from '@/features/auth/access'
import { useAuth } from '@/features/auth/AuthProvider'
import { Page, styles, Button } from '@/shared/ui/primitives'
export default function More() {
  const { session } = useAuth()
  return <Page><Text style={styles.title}>Todos los apartados</Text>
    <Text style={styles.body}>Tu consultorio, siempre a la mano.</Text>
    {canViewClinic(session?.user.role) && <View style={styles.card}><ClinicMenu /></View>}
    <Button label="Mi cuenta" selected={false} onPress={() => router.push('/cuenta')} />
  </Page>
}
