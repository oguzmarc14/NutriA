import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, Text, View } from 'react-native'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { calendarDays, shiftCalendar, type CalendarView } from '@/features/clinic/workCalendar'

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const allViews: CalendarView[] = ['Día', 'Semana', 'Mes']
const fullDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const month = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const utc = (day: string) => new Date(day + 'T12:00:00Z')
type Mark = { label: string; starts?: boolean }
type Props = {
  title: string; today: string; focus: string; selected: string; view: CalendarView
  onView?: (view: CalendarView) => void; onFocus: (day: string) => void; onSelect: (day: string) => void
  mark: (day: string) => Mark | undefined; selectable?: (day: string) => boolean
  canMove?: (day: string) => boolean; disabled?: boolean
}

export function PeriodCalendar({ title, today, focus, selected, view, onView, onFocus, onSelect, mark,
  selectable = () => true, canMove = () => true, disabled }: Props) {
  const days = calendarDays(focus, view)
  const label = view === 'Mes' ? month.format(utc(focus)) : view === 'Semana'
    ? shortDate.format(utc(days[0])) + ' – ' + shortDate.format(utc(days.at(-1)!)) : fullDate.format(utc(focus))
  const summary = mark(focus)
  return <View style={{ gap: 10 }}>
    <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
    {onView && <View style={styles.row}>{allViews.map(option =>
      <Button key={option} expand selected={view === option} label={option} disabled={disabled}
        onPress={() => onView(option)} />)}</View>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text accessibilityLiveRegion="polite" style={{ flex: 1, fontWeight: '800', color: colors.ink }}>{label}</Text>
      {([-1, 0, 1] as const).map(step => {
        const next = step ? shiftCalendar(focus, view, step) : today
        const locked = disabled || !canMove(next)
        return <Pressable key={step} accessibilityRole="button"
          accessibilityLabel={step === 0 ? 'Hoy' : view + (step < 0 ? ' anterior' : ' siguiente')}
          accessibilityState={{ disabled: locked }} disabled={locked} onPress={() => onFocus(next)}
          style={{ minHeight: 44, minWidth: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
            backgroundColor: '#e8f3eb', opacity: locked ? .45 : 1 }}>
          {step === 0 ? <Text style={{ color: colors.green, fontWeight: '700' }}>Hoy</Text>
            : <Ionicons name={step < 0 ? 'chevron-back' : 'chevron-forward'} size={19} color={colors.green} />}
        </Pressable>
      })}
    </View>
    {view === 'Día' ? <Text style={styles.body}>{summary?.label || 'Sin registros para este día.'}</Text>
      : <>
        <View style={{ flexDirection: 'row' }}>{weekdays.map(day => <Text key={day}
          style={{ width: '14.285%', textAlign: 'center', color: colors.muted, fontSize: 10, fontWeight: '700' }}>{day}</Text>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{days.map(day => {
          const info = mark(day), active = day === selected, locked = disabled || !selectable(day)
          return <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: active, disabled: locked }}
            accessibilityLabel={fullDate.format(utc(day)) + (info ? ', ' + info.label : '')}
            disabled={locked} onPress={() => onSelect(day)}
            style={{ width: '14.285%', minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4,
              borderWidth: 2, borderColor: 'white', borderRadius: 11,
              backgroundColor: active ? colors.green : info ? '#e3f2e7' : '#f5f8f5',
              opacity: locked || view === 'Mes' && day.slice(0,7) !== focus.slice(0,7) ? .5 : 1 }}>
            <Text style={{ color: active ? '#fff' : colors.ink, fontWeight: active || day === today ? '800' : '500' }}>{Number(day.slice(-2))}</Text>
            {info && <View style={{ width: info.starts ? 9 : 6, height: info.starts ? 9 : 6, backgroundColor: active ? '#fff' : colors.green, borderRadius: 6 }} />}
          </Pressable>
        })}</View>
      </>}
  </View>
}
