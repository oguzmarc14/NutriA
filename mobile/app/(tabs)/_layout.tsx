import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import { BackButton, colors } from '../../src/ui'
import { useAuth } from '../../src/auth'
import { canViewClinic } from '../../src/access'

export default function TabsLayout() {
  const { session } = useAuth()
  return (
    <Tabs initialRouteName="index" backBehavior="initialRoute" screenOptions={{
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.ink,
      headerShadowVisible: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.muted,
      tabBarActiveBackgroundColor: colors.background,
      tabBarLabelPosition: 'below-icon',
      tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Inicio',
        headerTitle: 'NutriA',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
      }} />
      <Tabs.Protected guard={canViewClinic(session?.user.role)}>
        <Tabs.Screen name="pacientes" options={({ navigation }) => ({
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
          headerLeft: () => <BackButton onPress={() => navigation.navigate('index')} />,
        })} />
        <Tabs.Screen name="citas" options={({ navigation }) => ({
          title: 'Citas',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
          headerLeft: () => <BackButton onPress={() => navigation.navigate('index')} />,
        })} />
      </Tabs.Protected>
    </Tabs>
  )
}
