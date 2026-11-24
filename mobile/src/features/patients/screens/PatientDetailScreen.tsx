import { showNotice } from '@/shared/ui/NoticeDialog'
import { router, useLocalSearchParams } from 'expo-router'
import { NutritionistGamificationControl } from '@/features/gamification/NutritionistGamificationControl'
import { Text, View } from 'react-native'
import { dateTime, type Appointment, type Patient } from '@/features/appointments/models'
import { Shortcut } from '@/shared/ui/Shortcut'
import { ListState } from '@/shared/ui/ListState'
import { Page, styles } from '@/shared/ui/primitives'
import { useList } from '@/shared/hooks/useList'
import { useResource } from '@/shared/hooks/useResource'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
import { Button, colors } from '@/shared/ui/primitives'

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { active, start, stop } = usePatientWork()
  const patientId = typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? id : active?.id
  const valid = typeof patientId === 'string' && /^[a-f\d]{24}$/i.test(patientId)
  const working = !!patientId && active?.id === patientId
  const patient = useResource<{ paciente: Patient }>(valid ? '/pacientes/' + patientId : null)
  const agenda = useList<Appointment>('/citas')
  const next = agenda.rows.find(item => item.patient?._id === patientId &&
    ['programada', 'confirmada'].includes(item.estado) && Date.parse(item.inicio) >= Date.now())

  return (
    <Page bottomInset>
      <ListState loading={patient.loading} error={patient.error} reload={patient.reload}
        empty={!valid ? 'Paciente no disponible.' : undefined} />
      {patient.data?.paciente && (
        <>
          <View style={[styles.card, working && { borderWidth: 1.5, borderColor: '#85b996', backgroundColor: '#ebf6ed' }]}>
            <Text style={[styles.body, { color: colors.green, fontWeight: '700' }]}>
              {working ? 'Estás trabajando con este paciente' : 'Ficha del paciente'}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>{patient.data.paciente.name}</Text>
            {!!patient.data.paciente.email && <Text style={styles.body}>{patient.data.paciente.email}</Text>}
            <Button label={working ? 'Dejar de trabajar' : 'Trabajar con este paciente'}
              selected={working ? false : undefined} onPress={() => {
                const selected = patient.data?.paciente
                if (!selected) return
                if (working) showNotice('¿Dejar de trabajar?', '¿Confirmas que deseas dejar de trabajar con ' + selected.name + '?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Dejar de trabajar', style: 'destructive', onPress: stop },
                ])
                else showNotice(active ? '¿Cambiar de paciente?' : '¿Trabajar con este paciente?',
                  '¿Confirmas que deseas trabajar con ' + selected.name + '?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Aceptar', onPress: () => start(selected) },
                  ])
              }} />
          </View>
          <Shortcut primary icon="calendar-outline" title="Agendar cita"
            detail="Elige un horario disponible" onPress={() => router.push({ pathname: '/agendar', params: { patient: patientId } })} />
          <Shortcut icon="wallet-outline" title="Pagos del paciente" detail="Consulta y revisa reportes de pago"
            onPress={() => router.push({ pathname: '/pagos-paciente', params: { patient: patientId } })} />
          <Shortcut icon="checkmark-done-outline" title="Seguimiento de comidas" detail="Consulta los registros diarios del paciente"
            onPress={() => router.push({ pathname: '/seguimiento-paciente', params: { patient: patientId } })} />
          <Shortcut icon="nutrition-outline" title="Dietas" detail="Crea y edita planes alimenticios"
            onPress={() => router.push({ pathname: '/planes', params: { patient: patientId } })} />
          <Shortcut icon="document-text-outline" title="Expediente clínico" detail="Consulta y registra datos clínicos principales"
            onPress={() => router.push({ pathname: '/expediente', params: { patient: patientId } })} />
          <Shortcut icon="calculator-outline" title="Cálculo nutricional" detail="Crea borradores con historial de fechas"
            onPress={() => router.push({ pathname: '/calculo', params: { patient: patientId } })} />
          <Shortcut icon="fitness-outline" title="Mediciones" detail="Registra medidas y consulta el historial"
            onPress={() => router.push({ pathname: '/mediciones', params: { patient: patientId } })} />
          <NutritionistGamificationControl patientId={patientId!} />
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
