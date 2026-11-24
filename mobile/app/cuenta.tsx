import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { router, type Href } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/access'
import { useResource } from '@/shared/hooks/useResource'
import { colors, Page, styles } from '@/shared/ui/primitives'

type Clinic = { nombre?: string; nombreProfesional?: string; logo?: string }
type Option = { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; href: Href }

function SettingsRow({ title, subtitle, icon, href }: Option) {
  return <Pressable accessibilityRole="button" onPress={() => router.push(href)}
    style={({ pressed }) => [s.option, pressed && styles.pressed]}>
    <View style={s.icon}><Ionicons name={icon} size={23} color={colors.green} /></View>
    <View style={s.optionText}>
      <Text style={s.linkTitle}>{title}</Text>
      <Text style={s.linkSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.green} />
  </Pressable>
}

function SettingsGroup({ title, options }: { title: string; options: Option[] }) {
  return <View style={s.group}>
    <Text accessibilityRole="header" style={s.section}>{title}</Text>
    <View style={s.list}>{options.map(option => <SettingsRow key={option.title} {...option} />)}</View>
  </View>
}

export default function Account() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const role = session?.user.role
  const clinic = useResource<{ clinica: Clinic }>(role === 'nutritionist' ? '/clinica' : null)
  if (!session) return null
  const preferences: Option[] = [{
    title: 'Notificaciones', subtitle: role === 'patient' ? 'Avisos, permisos y recordatorios' : 'Avisos y permisos del teléfono',
    icon: 'notifications-outline', href: '/preferencias',
  }]
  if (role === 'nutritionist' || role === 'patient') preferences.push({
    title: 'Calendarios', subtitle: role === 'nutritionist' ? 'Conexión con Google Calendar' : 'Agrega tus citas a un calendario',
    icon: 'calendar-number-outline', href: '/calendarios',
  })
  return <Page bottomInset>
    <View style={s.profile}>
      <View style={s.avatar}><Ionicons name="person-outline" size={30} color={colors.green} /></View>
      <Text accessibilityRole="header" style={s.name}>{session.user.name}</Text>
      <Text style={s.role}>{roleLabels[session.user.role]}</Text>
      <Text style={s.email}>{session.user.email}</Text>
    </View>
    {role === 'nutritionist' && <SettingsGroup title="Configuración del consultorio" options={[
      { title: 'Mi clínica', subtitle: clinic.data?.clinica.nombre || 'Nombre y logotipo del consultorio',
        icon: 'business-outline', href: '/mi-clinica' },
      { title: 'Horarios y disponibilidad', subtitle: 'Jornada, bloqueos y agenda pública',
        icon: 'calendar-outline', href: '/horarios' },
      { title: 'Pagos', subtitle: 'Mercado Pago y efectivo por WhatsApp',
        icon: 'wallet-outline', href: '/configurar-pagos' },
    ]} />}
    <SettingsGroup title="Preferencias" options={preferences} />
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
  group: { gap: 8 },
  list: { backgroundColor: '#fbfdfa', borderWidth: 1, borderColor: '#cee1d4', borderRadius: 20, overflow: 'hidden' },
  option: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#dce9e0' },
  optionText: { flex: 1, gap: 3 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e1efe5', alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  linkSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  signOut: { minHeight: 50, backgroundColor: '#f3f8f4', flexDirection: 'row', borderRadius: 15, gap: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cddfd3' },
  signOutText: { color: colors.green, fontSize: 15, fontWeight: '700' },
})
