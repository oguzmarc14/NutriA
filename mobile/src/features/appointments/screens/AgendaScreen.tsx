import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo, useState } from 'react'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
import { appointmentPath, type Appointment } from '@/features/appointments/models'
import { period, type View as AgendaView } from '@/features/appointments/calendar'
import { calendarDays, dayValue } from '@/shared/ui/dateTimeModel'
import { useList } from '@/shared/hooks/useList'
import { ListState } from '@/shared/ui/ListState'
import { Page, colors, styles } from '@/shared/ui/primitives'

const views: AgendaView[] = ['Día', 'Semana', 'Mes']
const options = [
  { key: 'todas', label: 'Todas' },
  { key: 'programada', label: 'Programadas' },
  { key: 'confirmada', label: 'Confirmadas' },
  { key: 'completada', label: 'Completadas' },
  { key: 'cancelada', label: 'Canceladas' },
] as const
type Filter = typeof options[number]['key']

const timeFormatter = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' })
const rangeFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
const monthFormat = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
const weekdayFormat = new Intl.DateTimeFormat('es-MX', { weekday: 'short' })
const fullFormat = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const dateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)

function statusInfo(estado: string) {
  switch (estado) {
    case 'programada': return { label: 'Programada', color: '#976b2b', bg: '#fff3db', dot: '#e4a34a' }
    case 'confirmada': return { label: 'Confirmada', color: '#286e56', bg: '#e2f3e8', dot: '#439c72' }
    case 'completada': return { label: 'Completada', color: '#526778', bg: '#e7eff5', dot: '#7295ab' }
    case 'cancelada': return { label: 'Cancelada', color: '#995a59', bg: '#f9eaea', dot: '#c8817a' }
    default: return { label: estado || 'Sin estado', color: colors.muted, bg: '#edf3ed', dot: '#a5b8a9' }
  }
}
function dateFromISO(iso: string) {
  const date = new Date(iso)
  return Number.isFinite(date.getTime()) ? date : null
}
function DayCalendar({ date, dates, countByDay, onPick, currentMonth }: {
  date: Date; dates: Date[]; countByDay: Map<string, number>
  onPick: (next: Date) => void; currentMonth?: boolean
}) {
  const today = dayValue(new Date())
  const selected = dayValue(date)
  return <View style={s.dayGrid}>
    {dates.map(day => {
      const key = dayValue(day)
      const current = selected === key
      const count = countByDay.get(key) || 0
      return <Pressable key={key} accessibilityRole="button"
        accessibilityLabel={key + (count ? ', ' + count + (count === 1 ? ' cita' : ' citas') : ', sin citas')}
        accessibilityState={{ selected: current }}
        onPress={() => onPick(day)}
        style={({ pressed }) => [s.dayCell, current && s.daySelected, pressed && styles.pressed]}>
        <Text style={[s.dayWeekday, current && s.selectedText, currentMonth && day.getMonth() !== date.getMonth() && s.mutedDay]}>
          {weekdayFormat.format(day).slice(0, 3)}
        </Text>
        <Text style={[s.dayNumber, current && s.selectedText, currentMonth && day.getMonth() !== date.getMonth() && s.mutedDay]}>
          {day.getDate()}
        </Text>
        <View style={[s.dayMark, current && s.selectedMark,
          !count && key === today && !current && s.todayMark,
          !count && key !== today && { opacity: 0 }]}>
          {!!count && <Text style={[s.countText, current && s.selectedText]}>{count > 9 ? '9+' : count}</Text>}
        </View>
      </Pressable>
    })}
  </View>
}
function AgendaCard({ item }: { item: Appointment }) {
  const date = dateFromISO(item.inicio)
  const state = statusInfo(item.estado)
  const type = item.tipo === 'primera' ? 'Primera consulta' :
    item.tipo === 'seguimiento' ? 'Seguimiento' : item.tipo === 'otra' ? 'Otra consulta' : item.tipo || 'Consulta'
  return <Pressable accessibilityRole="button"
    accessibilityLabel={'Ver cita de ' + (item.patient?.name || 'Paciente') + ', ' + (date ? timeFormatter.format(date) : '') + ', ' + state.label}
    onPress={() => router.push({ pathname: '/consulta', params: { id: item._id, start: item.inicio } })}
    style={({ pressed }) => [s.appointmentCard, pressed && styles.pressed]}>
    <View style={s.timeBox}>
      <Ionicons name="time-outline" size={19} color={colors.green} />
      <Text style={s.timeText}>{date ? timeFormatter.format(date) : 'Sin hora'}</Text>
    </View>
    <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
      <Text style={s.patientName} numberOfLines={2}>{item.patient?.name || 'Paciente no disponible'}</Text>
      <Text style={s.visitType} numberOfLines={1}>{type}</Text>
      <View style={[s.stateBadge, { backgroundColor: state.bg }]}>
        <View style={[s.stateDot, { backgroundColor: state.dot }]} />
        <Text style={[s.stateText, { color: state.color }]}>{state.label}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" color={colors.green} size={19} />
  </Pressable>
}

export default function Appointments() {
  const { active } = usePatientWork()
  const [view, setView] = useState<AgendaView>('Día')
  const [date, setDate] = useState(() => new Date())
  const [filter, setFilter] = useState<Filter>('todas')
  const [start, end] = period(date, view)
  const { rows, loading, error, reload } = useList<Appointment>(appointmentPath(start, end))
  const today = dayValue(new Date())
  const selectedDay = dayValue(date)
  const lastDay = new Date(end.getTime() - 1)
  const ordered = useMemo(() => rows
    .filter(item => filter === 'todas' || item.estado === filter)
    .slice().sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)), [rows, filter])
  const countByDay = useMemo(() => {
    const map = new Map<string, number>()
    ordered.forEach(item => {
      const d = dateFromISO(item.inicio)
      if (!d) return
      const key = dayValue(d)
      map.set(key, (map.get(key) || 0) + 1)
    })
    return map
  }, [ordered])
  const selectedAppointments = ordered.filter(item => {
    const at = dateFromISO(item.inicio)
    return at && dayValue(at) === selectedDay
  })
  const nextCount = rows.filter(item =>
    ['programada', 'confirmada'].includes(item.estado) && Date.parse(item.inicio) > Date.now()).length
  const dateLabel = view === 'Mes' ? monthFormat.format(date) :
    view === 'Día' ? fullFormat.format(date) :
    rangeFormat.format(start) + ' – ' + rangeFormat.format(lastDay)
  const weekDays = Array.from({ length: 7 }, (_, i) => dateOnly(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)))
  const days = view === 'Mes' ? calendarDays(date.getFullYear(), date.getMonth()) : weekDays

  function goNew() {
    router.push({ pathname: '/agendar', params: {
      ...(active ? { patient: active.id } : {}),
      date: selectedDay >= today ? selectedDay : today,
    } })
  }

  return <Page bottomInset>
    <View style={s.header}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.eyebrow}>ORGANIZA TU CONSULTORIO</Text>
        <Text accessibilityRole="header" style={s.title}>Agenda de citas</Text>
        <Text style={s.caption}>{rows.length} {rows.length === 1 ? 'cita registrada' : 'citas registradas'} en este periodo</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Actualizar citas"
        onPress={reload} style={({ pressed }) => [s.refresh, pressed && styles.pressed]}>
        <Ionicons name="refresh-outline" size={23} color={colors.green} />
      </Pressable>
    </View>

    <Pressable accessibilityRole="button" onPress={goNew}
      style={({ pressed }) => [s.hero, pressed && styles.pressed]}>
      <View style={s.heroIcon}><Ionicons name="calendar-number-outline" size={27} color="#fff" /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.heroTitle}>Nueva cita</Text>
        <Text style={s.heroCaption}>Elegir paciente, fecha y horario</Text>
      </View>
      <Ionicons name="arrow-forward" size={22} color="#fff" />
    </Pressable>

    <View style={s.summary}>
      <View style={s.summaryItem}>
        <Ionicons name="calendar-outline" size={18} color="#286e56" />
        <Text style={s.summaryNumber}>{rows.length}</Text>
        <Text style={s.summaryText}>En periodo</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Ionicons name="checkmark-circle-outline" size={18} color="#286e56" />
        <Text style={s.summaryNumber}>{nextCount}</Text>
        <Text style={s.summaryText}>Por atender</Text>
      </View>
    </View>

    <View style={s.tabs}>
      {views.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: view === item }}
        onPress={() => setView(item)} style={[s.tab, view === item && s.tabActive]}>
        <Text style={[s.tabText, view === item && s.tabTextActive]}>{item}</Text>
      </Pressable>)}
    </View>

    <View style={s.calendarCard}>
      <View style={s.calendarHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Periodo anterior"
          onPress={() => setDate(current => period(current, view, -1)[0])} style={s.arrow}>
          <Ionicons name="chevron-back" color={colors.green} size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={s.dateTitle}>{dateLabel}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Ir a hoy" onPress={() => setDate(new Date())}>
            <Text style={s.todayLink}>Ir a hoy</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Periodo siguiente"
          onPress={() => setDate(current => period(current, view, 1)[0])} style={s.arrow}>
          <Ionicons name="chevron-forward" color={colors.green} size={22} />
        </Pressable>
      </View>
      {view !== 'Día' && <>
        {view === 'Mes' && <View style={s.weekHeader}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) =>
            <Text key={index} style={s.weekLabel}>{label}</Text>)}
        </View>}
        <DayCalendar date={date} dates={days} countByDay={countByDay}
          onPick={setDate} currentMonth={view === 'Mes'} />
      </>}
      {view === 'Día' && <View style={s.todayStrip}>
        <Ionicons name="calendar-outline" size={21} color={colors.green} />
        <Text style={s.todayDescription}>Consulta las citas del día seleccionado</Text>
        <Text style={s.todayCount}>{selectedAppointments.length}</Text>
      </View>}
    </View>

    <View style={{ gap: 9 }}>
      <Text style={s.filterLabel}>Filtrar citas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {options.map(option => <Pressable key={option.key} accessibilityRole="button"
          accessibilityState={{ selected: option.key === filter }} onPress={() => setFilter(option.key)}
          style={[s.filter, option.key === filter && s.filterActive]}>
          <Text style={[s.filterText, option.key === filter && s.filterTextActive]}>{option.label}</Text>
        </Pressable>)}
      </ScrollView>
    </View>

    <View style={s.resultsTitle}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{view === 'Día' ? 'Citas del día' : 'Citas seleccionadas'}</Text>
        <Text style={s.caption}>{fullFormat.format(date)}</Text>
      </View>
      <Text style={s.resultCount}>{selectedAppointments.length} {selectedAppointments.length === 1 ? 'cita' : 'citas'}</Text>
    </View>
    {loading || error || !rows.length ? (
      <ListState loading={loading} error={error} reload={reload}
        empty={rows.length ? undefined : 'No hay citas registradas en este periodo.'} />
    ) : !selectedAppointments.length ? (
      <View style={s.empty}>
        <Ionicons name="calendar-clear-outline" size={29} color="#7cab90" />
        <Text style={s.emptyTitle}>Sin citas para este día</Text>
        <Text style={s.emptyCopy}>Selecciona otra fecha o agenda una nueva consulta.</Text>
      </View>
    ) : <View style={s.results}>
      {selectedAppointments.map(item => <AgendaCard key={item._id} item={item} />)}
    </View>}
  </Page>
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.25 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  refresh: { width: 46, height: 46, backgroundColor: '#f5faf6', borderRadius: 14, borderWidth: 1, borderColor: '#c8ddcf', alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: '#20664d', minHeight: 76, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 13 },
  heroIcon: { backgroundColor: '#347c60', width: 49, height: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  heroCaption: { color: '#e1f2e8', fontSize: 12 },
  summary: { flexDirection: 'row', backgroundColor: '#f5faf5', borderWidth: 1, borderColor: '#cadfcf', padding: 14, borderRadius: 18 },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  summaryNumber: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  summaryText: { color: colors.muted, fontSize: 11 },
  summaryDivider: { width: 1, marginHorizontal: 8, backgroundColor: '#dce8df' },
  tabs: { flexDirection: 'row', gap: 5, padding: 5, borderRadius: 17, backgroundColor: '#f1f7f2' },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#236a52' },
  tabText: { color: '#567865', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  calendarCard: { borderWidth: 1, borderColor: '#d2e4d7', borderRadius: 22, padding: 13, backgroundColor: '#fbfdfb', gap: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  arrow: { minWidth: 44, minHeight: 46, borderRadius: 13, backgroundColor: '#e9f4ec', alignItems: 'center', justifyContent: 'center' },
  dateTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'center', textTransform: 'capitalize' },
  todayLink: { color: '#4f906b', fontSize: 12, fontWeight: '700', padding: 3 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  weekLabel: { width: '14.2857%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.muted },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  dayCell: { width: '14.2857%', minHeight: 66, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
  daySelected: { backgroundColor: '#246c53' },
  dayWeekday: { color: '#6b8c76', fontWeight: '600', fontSize: 10 },
  dayNumber: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  mutedDay: { opacity: 0.4 },
  selectedText: { color: '#fff' },
  dayMark: { minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cde7d5' },
  selectedMark: { backgroundColor: '#3f8968' },
  todayMark: { borderWidth: 2, borderColor: '#70a484', backgroundColor: '#fff' },
  countText: { fontSize: 10, color: '#255d47', fontWeight: '800' },
  todayStrip: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#eaf5ed', padding: 13, borderRadius: 14 },
  todayDescription: { flex: 1, fontSize: 12, color: colors.muted },
  todayCount: { fontSize: 16, fontWeight: '800', color: colors.green },
  filterLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },
  filters: { gap: 7, paddingRight: 4 },
  filter: { paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: '#c4d9ca', borderRadius: 24, backgroundColor: '#f7fbf8' },
  filterActive: { backgroundColor: '#d8efe1', borderColor: '#85ba9d' },
  filterText: { color: '#647c6c', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#236348' },
  resultsTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  resultCount: { backgroundColor: '#dcefe3', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, fontSize: 12, fontWeight: '800', color: colors.green },
  results: { gap: 10 },
  appointmentCard: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: '#fbfdfb', borderRadius: 19, borderWidth: 1, borderColor: '#d1e2d6' },
  timeBox: { width: 79, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 9, borderRadius: 14, backgroundColor: '#e7f3e9' },
  timeText: { fontSize: 12, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  patientName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  visitType: { fontSize: 12, color: colors.muted },
  stateBadge: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stateDot: { width: 7, height: 7, borderRadius: 4 },
  stateText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 27, backgroundColor: '#f7fbf7', borderRadius: 20, gap: 8 },
  emptyTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  emptyCopy: { color: colors.muted, fontSize: 12, textAlign: 'center' },
})
