import { useState } from 'react'
import { router } from 'expo-router'
import { Text, TextInput, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { localDate } from '../clinicalModels'
import { shiftDate } from '@/features/appointments/models'
import { dailySummary, ratings, states, validDay, type TrackingData } from './models'

export function MealHistory({ data, editable }: { data: TrackingData; editable?: boolean }) {
  const [date, setDate] = useState(localDate)
  const valid = validDay(date)
  const summary = dailySummary(data, date)
  const records = valid ? data.registros.filter(item => item.fecha === date) : []
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Seguimiento de comidas</Text>
    <TextInput accessibilityLabel="Fecha del seguimiento, AAAA-MM-DD" placeholder="AAAA-MM-DD" maxLength={10} style={styles.input} value={date} onChangeText={setDate} />
    {!valid && <Text style={styles.error}>Escribe una fecha válida en formato AAAA-MM-DD.</Text>}
    <View style={styles.row}>
      <Button expand selected={false} disabled={!valid} label="Día anterior" onPress={() => setDate(shiftDate(date, -1))} />
      <Button expand selected={false} disabled={!valid} label="Día siguiente" onPress={() => setDate(shiftDate(date, 1))} />
    </View>
    <Button selected={false} label="Hoy" onPress={() => setDate(localDate())} />
    {valid && <View style={styles.card}>
      <Text style={styles.cardTitle}>{date}</Text>
      {summary.plan ? <><Text style={styles.body}>{summary.plan.nombre}</Text>
        <Text style={styles.body}>{summary.recorded} de {summary.total} comidas con registro · {Math.max(0, summary.total - summary.recorded)} pendientes</Text>
        <Text style={styles.body}>Completas: {summary.completed} · Parciales: {summary.partial} · Omitidas: {summary.skipped}</Text>
      </> : <Text style={styles.body}>Sin dieta vigente para este día.</Text>}
    </View>}
    {valid && !records.length && <Text style={styles.body}>Aún no hay registros de comidas para este día.</Text>}
    {records.map(record => <View key={record._id} style={styles.card}>
      <Text style={styles.cardTitle}>{record.nombreComida}</Text>
      {!!record.platillo && <Text style={styles.body}>{record.platillo}</Text>}
      <Text style={styles.body}>{states[record.estado]} · {ratings[record.agrado]}</Text>
      {!!record.comentario && <Text style={styles.body}>{record.comentario}</Text>}
      {record.plan !== summary.plan?._id && <Text style={styles.body}>Registro conservado de una dieta anterior.</Text>}
      {editable && date <= localDate() && record.plan === summary.plan?._id && summary.plan.comidas.some(meal => meal._id === record.comida) &&
        <Button selected={false} label="Actualizar registro" onPress={() => router.push({ pathname: '/registrar-comida', params: { plan: record.plan, meal: record.comida, date } })} />}
    </View>)}
  </View>
}
