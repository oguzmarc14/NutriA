import { NutritionistGamificationControl } from '@/features/gamification/NutritionistGamificationControl'
import { MeasurementChart } from '../MeasurementChart'
import type { ChartMeasurement } from '../chartModel'
import { useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Page, styles } from '@/shared/ui/primitives'
import { MealHistory } from '@/features/nutrition/tracking/MealHistory'
import type { TrackingData } from '@/features/nutrition/tracking/models'
export default function ClinicTrackingScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<TrackingData & { paciente: { name: string }; mediciones: ChartMeasurement[] }>(valid ? '/seguimiento-comidas/paciente/' + patient : null)
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!valid && <Text style={styles.error}>Selecciona un paciente desde su ficha.</Text>}
    {resource.data && <><Text style={styles.title}>{resource.data.paciente.name}</Text><MealHistory data={resource.data} /><MeasurementChart measurements={resource.data.mediciones || []} />{patient && <NutritionistGamificationControl key={patient} patientId={patient} />}</>}
  </Page>
}
