import { useRef, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Alert, Text, TextInput, View } from 'react-native'
import { ApiError, request } from '../src/api'
import { useAuth } from '../src/auth'
import { appointmentPath, dayLabel, type Appointment, matchesPatient, shiftDate, type Availability, type Patient } from '../src/clinic'
import { ListState } from '../src/list-state'
import { Button, Page, styles } from '../src/ui'
import { useList } from '../src/use-list'
import { useResource } from '../src/use-resource'

const types = { primera: 'Primera consulta', seguimiento: 'Seguimiento', otra: 'Otra consulta' } as const

export default function BookAppointment() {
  const { patient, id, start } = useLocalSearchParams<{ patient?: string; id?: string; start?: string }>()
  const timestamp = typeof start === 'string' ? Date.parse(start) : NaN
  const valid = typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) && Number.isFinite(timestamp)
  const appointment = useResource<Appointment[]>(valid ? appointmentPath(new Date(timestamp), new Date(timestamp + 1)) : null)
  if (!id) return <AppointmentForm initialPatient={patient} />

  const existing = appointment.data?.find(item => item._id === id)
  return (
    <>
      <Stack.Screen options={{ title: 'Reprogramar cita' }} />
      {existing?.patient && ['programada', 'confirmada'].includes(existing.estado) && Date.parse(existing.inicio) > Date.now() ? (
        <AppointmentForm initialPatient={existing.patient._id} existing={existing} />
      ) : (
        <Page bottomInset>
          <ListState {...appointment} empty="Esta cita ya no se puede reprogramar." />
        </Page>
      )}
    </>
  )
}

function AppointmentForm({ initialPatient, existing }: { initialPatient?: string; existing?: Appointment }) {
  const { session, signOut } = useAuth()
  const patients = useList<Patient>('/pacientes', 'pacientes')
  const [patient, setPatient] = useState(initialPatient ?? '')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [from, setFrom] = useState('')
  const [slot, setSlot] = useState('')
  const [type, setType] = useState<keyof typeof types>(existing && Object.prototype.hasOwnProperty.call(types, existing.tipo) ? existing.tipo as keyof typeof types : 'seguimiento')
  const [notes, setNotes] = useState(existing?.notas ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ calendarSynced: boolean; summary: string }>()
  const locked = useRef(false)
  const availability = useResource<Availability>('/horario/disponibilidad?dias=7' + (from ? '&desde=' + from : ''))
  const data = availability.data
  const day = data?.dias.find(item => item.fecha === date) ?? data?.dias[0]
  const selected = day?.espacios.find(item => item.inicio === slot)
  const selectedPatient = patients.rows.find(item => item._id === patient)

  async function save() {
    if (locked.current || saved || !session || !data || !selected || !selectedPatient || !day) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      const result = await request<{ calendarSynced: boolean }>(existing ? '/citas/' + existing._id : '/citas', {
        token: session.token,
        method: existing ? 'PUT' : 'POST',
        body: { patient, inicio: selected.inicio, zonaHoraria: data.zonaHoraria, tipo: type, estado: existing?.estado ?? 'programada', notas: notes.trim() },
      })
      setSaved({ calendarSynced: result.calendarSynced, summary: selectedPatient.name + ' · ' + dayLabel(day.fecha) + ' · ' + selected.hora })
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

  if (saved) return (
    <Page bottomInset>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{existing ? 'Cita reprogramada' : 'Cita agendada'}</Text>
        <Text style={styles.body}>{saved.summary}</Text>
        {saved.calendarSynced === false && <Text style={styles.body}>Google Calendar no confirmó la sincronización.</Text>}
      </View>
      <Button label="Ver agenda" onPress={() => router.dismissTo('/citas')} />
    </Page>
  )

  return (
    <Page bottomInset>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Paciente</Text>
        {selectedPatient ? (
          <>
            <Text style={styles.body}>{selectedPatient.name}</Text>
            {!existing && <Button label="Cambiar paciente" selected={false} disabled={saving}
              onPress={() => { setPatient(''); setSearch('') }} />}
          </>
        ) : existing ? <Text style={styles.body}>{patients.loading ? 'Cargando paciente…' : patients.error || 'Paciente no disponible.'}</Text> : (
          <>
            <TextInput accessibilityLabel="Buscar paciente" placeholder="Nombre o correo" style={styles.input}
              value={search} onChangeText={setSearch} autoCorrect={false} />
            {patients.rows.filter(item => matchesPatient(item, search)).slice(0, 5).map(item =>
              <Button key={item._id} label={item.name} selected={false} onPress={() => setPatient(item._id)} />)}
            {patients.loading || patients.error ? <ListState {...patients} /> :
              !patients.rows.some(item => matchesPatient(item, search)) && <Text style={styles.body}>No encontramos pacientes.</Text>}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Fecha y hora</Text>
        {availability.loading || availability.error ? <ListState {...availability} /> : data && (
          <>
            <Text style={styles.body}>{data.zonaHoraria} · 60 min</Text>
            <View style={styles.row}>
              <Button label="7 días antes" expand selected={false} disabled={saving || data.desde <= data.hoy}
                onPress={() => { setFrom([shiftDate(data.desde, -7), data.hoy].sort()[1]); setDate(''); setSlot('') }} />
              <Button label="7 días después" expand selected={false} disabled={saving || shiftDate(data.desde, 7) > shiftDate(data.hoy, 180)}
                onPress={() => { setFrom(shiftDate(data.desde, 7)); setDate(''); setSlot('') }} />
            </View>
            <View style={styles.row}>
              {data.dias.map(item => (
                <Button key={item.fecha} label={dayLabel(item.fecha, true)} expand selected={day?.fecha === item.fecha} disabled={saving}
                  onPress={() => { setDate(item.fecha); setSlot('') }} />
              ))}
            </View>
            <Text style={styles.cardTitle}>{day && dayLabel(day.fecha)}</Text>
            {day?.espacios.length ? (
              <View style={styles.row}>
                {day.espacios.map(item => (
                  <Button key={item.inicio} label={item.hora} selected={slot === item.inicio} disabled={saving}
                    onPress={() => setSlot(item.inicio)} />
                ))}
              </View>
            ) : <Text style={styles.body}>Sin horarios disponibles para este día.</Text>}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Tipo de consulta</Text>
        <View style={styles.row}>
          {(Object.keys(types) as (keyof typeof types)[]).map(key => (
            <Button key={key} label={types[key]} selected={key === type} disabled={saving} onPress={() => setType(key)} />
          ))}
        </View>
        <TextInput accessibilityLabel="Notas opcionales" placeholder="Notas opcionales" style={styles.input}
          value={notes} onChangeText={setNotes} multiline maxLength={500} editable={!saving} />
      </View>

      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button label={saving ? 'Guardando…' : existing ? 'Confirmar cambio' : 'Confirmar cita'} disabled={saving || !selectedPatient || !selected}
        onPress={() => {
          if (!selectedPatient || !selected || !day) return
          Alert.alert(existing ? 'Reprogramar cita' : 'Confirmar cita', selectedPatient.name + ' · ' + dayLabel(day.fecha) + ' · ' + selected.hora, [
            { text: 'Volver', style: 'cancel' },
            { text: existing ? 'Reprogramar' : 'Agendar', onPress: () => void save() },
          ])
        }} />
    </Page>
  )
}
