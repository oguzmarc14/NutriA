import { useState } from 'react'
import { router } from 'expo-router'
import { Text, TextInput } from 'react-native'
import { matchesPatient, type Patient } from '../../src/clinic'
import { Shortcut } from '../../src/clinic-ui'
import { Page, styles } from '../../src/ui'
import { useList } from '../../src/use-list'
import { ListState } from '../../src/list-state'

export default function Patients() {
  const list = useList<Patient>('/pacientes', 'pacientes')
  const [search, setSearch] = useState('')
  const results = list.rows.filter(item => matchesPatient(item, search))

  return (
    <Page>
      <TextInput accessibilityLabel="Buscar pacientes" placeholder="Buscar por nombre o correo"
        style={styles.input} value={search} onChangeText={setSearch} autoCorrect={false}
        returnKeyType="search" />
      {list.loading || list.error || !list.rows.length ? (
        <ListState {...list} empty="No hay pacientes activos." />
      ) : !results.length ? <Text style={styles.body}>No encontramos pacientes con esa búsqueda.</Text> :
        results.map(patient => (
          <Shortcut key={patient._id} icon="person-outline" title={patient.name} detail={patient.email}
            onPress={() => router.push({ pathname: '/paciente', params: { id: patient._id } })} />
        ))}
    </Page>
  )
}
