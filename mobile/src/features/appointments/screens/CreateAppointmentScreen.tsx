import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useRef, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { DateField } from '@/shared/ui/DateTimeField'
import { dayValue, parseDay } from '@/shared/ui/dateTimeModel'
import { ApiError, request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
import {
  appointmentPath, dayLabel, type Appointment, matchesPatient, shiftDate,
  type Availability, type Patient,
} from '@/features/appointments/models'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, colors, styles } from '@/shared/ui/primitives'
import { useList } from '@/shared/hooks/useList'
import { useResource } from '@/shared/hooks/useResource'

const types = [
  { key: 'primera', label: 'Primera consulta', icon: 'sparkles-outline' },
  { key: 'seguimiento', label: 'Seguimiento', icon: 'pulse-outline' },
  { key: 'otra', label: 'Otra consulta', icon: 'chatbubble-ellipses-outline' },
] as const
type AppointmentType = typeof types[number]['key']

function StepTitle({ number, title, description, completed }: {
  number: string; title: string; description?: string; completed?: boolean
}) {
  return <View style={s.stepTitle}>
    <View style={[s.stepCircle, completed && s.stepComplete]}>
      {completed ? <Ionicons name="checkmark" size={18} color="#fff" /> :
        <Text style={s.stepNumber}>{number}</Text>}
    </View>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={s.stepHeading}>{title}</Text>
      {!!description && <Text style={s.stepCaption}>{description}</Text>}
    </View>
  </View>
}

export default function BookAppointment() {
  const { patient, date, id, start } = useLocalSearchParams<{
    patient?: string; date?: string; id?: string; start?: string
  }>()
  const timestamp = typeof start === 'string' ? Date.parse(start) : NaN
  const valid = typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) && Number.isFinite(timestamp)
  const appointment = useResource<Appointment[]>(valid ?
    appointmentPath(new Date(timestamp), new Date(timestamp + 1)) : null)
  if (!id) return <AppointmentForm initialPatient={patient} initialDate={date} />
  const existing = appointment.data?.find(item => item._id === id)
  return <>
    <Stack.Screen options={{ title: 'Reprogramar cita' }} />
    {existing?.patient && ['programada', 'confirmada'].includes(existing.estado) &&
    Date.parse(existing.inicio) > Date.now() ? (
      <AppointmentForm initialPatient={existing.patient._id}
        initialDate={dayValue(new Date(existing.inicio))} existing={existing} />
    ) : <Page bottomInset><ListState {...appointment}
      empty="Esta cita ya no se puede reprogramar." /></Page>}
  </>
}

function AppointmentForm({ initialPatient, initialDate, existing }: {
  initialPatient?: string; initialDate?: string; existing?: Appointment
}) {
  const { session, signOut } = useAuth()
  const { active } = usePatientWork()
  const patients = useList<Patient>('/pacientes', 'pacientes')
  const initialValidDate = initialDate && parseDay(initialDate) ? initialDate : ''
  const [patient, setPatient] = useState(initialPatient || active?.id || '')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState(initialValidDate)
  const [from, setFrom] = useState(initialValidDate)
  const [calendarDate, setCalendarDate] = useState(initialValidDate)
  const [slot, setSlot] = useState('')
  const [type, setType] = useState<AppointmentType>(
    existing && types.some(item => item.key === existing.tipo)
      ? existing.tipo as AppointmentType : 'seguimiento')
  const [notes, setNotes] = useState(existing?.notas || '')
  const [notesOpen, setNotesOpen] = useState(!!existing?.notas)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ calendarSynced: boolean; summary: string }>()
  const locked = useRef(false)
  const availability = useResource<Availability>('/horario/disponibilidad?dias=7' + (from ? '&desde=' + from : ''))
  const data = availability.data
  const day = data?.dias.find(item => item.fecha === date) || data?.dias[0]
  const calendarValid = !calendarDate || Boolean(parseDay(calendarDate) &&
    data && calendarDate >= data.hoy && calendarDate <= shiftDate(data.hoy, 180))
  const selected = calendarValid ? day?.espacios.find(item => item.inicio === slot) : undefined
  const selectedPatient = patients.rows.find(item => item._id === patient)
  const matching = patients.rows.filter(item => matchesPatient(item, search)).slice(0, 6)

  useEffect(() => {
    if (!initialPatient && active?.id) setPatient(value => value || active.id)
  }, [active?.id, initialPatient])

  useEffect(() => {
    if (!data || calendarDate || date) return
    const first = data.dias.find(item => item.fecha >= data.hoy && item.espacios.length)?.fecha ||
      data.dias.find(item => item.fecha >= data.hoy)?.fecha
    if (first) {
      setDate(first)
      setCalendarDate(first)
    }
  }, [data, calendarDate, date])

  function chooseDate(value: string) {
    setCalendarDate(value)
    setDate(value)
    setSlot('')
    setError('')
    if (!data || !data.dias.some(item => item.fecha === value)) setFrom(value)
  }
  function changeWeek(direction: -1 | 1) {
    if (!data) return
    const desired = shiftDate(data.desde, 7 * direction)
    if (desired < data.hoy || desired > shiftDate(data.hoy, 180)) return
    setDate(desired)
    setCalendarDate(desired)
    setFrom(desired)
    setSlot('')
    setError('')
  }

  async function save() {
    if (locked.current || saved || !session || !data || !selected || !selectedPatient || !day) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      const result = await request<{ calendarSynced: boolean }>(existing ? '/citas/' + existing._id : '/citas', {
        token: session.token, method: existing ? 'PUT' : 'POST',
        body: {
          patient, inicio: selected.inicio, zonaHoraria: data.zonaHoraria,
          tipo: type, estado: existing?.estado ?? 'programada', notas: notes.trim(),
        },
      })
      setSaved({
        calendarSynced: result.calendarSynced,
        summary: selectedPatient.name + ' · ' + dayLabel(day.fecha) + ' · ' + selected.hora,
      })
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        try { await signOut() } catch { setError('La sesión expiró. Vuelve a iniciar sesión.') }
        return
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cita.')
      if (cause instanceof ApiError && cause.status === 409) {
        setSlot('')
        availability.reload()
      }
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  if (saved) return <Page bottomInset>
    <View style={s.savedCard}>
      <View style={s.savedIcon}><Ionicons name="checkmark-done" size={37} color="#fff" /></View>
      <Text accessibilityRole="header" style={s.title}>{existing ? 'Cita reprogramada' : '¡Cita registrada!'}</Text>
      <Text style={s.savedSummary}>{saved.summary}</Text>
      {saved.calendarSynced === false && <Text style={s.caption}>
        La cita quedó guardada, pero Google Calendar no confirmó la sincronización.</Text>}
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/citas')} style={s.primary}>
      <Text style={s.primaryText}>Ver agenda</Text><Ionicons name="arrow-forward" color="#fff" size={18} />
    </Pressable>
  </Page>

  return <Page bottomInset>
    <View style={s.hero}>
      <View style={s.heroIcon}><Ionicons name="calendar-number-outline" size={29} color="#fff" /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.eyebrow}>{existing ? 'ACTUALIZAR CONSULTA' : 'AGENDA UNA CONSULTA'}</Text>
        <Text accessibilityRole="header" style={s.title}>{existing ? 'Reprogramar cita' : 'Nueva cita'}</Text>
        <Text style={s.caption}>Selecciona a quién atender y elige un horario disponible.</Text>
      </View>
    </View>
    <View style={s.stepCard}>
      <StepTitle number="1" title="Paciente" description="¿A quién vas a atender?"
        completed={!!selectedPatient} />
      {selectedPatient ? <View style={s.patientSelected}>
        <View style={s.patientAvatar}><Text style={s.avatarText}>
          {selectedPatient.name.trim().charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.patientName}>{selectedPatient.name}</Text>
          {!!selectedPatient.email && <Text style={s.caption} numberOfLines={1}>{selectedPatient.email}</Text>}
        </View>
        {!existing && <Pressable accessibilityRole="button" accessibilityLabel="Cambiar paciente"
          disabled={saving} style={s.change} onPress={() => { setPatient(''); setSearch('') }}>
          <Text style={s.changeText}>Cambiar</Text>
        </Pressable>}
      </View> : existing ? (
        <Text style={s.caption}>{patients.loading ? 'Cargando paciente…' :
          patients.error || 'El paciente no está disponible.'}</Text>
      ) : <View style={{ gap: 10 }}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={19} color={colors.green} />
          <TextInput accessibilityLabel="Buscar paciente" value={search} onChangeText={setSearch}
            placeholder="Buscar por nombre o correo" placeholderTextColor="#8ba394"
            style={s.searchInput} autoCorrect={false} />
        </View>
        {patients.loading || patients.error ? <ListState {...patients} /> :
          matching.map(item => <Pressable key={item._id} accessibilityRole="button"
            accessibilityLabel={'Elegir a ' + item.name}
            style={({ pressed }) => [s.patientOption, pressed && styles.pressed]}
            onPress={() => setPatient(item._id)}>
            <View style={s.smallAvatar}><Text style={s.smallAvatarText}>
              {item.name.trim().charAt(0).toUpperCase()}</Text></View>
            <Text style={s.optionName} numberOfLines={2}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.green} />
          </Pressable>)}
        {!matching.length && !patients.loading &&
          <Text style={s.caption}>No encontramos pacientes con esa búsqueda.</Text>}
      </View>}
    </View>

    <View style={s.stepCard}>
      <StepTitle number="2" title="Fecha de la consulta" description="Explora la semana o elige otro día"
        completed={!!day && day.fecha === calendarDate && calendarValid} />
      {availability.loading || availability.error ? <View style={{ gap: 8 }}>
        <ListState {...availability} />
        {!!availability.error && /configur|horario|bloques/i.test(availability.error) &&
          <View style={{gap:8}}><Text style={s.hint}>Configura tu horario laboral y los bloques de consulta para habilitar la agenda.</Text><Button label="Configurar horarios" selected={false} onPress={()=>router.push('/horarios')}/></View>}
      </View> : data && <View style={{ gap: 13 }}>
        <View style={s.weekNav}>
          <Pressable accessibilityRole="button" accessibilityLabel="Semana anterior" style={s.weekButton}
            disabled={data.desde <= data.hoy} onPress={() => changeWeek(-1)}>
            <Ionicons name="chevron-back" size={22} color={colors.green} />
          </Pressable>
          <Text style={s.weekTitle}>{dayLabel(data.desde, true)} · 7 días</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Semana siguiente" style={s.weekButton}
            disabled={shiftDate(data.desde, 7) > shiftDate(data.hoy, 180)}
            onPress={() => changeWeek(1)}>
            <Ionicons name="chevron-forward" size={22} color={colors.green} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.days}>
          {data.dias.map(item => {
            const selectedDay = day?.fecha === item.fecha
            const dayDate = new Date(item.fecha + 'T12:00:00')
            const enabled = item.espacios.length > 0 && item.fecha >= data.hoy
            return <Pressable key={item.fecha} accessibilityRole="button"
              accessibilityLabel={dayLabel(item.fecha) + ', ' + item.espacios.length + ' espacios'}
              accessibilityState={{ selected: selectedDay, disabled: !enabled }}
              disabled={!enabled || saving} onPress={() => chooseDate(item.fecha)}
              style={[s.dayChip, selectedDay && s.dayChipSelected, !enabled && s.dayChipDisabled]}>
              <Text style={[s.dayChipWeek, selectedDay && s.dayChipTextSelected]}>
                {new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(dayDate).slice(0, 3)}
              </Text>
              <Text style={[s.dayChipDate, selectedDay && s.dayChipTextSelected]}>{dayDate.getDate()}</Text>
              <Text style={[s.dayChipSpaces, selectedDay && s.dayChipTextSelected]}>
                {item.espacios.length ? item.espacios.length + ' libres' : 'Sin cupo'}
              </Text>
            </Pressable>
          })}
        </ScrollView>
        <DateField label="Elegir otra fecha en el calendario"
          disabled={saving} value={calendarDate || day?.fecha || data.desde}
          onChange={value => {
            setCalendarDate(value)
            setSlot('')
            if (!parseDay(value)) { setError('Selecciona una fecha válida.'); return }
            if (value < data.hoy || value > shiftDate(data.hoy, 180)) {
              setError('Selecciona una fecha entre hoy y los próximos 180 días.')
              return
            }
            chooseDate(value)
          }} />
      </View>}
    </View>

    <View style={s.stepCard}>
      <StepTitle number="3" title="Horario disponible" description="Bloques de 60 minutos"
        completed={!!selected} />
      <View style={s.timeHeading}>
        <Ionicons name="time-outline" size={21} color={colors.green} />
        <Text style={s.timeHeadingText}>{day ? dayLabel(day.fecha) : 'Elige primero una fecha'}</Text>
      </View>
      {!data ? <Text style={s.hint}>La disponibilidad se mostrará cuando termine de cargar el calendario.</Text> :
        !day?.espacios.length ? <View style={s.noSlots}>
          <Ionicons name="calendar-clear-outline" size={28} color="#7aa589" />
          <Text style={s.hint}>No hay horarios disponibles para esta fecha. Elige otro día.</Text>
        </View> : <View style={s.slots}>
          {day.espacios.map(space => <Pressable key={space.inicio}
            accessibilityRole="button" accessibilityLabel={'Reservar horario ' + space.hora}
            accessibilityState={{ selected: selected?.inicio === space.inicio }}
            disabled={saving} onPress={() => { setSlot(space.inicio); setError('') }}
            style={({ pressed }) => [s.slot, selected?.inicio === space.inicio && s.slotSelected,
              pressed && styles.pressed]}>
            <Ionicons name={selected?.inicio === space.inicio ? 'checkmark-circle' : 'time-outline'}
              color={selected?.inicio === space.inicio ? '#fff' : colors.green} size={16} />
            <Text style={[s.slotText, selected?.inicio === space.inicio && s.slotTextSelected]}>{space.hora}</Text>
          </Pressable>)}
        </View>}
    </View>

    <View style={s.stepCard}>
      <StepTitle number="4" title="Detalles finales" description="Tipo y observaciones de la consulta"
        completed={!!selected && !!selectedPatient} />
      <Text style={s.fieldLabel}>Tipo de consulta</Text>
      <View style={s.types}>
        {types.map(item => <Pressable key={item.key} accessibilityRole="button"
          accessibilityLabel={item.label} accessibilityState={{ selected: item.key === type }}
          disabled={saving} onPress={() => setType(item.key)}
          style={[s.typeChip, item.key === type && s.typeSelected]}>
          <Ionicons name={item.icon} size={19} color={item.key === type ? '#fff' : colors.green} />
          <Text style={[s.typeText, item.key === type && s.typeTextSelected]}>{item.label}</Text>
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: notesOpen }}
        onPress={() => setNotesOpen(open => !open)} style={s.notesToggle}>
        <Ionicons name="document-text-outline" size={19} color={colors.green} />
        <Text style={s.notesToggleText}>Notas privadas (opcional)</Text>
        <Ionicons name={notesOpen ? 'chevron-up' : 'chevron-down'} size={19} color={colors.green} />
      </Pressable>
      {notesOpen && <TextInput value={notes} onChangeText={setNotes} editable={!saving}
        accessibilityLabel="Notas privadas" placeholder="Detalles administrativos de la cita"
        placeholderTextColor="#8ba394" multiline maxLength={500} style={s.notesInput} />}
    </View>

    <View style={s.review}>
      <View style={s.reviewTop}>
        <Ionicons name="checkmark-done-outline" color="#367657" size={22} />
        <Text style={s.reviewTitle}>Resumen de la cita</Text>
      </View>
      <Text style={s.reviewText}>
        {selectedPatient?.name || 'Selecciona un paciente'}
        {'\n'}
        {day && selected ? dayLabel(day.fecha) + ' · ' + selected.hora : 'Fecha y horario pendientes'}
      </Text>
      {!!data && <Text style={s.hint}>{data.zonaHoraria} · 60 minutos</Text>}
    </View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable accessibilityRole="button"
      disabled={saving || !selectedPatient || !selected || !calendarValid}
      onPress={() => {
        if (!selectedPatient || !selected || !day) return
        Alert.alert(existing ? 'Reprogramar cita' : 'Confirmar cita',
          selectedPatient.name + ' · ' + dayLabel(day.fecha) + ' · ' + selected.hora, [
            { text: 'Volver', style: 'cancel' },
            { text: existing ? 'Reprogramar' : 'Agendar', onPress: () => void save() },
          ])
      }}
      style={({ pressed }) => [s.primary, (saving || !selectedPatient || !selected || !calendarValid) && styles.disabled,
        pressed && styles.pressed]}>
      <Ionicons name="calendar-number-outline" color="#fff" size={20} />
      <Text style={s.primaryText}>{saving ? 'Guardando…' : existing ? 'Confirmar reprogramación' : 'Confirmar y registrar cita'}</Text>
      <Ionicons name="arrow-forward-outline" color="#fff" size={18} />
    </Pressable>
  </Page>
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 8 },
  heroIcon: { width: 61, height: 61, backgroundColor: '#20684e', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: '#3f8060' },
  title: { color: colors.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  stepCard: { padding: 16, gap: 14, backgroundColor: '#fbfdfb', borderWidth: 1, borderColor: '#d1e3d6', borderRadius: 22 },
  stepTitle: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepCircle: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e1f0e5' },
  stepComplete: { backgroundColor: '#36845f' },
  stepNumber: { color: '#23664e', fontSize: 16, fontWeight: '800' },
  stepHeading: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  stepCaption: { color: colors.muted, fontSize: 11 },
  patientSelected: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 11, backgroundColor: '#e7f3e9', borderRadius: 16 },
  patientAvatar: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cde8d4', borderRadius: 14 },
  avatarText: { fontSize: 21, fontWeight: '800', color: '#22684c' },
  patientName: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  change: { minHeight: 40, paddingHorizontal: 9, justifyContent: 'center' },
  changeText: { fontSize: 12, color: colors.green, fontWeight: '800' },
  searchBox: { flexDirection: 'row', gap: 9, alignItems: 'center', borderRadius: 13, borderWidth: 1, borderColor: '#cbded2', backgroundColor: '#f6faf6', paddingHorizontal: 11 },
  searchInput: { flex: 1, minHeight: 46, fontSize: 14, color: colors.ink },
  patientOption: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, borderRadius: 14, borderWidth: 1, borderColor: '#d7e7da' },
  smallAvatar: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ddf0e3' },
  smallAvatarText: { fontWeight: '800', color: colors.green },
  optionName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  weekButton: { width: 41, height: 42, borderRadius: 12, backgroundColor: '#e6f2e8', justifyContent: 'center', alignItems: 'center' },
  weekTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  days: { flexDirection: 'row', gap: 7 },
  dayChip: { minWidth: 76, minHeight: 96, borderRadius: 14, paddingHorizontal: 7, paddingVertical: 10, borderWidth: 1, borderColor: '#cbded2', backgroundColor: '#f3f8f4', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dayChipSelected: { backgroundColor: '#236c52', borderColor: '#236c52' },
  dayChipDisabled: { opacity: 0.46 },
  dayChipWeek: { fontSize: 11, fontWeight: '700', color: '#5c826d', textTransform: 'capitalize' },
  dayChipDate: { fontSize: 21, fontWeight: '800', color: colors.ink },
  dayChipSpaces: { fontSize: 10, fontWeight: '700', color: '#638675' },
  dayChipTextSelected: { color: '#fff' },
  timeHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeHeadingText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { minHeight: 44, minWidth: 102, flexGrow: 1, flexBasis: '30%', borderRadius: 13, borderWidth: 1, borderColor: '#b9d7c2', backgroundColor: '#f1f8f2', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 7 },
  slotSelected: { backgroundColor: '#246d53', borderColor: '#246d53' },
  slotText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  slotTextSelected: { color: '#fff' },
  noSlots: { backgroundColor: '#f1f7f2', padding: 20, borderRadius: 15, gap: 8, alignItems: 'center' },
  hint: { color: '#657f6c', fontSize: 12, lineHeight: 18 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', borderRadius: 13, paddingHorizontal: 11, backgroundColor: '#eef6ef', borderWidth: 1, borderColor: '#c6ddcc' },
  typeSelected: { backgroundColor: '#287456', borderColor: '#287456' },
  typeText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  typeTextSelected: { color: '#fff' },
  notesToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#f0f7f1' },
  notesToggleText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.green },
  notesInput: { minHeight: 95, textAlignVertical: 'top', padding: 12, borderRadius: 13, borderWidth: 1, borderColor: '#c6decb', color: colors.ink, fontSize: 14 },
  review: { backgroundColor: '#e8f4ea', borderColor: '#bad9c3', borderWidth: 1, borderRadius: 18, padding: 15, gap: 6 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  reviewText: { color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  error: { color: '#9c3030', backgroundColor: '#fff0ed', borderRadius: 13, padding: 13, fontSize: 13, lineHeight: 18 },
  primary: { minHeight: 53, backgroundColor: '#236c52', borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { flexShrink: 1, fontWeight: '800', fontSize: 14, color: '#fff', textAlign: 'center' },
  savedCard: { padding: 28, borderRadius: 24, alignItems: 'center', backgroundColor: '#f7fbf8', borderWidth: 1, borderColor: '#c7dfcc', gap: 14 },
  savedIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#348963', justifyContent: 'center', alignItems: 'center' },
  savedSummary: { fontSize: 15, lineHeight: 22, textAlign: 'center', color: colors.ink, fontWeight: '700' },
})
