import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Alert, Pressable, Text, View } from 'react-native'
import { clinicMenu, patientDestinations } from './menu'
import { colors, styles } from '@/shared/ui/primitives'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'

export function ClinicMenu({ close }: { close?: () => void }) {
  const { active, stop } = usePatientWork()
  return <View style={{ gap: 4 }}>
    {active && <View style={{ marginBottom: 10, backgroundColor: '#dceee2', borderRadius: 18, padding: 13, gap: 7 }}>
      <Text style={{ color: colors.green, fontSize: 11, fontWeight: '800' }}>PACIENTE EN ATENCIÓN</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={'Abrir ficha de ' + active.name}
        onPress={() => { close?.(); router.push({ pathname: '/paciente', params: { id: active.id } }) }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 39 }}>
        <Ionicons name="person-circle-outline" color={colors.green} size={26} />
        <Text numberOfLines={2} style={{ flex: 1, color: colors.ink, fontWeight: '800', fontSize: 15 }}>{active.name}</Text>
        <Ionicons name="chevron-forward" color={colors.green} size={18} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dejar de trabajar con paciente"
        onPress={() => {
          close?.()
          Alert.alert('¿Dejar de trabajar?', '¿Confirmas que deseas dejar de trabajar con ' + active.name + '?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Dejar de trabajar', style: 'destructive', onPress: stop },
          ])
        }} style={{ alignSelf: 'flex-start', paddingVertical: 5 }}>
        <Text style={{ color: '#4a6d57', fontWeight: '700', fontSize: 12 }}>Dejar de trabajar con este paciente</Text>
      </Pressable>
    </View>}
    {clinicMenu.map(item => <Pressable key={item.label}
      accessibilityRole="button" onPress={() => {
        close?.()
        if ('intent' in item) {
          if (active) router.push({ pathname: patientDestinations[item.intent], params: { patient: active.id } })
          else router.push({ pathname: '/elegir-paciente', params: { intent: item.intent } })
        } else if (item.path === '/agendar' && active) {
          router.push({ pathname: '/agendar', params: { patient: active.id } })
        } else router.navigate(item.path)
      }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 14, borderRadius: 16, minHeight: 50 }, pressed && styles.pressed]}>
      <Ionicons name={item.icon} color={colors.green} size={22} />
      <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>{item.label}</Text>
      <Ionicons name="chevron-forward" color={colors.muted} size={16} />
    </Pressable>)}
  </View>
}
