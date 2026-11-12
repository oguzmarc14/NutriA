import { Text, View } from 'react-native'
import { Page, styles } from '../../src/ui'
import { useList } from '../../src/use-list'
import { ListState } from '../../src/list-state'

type Patient = { _id: string; name: string; email?: string }

export default function Patients() {
  const { rows, loading, error, reload } = useList<Patient>('/pacientes', 'pacientes')
  return (
    <Page title="Pacientes">
      <ListState loading={loading} error={error} reload={reload}
        empty={rows.length ? undefined : 'No hay pacientes activos.'} />
      {rows.map(patient => (
        <View key={patient._id} style={styles.card}>
          <Text style={styles.cardTitle}>{patient.name}</Text>
          {!!patient.email && <Text style={styles.body}>{patient.email}</Text>}
        </View>
      ))}
    </Page>
  )
}
