import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, Page, styles } from '../../src/ui'
import { ListState } from '../../src/list-state'
import { useList } from '../../src/use-list'
import { period, type View as AgendaView } from '../../src/agenda'

type Appointment = {
  _id: string
  inicio: string
  fin: string
  estado: string
  tipo: string
  patient: { name: string } | null
}

const views: AgendaView[] = ['Día', 'Semana', 'Mes']
const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
const timeFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export default function Appointments() {
  const [view, setView] = useState<AgendaView>('Día')
  const [date, setDate] = useState(() => new Date())
  const [start, end] = period(date, view)
  const query = new URLSearchParams({ desde: start.toISOString(), hasta: end.toISOString() })
  const { rows, loading, error, reload } = useList<Appointment>(`/citas?${query}`)
  const lastDay = new Date(end.getTime() - 1)
  return (
    <Page title="Citas">
      <View style={styles.row}>
        {views.map(item => <Button key={item} label={item} selected={item === view} onPress={() => setView(item)} />)}
      </View>
      <Text accessibilityRole="header" style={styles.cardTitle}>
        {dateFormat.format(start)}{view !== 'Día' && ` – ${dateFormat.format(lastDay)}`}
      </Text>
      <View style={styles.row}>
        <Button label="Anterior" selected={false} onPress={() => setDate(period(date, view, -1)[0])} />
        <Button label="Hoy" selected={false} onPress={() => setDate(new Date())} />
        <Button label="Siguiente" selected={false} onPress={() => setDate(period(date, view, 1)[0])} />
      </View>
      <ListState loading={loading} error={error} reload={reload}
        empty={rows.length ? undefined : 'No hay citas en este periodo.'} />
      {rows.map(item => (
        <View key={item._id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.patient?.name ?? 'Paciente'}</Text>
          <Text style={styles.body}>{timeFormat.format(new Date(item.inicio))}</Text>
          <Text style={styles.body}>Fin {timeFormat.format(new Date(item.fin))}</Text>
          <Text style={styles.body}>{item.tipo} · {item.estado}</Text>
        </View>
      ))}
    </Page>
  )
}
