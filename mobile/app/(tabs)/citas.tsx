import { router } from 'expo-router'
import { appointmentPath, dateTime, type Appointment } from '../../src/clinic'
import { Shortcut } from '../../src/clinic-ui'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, Page, styles } from '../../src/ui'
import { ListState } from '../../src/list-state'
import { useList } from '../../src/use-list'
import { period, type View as AgendaView } from '../../src/agenda'

const views: AgendaView[] = ['Día', 'Semana', 'Mes']
const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

export default function Appointments() {
  const [view, setView] = useState<AgendaView>('Día')
  const [date, setDate] = useState(() => new Date())
  const [start, end] = period(date, view)
  const { rows, loading, error, reload } = useList<Appointment>(appointmentPath(start, end))
  const lastDay = new Date(end.getTime() - 1)
  return (
    <Page>
      <Shortcut primary icon="calendar-outline" title="Agendar cita"
        detail="Elige paciente y horario" onPress={() => router.push('/agendar')} />
      <View style={styles.row}>
        {views.map(item => <Button key={item} expand label={item} selected={item === view} onPress={() => setView(item)} />)}
      </View>
      <Text accessibilityRole="header" style={styles.cardTitle}>
        {dateFormat.format(start)}{view !== 'Día' && ` – ${dateFormat.format(lastDay)}`}
      </Text>
      <View style={styles.row}>
        <Button expand label="Anterior" selected={false} onPress={() => setDate(current => period(current, view, -1)[0])} />
        <Button expand label="Hoy" selected={false} onPress={() => setDate(new Date())} />
        <Button expand label="Siguiente" selected={false} onPress={() => setDate(current => period(current, view, 1)[0])} />
      </View>
      <ListState loading={loading} error={error} reload={reload}
        empty={rows.length ? undefined : 'No hay citas en este periodo.'} />
      {rows.map(item => (
        <Shortcut key={item._id} icon="time-outline" title={item.patient?.name ?? 'Consulta'}
          detail={dateTime.format(new Date(item.inicio)) + ' · ' + item.estado}
          onPress={() => router.push({ pathname: '/consulta', params: { id: item._id, start: item.inicio } })} />
      ))}
    </Page>
  )
}
