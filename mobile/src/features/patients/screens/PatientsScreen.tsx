import { isPatientIntent, patientDestinations } from '@/features/navigation/menu'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Text, TextInput } from 'react-native'
import { matchesPatient, type Patient } from '@/features/appointments/models'
import { Shortcut } from '@/shared/ui/Shortcut'
import { Page, styles } from '@/shared/ui/primitives'
import { useList } from '@/shared/hooks/useList'
import { ListState } from '@/shared/ui/ListState'

export default function Patients() {
  const { intent } = useLocalSearchParams<{ intent?: string }>()
  const list = useList<Patient>('/pacientes', 'pacientes')
  const [search, setSearch] = useState('')
  const results = list.rows.filter(item => matchesPatient(item, search))

  return (
    <Page>
      {isPatientIntent(intent) && <><Text style={styles.cardTitle}>Elige un paciente para continuar</Text>
        <Text style={styles.body}>Abriremos el apartado seleccionado de su expediente.</Text></>}
      <TextInput accessibilityLabel="Buscar pacientes" placeholder="Buscar por nombre o correo"
        style={styles.input} value={search} onChangeText={setSearch} autoCorrect={false}
        returnKeyType="search" />
      {list.loading || list.error || !list.rows.length ? (
        <ListState {...list} empty="No hay pacientes activos." />
      ) : !results.length ? <Text style={styles.body}>No encontramos pacientes con esa búsqueda.</Text> :
        results.map(patient => (
          <Shortcut key={patient._id} icon="person-outline" title={patient.name} detail={patient.email}
            onPress={() => isPatientIntent(intent)
              ? router.replace({ pathname: patientDestinations[intent], params: { patient: patient._id } })
              : router.push({ pathname: '/paciente', params: { id: patient._id } })} />
        ))}
    </Page>
  )
}
