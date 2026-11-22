import { useNotices } from '@/features/notifications/useNotices'
import { RoleMenu } from './RoleMenu'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { canViewClinic } from '@/features/auth/access'
import { ClinicMenu } from './ClinicMenu'
import { colors } from '@/shared/ui/primitives'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
export function AppHeader() {
  const { session } = useAuth()
  const { active } = usePatientWork()
  const [open, setOpen] = useState(false)
  const notices = useNotices()
  const clinic = canViewClinic(session?.user.role)
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: '#f7fbf8' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 10,
      borderBottomWidth: 1, borderColor: colors.border }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" onPress={() => setOpen(true)}
        style={{ padding: 12 }}><Ionicons name="menu-outline" size={25} color={colors.green} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Paciente en atención: ' + active.name + '. Abrir ficha.' : 'NutriA'}
        onPress={() => { if (active) router.push({ pathname: '/paciente', params: { id: active.id } }) }}
        style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '800' }}>NutriA</Text>
        <Text numberOfLines={1} style={{ color: colors.green, fontSize: 11, fontWeight: active ? '700' : '400' }}>
          {active ? 'En atención · ' + active.name : session?.user.name}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={notices.unread ? `Notificaciones: ${notices.unread} sin ver` : 'Notificaciones'}
        onPress={() => router.push('/notificaciones')} style={{ padding: 12 }}>
        <Ionicons name="notifications-outline" size={24} color={colors.green} />
        {!!notices.unread && <View style={{ position: 'absolute', top: 1, right: 0, minWidth: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.green }}>
          <Text style={{ color: colors.white, fontSize: 10, textAlign: 'center' }}>{notices.unread > 99 ? '99+' : notices.unread}</Text></View>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Mi cuenta" onPress={() => router.push('/cuenta')}
        style={{ padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#e5f2e9' }}>
        <Ionicons name="person-outline" size={23} color={colors.green} /></Pressable>
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#102e2666' }}>
        <SafeAreaView style={{ width: '87%', maxWidth: 380, backgroundColor: '#edf5ef' }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: colors.ink, fontSize: 24, fontWeight: '800' }}>NutriA</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setOpen(false)} style={{ padding: 12 }}>
                <Ionicons name="close" size={24} color={colors.green} /></Pressable>
            </View>
            <View style={{ gap: 8 }}>{clinic ? <ClinicMenu close={() => setOpen(false)} /> : <RoleMenu close={() => setOpen(false)} />}</View>
            <Pressable accessibilityRole="button" onPress={() => { setOpen(false); router.push('/cuenta') }} style={{ padding: 16 }}>
              <Text style={{ color: colors.green, fontWeight: '600' }}>Mi cuenta</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú tocando fuera" style={{ flex: 1 }} onPress={() => setOpen(false)} />
      </View>
    </Modal>
  </SafeAreaView>
}
