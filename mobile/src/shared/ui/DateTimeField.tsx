import { useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Modal, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, colors, styles } from './primitives'
import { calendarDays, clockLabel, clockParts, clockValue, dayValue, parseDay } from './dateTimeModel'
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; labelStyle?: StyleProp<TextStyle> }
export function DateField({ label, value, onChange, disabled, labelStyle }: Props) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(new Date())
  return <View style={{ gap: 6 }}><Text style={[styles.body, labelStyle]}>{label}</Text>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!disabled}
        placeholder="AAAA-MM-DD" maxLength={10} style={[styles.input, { flex: 1 }]} keyboardType="numbers-and-punctuation" />
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={'Abrir calendario: ' + label}
        onPress={() => { setMonth(parseDay(value) || new Date()); setOpen(true) }} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.background }}>
        <Ionicons name="calendar-outline" size={24} color={colors.green} /></Pressable>
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#173f3477', padding: 18 }}>
        <View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 480, alignSelf: 'center' }]}>
          <ScrollView contentContainerStyle={{ gap: 12 }} style={{ maxHeight: 550 }}>
            <Text style={styles.cardTitle}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" style={{ padding: 12 }} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><Ionicons name="chevron-back" size={24} color={colors.green} /></Pressable>
              <Text style={[styles.cardTitle, { flex: 1, textAlign: 'center', fontSize: 16 }]}>{new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(month)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" style={{ padding: 12 }} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><Ionicons name="chevron-forward" size={24} color={colors.green} /></Pressable>
            </View>
            <View style={{ flexDirection: 'row' }}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => <Text key={i} style={[styles.body, { width: '14.2857%', textAlign: 'center' }]}>{day}</Text>)}</View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{calendarDays(month.getFullYear(), month.getMonth()).map(day => {
              const key = dayValue(day), selected = value === key
              return <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={key}
                onPress={() => { onChange(key); setOpen(false) }} style={{ width: '14.2857%', minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: selected ? colors.green : undefined }}>
                <Text style={{ textAlign: 'center', color: selected ? colors.white : day.getMonth() === month.getMonth() ? colors.ink : colors.muted }}>{day.getDate()}</Text>
              </Pressable>
            })}</View>
            <View style={styles.row}><Button expand label="Hoy" onPress={() => { onChange(dayValue(new Date())); setOpen(false) }} />
              <Button expand selected={false} label="Cerrar" onPress={() => setOpen(false)} /></View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>
}
export function TimeField({ label, value, onChange, disabled, labelStyle, halfHour }: Props & { halfHour?: boolean }) {
  const [open, setOpen] = useState(false)
  const [clock, setClock] = useState(() => clockParts(''))
  const [custom, setCustom] = useState(false)
  const time = clockValue(clock.hour, clock.minute, clock.period)
  const validMinute = halfHour ? ['00','30'].includes(clock.minute) : /^[0-5]\d$/.test(clock.minute)
  return <View style={{ gap: 6 }}>
    <Text style={[styles.body, labelStyle]}>{label}</Text>
    <Pressable disabled={disabled} accessibilityRole="button"
      accessibilityLabel={label + ', ' + (clockLabel(value) || 'sin hora')}
      onPress={() => { setClock(clockParts(value)); setCustom(false); setOpen(true) }}
      style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <Ionicons name="time-outline" size={22} color={colors.green} />
      <Text style={[styles.body, { flex: 1, color: colors.ink }]}>{clockLabel(value) || 'Elegir hora'}</Text>
      <Ionicons name="chevron-down" size={18} color={colors.green} />
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#173f3477' }}>
        <SafeAreaView edges={['bottom']} style={[styles.card, { maxHeight: '88%' }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            <Text accessibilityRole="header" style={styles.cardTitle}>{label}</Text>
            <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={styles.title}>{validMinute ? clockLabel(time) : clock.hour + ':— ' + clock.period}</Text>
              <View style={styles.row}>{(['AM', 'PM'] as const).map(period =>
                <Button key={period} label={period} selected={clock.period === period}
                  onPress={() => setClock(current => ({ ...current, period }))} />)}</View>
            </View>
            <Text style={styles.body}>Hora</Text>
            <View style={styles.row}>{Array.from({ length: 12 }, (_, i) => i + 1).map(hour =>
              <Button key={hour} label={String(hour)} selected={clock.hour === hour}
                onPress={() => setClock(current => ({ ...current, hour }))} />)}</View>
            <Text style={styles.body}>Minutos</Text>
            <View style={styles.row}>{(halfHour ? ['00', '30'] : ['00', '15', '30', '45']).map(minute =>
              <Button key={minute} label={minute} selected={!custom && clock.minute === minute}
                onPress={() => { setCustom(false); setClock(current => ({ ...current, minute })) }} />)}
              {!halfHour && <Button label="Otros" selected={custom} onPress={() => setCustom(true)} />}
            </View>
            {custom && <TextInput accessibilityLabel="Minutos de 00 a 59" value={clock.minute} selectTextOnFocus
              onChangeText={minute => setClock(current => ({ ...current, minute }))} maxLength={2}
              keyboardType="number-pad" style={styles.input} />}
            <View style={styles.row}>
              <Button expand label="Aceptar" disabled={!validMinute} onPress={() => { onChange(time); setOpen(false) }} />
              <Button expand selected={false} label="Cancelar" onPress={() => setOpen(false)} />
              {!!value && <Button selected={false} label="Quitar hora" onPress={() => { onChange(''); setOpen(false) }} />}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  </View>
}
