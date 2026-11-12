import { Tabs } from 'expo-router'
import { useAuth } from '../../src/auth'
import { canViewClinic } from '../../src/access'
import { colors } from '../../src/ui'

export default function TabsLayout() {
  const { session } = useAuth()
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelPosition: 'beside-icon',
    }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Protected guard={canViewClinic(session?.user.role)}>
        <Tabs.Screen name="pacientes" options={{ title: 'Pacientes' }} />
        <Tabs.Screen name="citas" options={{ title: 'Citas' }} />
      </Tabs.Protected>
    </Tabs>
  )
}
