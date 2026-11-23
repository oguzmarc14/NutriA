import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/access'
import { useResource } from '@/shared/hooks/useResource'
import { colors, Page, styles } from '@/shared/ui/primitives'

type Clinic = { nombre?: string; nombreProfesional?: string; logo?: string }
function ClinicAccess() {
  const { data } = useResource<{ clinica: Clinic }>('/clinica')
  const clinic = data?.clinica
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir Mi clínica, editar nombre y logotipo"
    onPress={() => router.push('/mi-clinica')}
    style={({ pressed }) => [s.clinicCard, pressed && styles.pressed]}>
    <View style={s.icon}><Ionicons name="business-outline" size={26} color={colors.green} /></View>
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={s.linkTitle}>Mi clínica</Text>
      <Text style={s.linkSubtitle} numberOfLines={2}>
        {clinic?.nombre || 'Personaliza tu consultorio'} · Logo y nombre profesional
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={21} color={colors.green} />
  </Pressable>
}
export default function Account() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!session) return null
  return <Page bottomInset>
    <View style={s.profile}>
      <View style={s.avatar}><Ionicons name="person-outline" size={30} color={colors.green} /></View>
      <Text accessibilityRole="header" style={s.name}>{session.user.name}</Text>
      <Text style={s.role}>{roleLabels[session.user.role]}</Text>
      <Text style={s.email}>{session.user.email}</Text>
    </View>
    {session.user.role === 'nutritionist' && <>
      <Text style={s.section}>Configuración del consultorio</Text>
      <ClinicAccess />
      <Pressable accessibilityRole="button" onPress={()=>router.push('/horarios')} style={s.clinicCard}><Ionicons name="calendar-outline" size={26} color={colors.green}/><Text style={s.linkTitle}>Horarios y disponibilidad</Text></Pressable>
    </>}
    <Pressable accessibilityRole="button" onPress={() => router.push('/preferencias')} style={s.clinicCard}>
      <View style={s.icon}><Ionicons name="settings-outline" size={26} color={colors.green} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.linkTitle}>Avisos y calendarios</Text>
        <Text style={s.linkSubtitle}>Notificaciones, recordatorios y calendario</Text>
      </View>
      <Ionicons name="chevron-forward" size={21} color={colors.green} />
    </Pressable>
    <Pressable accessibilityRole="button" disabled={busy}
      style={({ pressed }) => [s.signOut, pressed && styles.pressed, busy && styles.disabled]}
      onPress={() => {
        setBusy(true)
        void signOut().catch(() => {
          setError('No se pudo cerrar la sesión. Intenta de nuevo.')
          setBusy(false)
        })
      }}>
      <Ionicons name="log-out-outline" size={20} color={colors.green} />
      <Text style={s.signOutText}>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </Page>
}
const s = StyleSheet.create({
  profile: { backgroundColor: '#f8fcf9', padding: 22, borderRadius: 25, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#d1e2d7' },
  avatar: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#e4f2e9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  role: { color: colors.green, fontSize: 13, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  section: { fontSize: 16, fontWeight: '800', color: colors.ink },
  clinicCard: { padding: 17, borderRadius: 20, borderWidth: 1, borderColor: '#c5ddcf', backgroundColor: '#f9fcf9', flexDirection: 'row', alignItems: 'center', gap: 13 },
  icon: { height: 52, width: 52, borderRadius: 16, backgroundColor: '#dceee3', alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  linkSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  signOut: { minHeight: 50, backgroundColor: '#f3f8f4', flexDirection: 'row', borderRadius: 15, gap: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cddfd3' },
  signOutText: { color: colors.green, fontSize: 15, fontWeight: '700' },
})
