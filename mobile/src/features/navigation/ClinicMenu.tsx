import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { clinicMenu } from './menu'
import { colors, styles } from '@/shared/ui/primitives'
export function ClinicMenu({ close }: { close?: () => void }) {
  return <View style={{ gap: 4 }}>{clinicMenu.map(item => <Pressable key={item.label}
    accessibilityRole="button" onPress={() => {
      close?.()
      if ('intent' in item) router.push({ pathname: '/elegir-paciente', params: { intent: item.intent } })
      else router.navigate(item.path)
    }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 14, borderRadius: 16, minHeight: 50 }, pressed && styles.pressed]}>
    <Ionicons name={item.icon} color={colors.green} size={22} />
    <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>{item.label}</Text>
    <Ionicons name="chevron-forward" color={colors.muted} size={16} />
  </Pressable>)}</View>
}
