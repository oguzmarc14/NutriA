import { useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Modal, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, colors, styles } from './primitives'
import { calendarDays, dayValue, parseDay } from './dateTimeModel'
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
export function TimeField({ label, value, onChange, disabled, labelStyle }: Props) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState('08'), [minute, setMinute] = useState('00')
  return <View style={{ gap: 6 }}><Text style={[styles.body, labelStyle]}>{label}</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
      placeholder="HH:MM" maxLength={5} keyboardType="numbers-and-punctuation" editable={!disabled} style={[styles.input, { flex: 1 }]} />
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={'Elegir hora: ' + label} style={{ padding: 14 }} onPress={() => {
        const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value); setHour(valid ? value.slice(0, 2) : '08'); setMinute(valid ? value.slice(3) : '00'); setOpen(true)
      }}><Ionicons name="time-outline" size={24} color={colors.green} /></Pressable></View>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#173f3477' }}>
        <SafeAreaView edges={['bottom']} style={[styles.card, { maxHeight: '85%' }]}><ScrollView contentContainerStyle={{ gap: 12 }}>
          <Text style={styles.cardTitle}>{label}</Text><Text style={styles.title}>{hour}:{minute}</Text>
          <Text style={styles.body}>Hora (24 horas)</Text><View style={styles.row}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h =>
            <Button key={h} label={h} selected={h === hour} onPress={() => setHour(h)} />)}</View>
          <Text style={styles.body}>Minutos</Text><View style={styles.row}>{Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m =>
            <Button key={m} label={m} selected={m === minute} onPress={() => setMinute(m)} />)}</View>
          <View style={styles.row}><Button expand label="Aceptar" onPress={() => { onChange(hour + ':' + minute); setOpen(false) }} />
            <Button expand selected={false} label="Cancelar" onPress={() => setOpen(false)} /></View>
        </ScrollView></SafeAreaView>
      </View>
    </Modal>
  </View>
}
