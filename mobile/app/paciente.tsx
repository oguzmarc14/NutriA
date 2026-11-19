import { router, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'
import { dateTime, type Appointment, type Patient } from '../src/clinic'
import { Shortcut } from '../src/clinic-ui'
import { ListState } from '../src/list-state'
import { Page, styles } from '../src/ui'
import { useList } from '../src/use-list'
import { useResource } from '../src/use-resource'

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const valid = typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
  const patient = useResource<{ paciente: Patient }>(valid ? '/pacientes/' + id : null)
  const agenda = useList<Appointment>('/citas')
  const next = agenda.rows.find(item => item.patient?._id === id &&
    ['programada', 'confirmada'].includes(item.estado) && Date.parse(item.inicio) >= Date.now())

  return (
    <Page bottomInset>
      <ListState loading={patient.loading} error={patient.error} reload={patient.reload}
        empty={!valid ? 'Paciente no disponible.' : undefined} />
      {patient.data?.paciente && (
        <>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>{patient.data.paciente.name}</Text>
            {!!patient.data.paciente.email && <Text style={styles.body}>{patient.data.paciente.email}</Text>}
          </View>
          <Shortcut primary icon="calendar-outline" title="Agendar cita"
            detail="Elige un horario disponible" onPress={() => router.push({ pathname: '/agendar', params: { patient: id } })} />
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>Próxima cita</Text>
            <Text style={styles.body}>{next ? dateTime.format(new Date(next.inicio)) :
              agenda.loading ? 'Consultando agenda…' : agenda.error ? 'No se pudo consultar la agenda.' :
              'Sin citas próximas en la agenda consultada.'}</Text>
            {next && <Shortcut icon="time-outline" title="Ver cita"
              onPress={() => router.push({ pathname: '/consulta', params: { id: next._id, start: next.inicio } })} />}
          </View>
        </>
      )}
    </Page>
  )
}
