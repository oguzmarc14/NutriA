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
      {(intent === 'plan' || intent === 'create-plan') && <Text style={styles.cardTitle}>Elige el paciente para su dieta</Text>}
      {intent === 'payments' && <Text style={styles.cardTitle}>Elige el paciente para revisar sus pagos</Text>}
      <TextInput accessibilityLabel="Buscar pacientes" placeholder="Buscar por nombre o correo"
        style={styles.input} value={search} onChangeText={setSearch} autoCorrect={false}
        returnKeyType="search" />
      {list.loading || list.error || !list.rows.length ? (
        <ListState {...list} empty="No hay pacientes activos." />
      ) : !results.length ? <Text style={styles.body}>No encontramos pacientes con esa búsqueda.</Text> :
        results.map(patient => (
          <Shortcut key={patient._id} icon="person-outline" title={patient.name} detail={patient.email}
            onPress={() => intent === 'payments'
              ? router.replace({ pathname: '/pagos-paciente', params: { patient: patient._id } })
              : intent === 'create-plan'
              ? router.replace({ pathname: '/dieta', params: { patient: patient._id } })
              : intent === 'plan'
              ? router.replace({ pathname: '/planes', params: { patient: patient._id } })
              : router.push({ pathname: '/paciente', params: { id: patient._id } })} />
        ))}
    </Page>
  )
}
