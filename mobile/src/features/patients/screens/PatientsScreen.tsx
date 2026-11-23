import { PatientCardActions } from '../PatientCardActions'
import { patientNotices, weightChange } from '../patientNotices'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native'
import { isPatientIntent, patientDestinations } from '@/features/navigation/menu'
import { type Patient } from '@/features/appointments/models'
import { useAuth } from '@/features/auth/AuthProvider'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
import { request } from '@/core/api/client'
import { useList } from '@/shared/hooks/useList'
import { ListState } from '@/shared/ui/ListState'
import { AppDialog } from '@/shared/ui/AppDialog'
import { Button, Page, colors, styles } from '@/shared/ui/primitives'

type PatientSummary = Patient & {
  progresoPeso?: { cambioKg: number | null; mediciones: number }
  notes?: string
  mediciones?: { peso?: number; fecha?: string; createdAt?: string }[]
  phone?: string
  birthDate?: string
  sex?: 'male' | 'female' | 'other' | 'unspecified'
  accountStatus?: string | null
  ultimaConsulta?: { inicio?: string } | null
  proximaConsulta?: { inicio?: string } | null
  ultimaMedicion?: { peso?: number; estatura?: number; imc?: number } | null
  tieneExpediente?: boolean
  tienePlan?: boolean
}

const accent = '#267259'
const pale = '#f3f8f4'
const softBorder = '#d3e5d8'

function formatDate(input?: string) {
  if (!input) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(input) ? input + 'T12:00:00' : input)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function ageFromBirthdate(input?: string) {
  if (!input) return null
  const birthday = new Date(input.slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(birthday.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthday.getFullYear()
  if (today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate())) age--
  return age >= 0 && age < 125 ? age : null
}

function sexLabel(sex?: PatientSummary['sex']) {
  if (sex === 'male') return 'Masculino'
  if (sex === 'female') return 'Femenino'
  if (sex === 'other') return 'Otro'
  return null
}

function phoneForWhatsApp(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) return '52' + digits
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

function metric(label: string, value: string, icon: keyof typeof Ionicons.glyphMap) {
  return (
    <View style={local.metric} key={label}>
      <View style={local.metricHeading}>
        <Ionicons name={icon} size={14} color="#658376" />
        <Text style={local.metricLabel} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={local.metricValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

function PatientCard({ patient, selectMode, onSelect, onOpen, onResend, resending, working, onChanged, onRemoved }: {
  patient: PatientSummary
  selectMode: boolean
  onSelect: () => void
  onOpen: () => void
  onResend: () => void
  resending: boolean
  working: boolean
  onChanged: () => void
  onRemoved: () => void
}) {
  const [noticesOpen, setNoticesOpen] = useState(false)
  const notices = patientNotices(patient)
  const change = patient.progresoPeso ? patient.progresoPeso.cambioKg : weightChange(patient.mediciones)
  const pending = patient.accountStatus === 'pending'
  const weight = Number(patient.ultimaMedicion?.peso)
  const height = Number(patient.ultimaMedicion?.estatura)
  const directBmi = Number(patient.ultimaMedicion?.imc)
  const meters = height > 3 ? height / 100 : height
  const bmi = directBmi > 0 ? directBmi : (weight > 0 && meters > 0 && meters < 3 ? weight / (meters * meters) : NaN)
  const age = ageFromBirthdate(patient.birthDate)
  const sex = sexLabel(patient.sex)
  const details = [
    age !== null ? age + ' años' : null, sex,
    weight > 0 ? weight.toFixed(1) + ' kg' : null,
  ].filter(Boolean).join('  ·  ')
  const whatsapp = phoneForWhatsApp(patient.phone)
  const initials = patient.name.trim().charAt(0).toUpperCase() || 'P'

  async function openWhatsApp() {
    if (!whatsapp) return
    try {
      await Linking.openURL('https://wa.me/' + whatsapp)
    } catch {
      Alert.alert('WhatsApp no disponible', 'No fue posible abrir el enlace en este dispositivo.')
    }
  }

  return (
    <View style={[local.patientCard, working && local.activePatientCard]}>
      <View style={local.cardHeader}>
        <View style={local.avatar}><Text style={local.avatarText}>{initials}</Text></View>
        <View style={local.identity}>
          <Text style={local.patientName}>{patient.name}</Text>
          <View style={local.statusLine}>
            <View style={[local.statusDot, pending && local.pendingDot]} />
            <Text style={[local.statusText, pending && local.pendingText]}>
              {working ? 'En atención' : pending ? 'Invitación pendiente' : patient.accountStatus === 'active' ? 'Cuenta activa' : 'En seguimiento'}
            </Text>
          </View>
          {!!details && <Text style={local.personalDetails}>{details}</Text>}
        </View>
        <PatientCardActions patient={patient} noticesOpen={noticesOpen} onNotices={setNoticesOpen} onOpen={onOpen} onResend={onResend} resending={resending} onChanged={onChanged} onRemoved={onRemoved} />
      </View>
      {!!notices.length && <Pressable accessibilityRole="button" accessibilityLabel={'Ver ' + notices.length + ' avisos de ' + patient.name} onPress={() => setNoticesOpen(true)} style={local.notice}>
        <View style={local.noticeTitleRow}><Ionicons name="alert-circle-outline" size={18} color="#5f6651" /><Text style={[local.noticeTitle, { flex: 1 }]}>Atención pendiente</Text><Text style={{ color: '#9d6629', backgroundColor: '#fce7d4', padding: 6, borderRadius: 12, fontSize: 11, fontWeight: '800' }}>Aviso</Text></View>
        <Text style={local.noticeBody}>{notices[0].detail}</Text>
        <View style={[local.noticeTitleRow, { justifyContent: 'space-between', minHeight: 44 }]}><Text style={[local.personalDetails, { flex: 1 }]}>{notices[0].title}</Text><Text style={local.noticeLinkText}>Ver {notices.length} {notices.length === 1 ? 'aviso' : 'avisos'} ›</Text></View>
      </Pressable>}

      <View style={local.metricsGrid}>
        {metric('Cambio de peso', change === null ? 'Sin historial comparable' : (change > 0 ? '+' : '') + change.toFixed(1) + ' kg', 'trending-down-outline')}
        {metric('Última consulta', formatDate(patient.ultimaConsulta?.inicio) || 'Sin consultas', 'calendar-outline')}
        {metric('IMC actual', Number.isFinite(bmi) ? bmi.toFixed(1) : 'Sin medición', 'pulse-outline')}
        {metric('Próxima cita', formatDate(patient.proximaConsulta?.inicio) || 'Por programar', 'calendar-number-outline')}
      </View>

      <View style={local.cardFooter}>
        <Pressable accessibilityRole="button"
          accessibilityLabel={(selectMode ? 'Elegir paciente: ' : working ? 'Dejar de trabajar con ' : 'Trabajar con ') + patient.name}
          style={({ pressed }) => [local.workButton, pressed && styles.pressed]} onPress={onSelect}>
          <Ionicons name={selectMode ? 'checkmark-circle-outline' : working ? 'checkmark-done-outline' : 'briefcase-outline'} size={18} color={colors.white} />
          <Text style={local.workText}>{selectMode ? 'Elegir paciente' : working ? 'Dejar de trabajar' : 'Trabajar con paciente'}</Text>
          <Ionicons name="arrow-forward-outline" size={16} color={colors.white} />
        </Pressable>
        <Pressable accessibilityRole="button"
          accessibilityLabel={whatsapp ? 'Enviar WhatsApp a ' + patient.name : 'WhatsApp no disponible, falta un teléfono válido'}
          accessibilityState={{ disabled: !whatsapp }}
          disabled={!whatsapp} onPress={() => void openWhatsApp()}
          style={({ pressed }) => [local.whatsButton, !whatsapp && styles.disabled, pressed && styles.pressed]}>
          <Ionicons name="logo-whatsapp" size={25} color={accent} />
        </Pressable>
      </View>
    </View>
  )
}

export default function Patients() {
  const { intent } = useLocalSearchParams<{ intent?: string }>()
  const selectMode = isPatientIntent(intent)
  const { session } = useAuth()
  const { active, start, stop } = usePatientWork()
  const list = useList<PatientSummary>('/pacientes', 'pacientes')
  const [selection, setSelection] = useState<PatientSummary | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)

  const normalized = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const results = list.rows.filter(item =>
    [item.name, item.email, item.phone].some(value =>
      String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized)))
  const pendingCount = list.rows.filter(item => item.accountStatus === 'pending').length

  function activate(patient: PatientSummary) {
    start(patient)
    if (isPatientIntent(intent)) {
      router.replace({ pathname: patientDestinations[intent], params: { patient: patient._id } })
    } else {
      router.push({ pathname: '/paciente', params: { id: patient._id } })
    }
  }

  function choose(patient: PatientSummary) {
    if (selectMode && (!active || active.id === patient._id)) activate(patient)
    else setSelection(patient)
  }

  const ending = !!selection && !selectMode && selection._id === active?.id
  const switching = !!selection && !!active && active.id !== selection._id

  function confirmSelection() {
    if (!selection) return
    setSelection(null)
    if (ending) stop()
    else activate(selection)
  }

  function confirmResend(patient: PatientSummary) {
    Alert.alert('Reenviar invitación', '¿Deseas enviar otra invitación a ' + patient.name + '?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reenviar', onPress: () => void resend(patient) },
    ])
  }

  async function resend(patient: PatientSummary) {
    if (!session?.token) return
    setResendingId(patient._id)
    try {
      await request('/pacientes/' + patient._id + '/reenviar-invitacion', { token: session.token, method: 'POST' })
      Alert.alert('Invitación enviada', 'Se envió nuevamente la invitación al correo del paciente.')
    } catch (error) {
      Alert.alert('No se pudo reenviar', error instanceof Error ? error.message : 'Inténtalo nuevamente.')
    } finally {
      setResendingId(null)
    }
  }

  function closeCreate() {
    if (saving) return
    setShowCreate(false)
    setFormError('')
  }

  async function createPatient() {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2) {
      setFormError('Escribe el nombre completo del paciente.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Ingresa un correo válido para enviar la invitación.')
      return
    }
    if (!session?.token) {
      setFormError('Tu sesión no está disponible. Vuelve a iniciar sesión.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await request('/pacientes', {
        token: session.token, method: 'POST',
        body: { name: cleanName, email: cleanEmail, phone: phone.trim() },
      })
      setShowCreate(false)
      setName('')
      setEmail('')
      setPhone('')
      list.reload()
      Alert.alert('Paciente registrado', 'Se creó el paciente y se envió su invitación por correo.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No pudimos registrar al paciente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <AppDialog visible={!!selection} onClose={() => setSelection(null)}
        title={ending ? '¿Finalizar atención?' : switching ? '¿Cambiar de paciente?' : 'Trabajar con paciente'}
        message={ending ? 'El paciente dejará de estar en atención.' : switching
          ? 'Paciente en atención: ' + active?.name : 'Abre la ficha y activa el contexto de este paciente.'}>
        {selection && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
          padding: 12, borderRadius: 14, backgroundColor: pale, borderWidth: 1, borderColor: softBorder }}>
          <Ionicons name="person-circle-outline" size={30} color={accent} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.body, { fontSize: 12 }]}>{ending ? 'Paciente en atención' : 'Paciente seleccionado'}</Text>
            <Text style={styles.cardTitle}>{selection.name}</Text>
          </View>
        </View>}
        <View style={styles.row}>
          <Button expand selected={false} label="Cancelar" onPress={() => setSelection(null)} />
          <Button expand label={ending ? 'Finalizar atención' : selectMode ? 'Continuar' : 'Abrir ficha'} onPress={confirmSelection} />
        </View>
      </AppDialog>
      <View style={local.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={local.pageTitle}>
            {selectMode ? 'Elegir paciente' : 'Pacientes'}
          </Text>
          <Text style={local.subtitle}>
            {list.loading ? 'Cargando pacientes…' :
              list.rows.length + (list.rows.length === 1 ? ' paciente registrado' : ' pacientes registrados')}
          </Text>
        </View>
        {!!pendingCount && <View style={local.pendingBadge}>
          <Ionicons name="notifications-outline" size={16} color="#9d6629" />
          <Text style={local.pendingBadgeText}>{pendingCount}</Text>
        </View>}
      </View>

      {selectMode && (
        <View style={local.selectionHelp}>
          <Ionicons name="information-circle-outline" size={20} color={accent} />
          <Text style={local.selectionText}>Selecciona un paciente para continuar con el apartado elegido.</Text>
        </View>
      )}

      <View style={local.searchBox}>
        <Ionicons name="search-outline" size={21} color="#718e7f" />
        <TextInput accessibilityLabel="Buscar pacientes"
          placeholder="Buscar paciente..." placeholderTextColor="#789286"
          style={local.searchInput} value={search} onChangeText={setSearch}
          autoCorrect={false} returnKeyType="search" />
        {!!search && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda"
          onPress={() => setSearch('')} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#7b9588" />
        </Pressable>}
      </View>

      {!selectMode && session?.user.role === 'nutritionist' && (
        <Pressable accessibilityRole="button" onPress={() => { setFormError(''); setShowCreate(true) }}
          style={({ pressed }) => [local.createButton, pressed && styles.pressed]}>
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={local.createText}>Nuevo paciente</Text>
        </Pressable>
      )}

      {list.loading || list.error || !list.rows.length ? (
        <ListState {...list} empty="Aún no tienes pacientes. Registra uno para comenzar." />
      ) : !results.length ? (
        <View style={local.emptySearch}>
          <Ionicons name="search-outline" size={30} color="#80a18e" />
          <Text style={local.emptyTitle}>No encontramos pacientes</Text>
          <Text style={local.emptyText}>Prueba otro nombre, correo o teléfono.</Text>
          <Pressable onPress={() => setSearch('')} accessibilityRole="button" style={local.clearButton}>
            <Text style={local.clearText}>Limpiar búsqueda</Text>
          </Pressable>
        </View>
      ) : (
        <View style={local.cards}>
          {results.map(patient => (
            <PatientCard key={patient._id} patient={patient} selectMode={selectMode}
              working={active?.id === patient._id}
              onSelect={() => choose(patient)}
              onOpen={() => selectMode ? choose(patient) : router.push({ pathname: '/paciente', params: { id: patient._id } })}
              onResend={() => confirmResend(patient)}
              resending={resendingId === patient._id} onChanged={list.reload} onRemoved={() => { if (active?.id === patient._id) stop() }} />
          ))}
        </View>
      )}

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={closeCreate}>
        <KeyboardAvoidingView style={local.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={local.modalCard}>
            <View style={local.modalTitleRow}>
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={local.modalTitle}>Nuevo paciente</Text>
                <Text style={local.modalCaption}>Le enviaremos un correo de invitación.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario"
                onPress={closeCreate} disabled={saving} hitSlop={8}>
                <Ionicons name="close" size={25} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={local.fieldLabel}>Nombre completo *</Text>
            <TextInput style={local.field} placeholder="Nombre y apellidos" placeholderTextColor="#809789"
              value={name} onChangeText={setName} autoCapitalize="words" />
            <Text style={local.fieldLabel}>Correo electrónico *</Text>
            <TextInput style={local.field} placeholder="correo@ejemplo.com" placeholderTextColor="#809789"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              autoCorrect={false} />
            <Text style={local.fieldLabel}>Teléfono (opcional)</Text>
            <TextInput style={local.field} placeholder="Número de contacto" placeholderTextColor="#809789"
              value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            {!!formError && <Text accessibilityRole="alert" style={local.formError}>{formError}</Text>}
            <View style={local.modalActions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={closeCreate}
                style={[local.cancelButton, saving && styles.disabled]}>
                <Text style={local.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={saving}
                onPress={() => void createPatient()} style={[local.saveButton, saving && styles.disabled]}>
                <Text style={local.saveText}>{saving ? 'Guardando…' : 'Guardar paciente'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Page>
  )
}

const local = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 3 },
  pageTitle: { fontSize: 29, fontWeight: '800', color: colors.ink, letterSpacing: -0.7 },
  subtitle: { color: '#597c69', fontSize: 13, marginTop: 4 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff0dc' },
  pendingBadgeText: { color: '#9d6629', fontSize: 13, fontWeight: '800' },
  selectionHelp: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#eff7f0', borderRadius: 15, padding: 13 },
  selectionText: { color: colors.muted, flex: 1, fontSize: 13, lineHeight: 18 },
  searchBox: { minHeight: 49, paddingHorizontal: 14, gap: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#c8decf', borderRadius: 14, backgroundColor: '#fbfdfb' },
  searchInput: { color: colors.ink, fontSize: 15, flex: 1, minHeight: 46, paddingVertical: 8 },
  createButton: { minHeight: 48, backgroundColor: '#236a53', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  cards: { gap: 14, paddingBottom: 14 },
  activePatientCard: { borderWidth: 2, borderColor: '#409166', backgroundColor: '#eaf6ed' },
  patientCard: { borderWidth: 1.3, borderColor: '#a6ceb3', borderRadius: 23, backgroundColor: '#f7fbf7', padding: 15, gap: 14, shadowColor: '#285e43', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 },
  avatar: { width: 44, height: 48, borderRadius: 16, backgroundColor: '#dceee3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 23, color: '#236e54', fontWeight: '800' },
  identity: { flex: 1, minWidth: 120, paddingTop: 2 },
  patientName: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#48a472' },
  pendingDot: { backgroundColor: '#db9f4c' },
  statusText: { color: '#337b5c', fontSize: 12, fontWeight: '600' },
  pendingText: { color: '#96652e' },
  personalDetails: { color: '#6d8778', fontSize: 11, marginTop: 6, lineHeight: 16 },
  headerArrow: { width: 31, height: 36, alignItems: 'center', justifyContent: 'center' },
  notice: { padding: 13, gap: 7, backgroundColor: '#eff5ef', borderWidth: 1, borderColor: '#cde1d2', borderRadius: 16 },
  noticeTitleRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  noticeTitle: { fontSize: 12, fontWeight: '800', color: '#7d572a' },
  noticeBody: { color: '#526d5b', fontSize: 12, lineHeight: 18 },
  noticeLink: { alignSelf: 'flex-end', flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 5 },
  noticeLinkText: { fontSize: 12, fontWeight: '700', color: accent },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48.5%', flexGrow: 1, minHeight: 70, borderWidth: 1, borderColor: softBorder, backgroundColor: pale, borderRadius: 14, padding: 10, justifyContent: 'space-between', gap: 6 },
  metricHeading: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricLabel: { color: '#688778', fontSize: 10, flexShrink: 1 },
  metricValue: { color: '#174b39', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  workButton: { flex: 1, minHeight: 47, backgroundColor: accent, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 7 },
  workText: { flexShrink: 1, color: colors.white, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  whatsButton: { width: 48, height: 47, borderRadius: 13, backgroundColor: '#e6f3e9', borderWidth: 1, borderColor: '#b9ddc3', alignItems: 'center', justifyContent: 'center' },
  emptySearch: { backgroundColor: '#f6fbf7', padding: 26, borderRadius: 20, alignItems: 'center', gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  clearButton: { padding: 9 },
  clearText: { color: accent, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#13382d88', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#f8fcf9', borderRadius: 23, padding: 19, gap: 10, maxWidth: 460, width: '100%', alignSelf: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  modalTitle: { fontSize: 23, fontWeight: '800', color: colors.ink },
  modalCaption: { color: '#688778', fontSize: 12, marginTop: 4 },
  fieldLabel: { color: '#2f654d', fontWeight: '700', fontSize: 12 },
  field: { minHeight: 46, borderWidth: 1, borderColor: '#cbdfd0', backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, fontSize: 14 },
  formError: { fontSize: 12, color: colors.error, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#eaf2ec' },
  cancelText: { color: '#30604b', fontWeight: '700', fontSize: 13 },
  saveButton: { flex: 1.4, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: accent },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 13 },
})
