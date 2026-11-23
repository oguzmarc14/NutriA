import { MeasurementChart } from '../MeasurementChart'
import { MeasurementComparison } from '../MeasurementComparison'
import { GamificationPanel } from '@/features/gamification/GamificationPanel'
import { ActivityIndicator, Text, View } from 'react-native'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'
import { MealHistory } from '@/features/nutrition/tracking/MealHistory'
import type { TrackingData } from '@/features/nutrition/tracking/models'

type Measurement = {
  _id: string
  fecha: string
  createdAt: string
  peso: number
  estatura: number
  imc?: number
  masaMuscular?: number
  grasaCorporal?: number
  grasaVisceral?: number
  masaOsea?: number
  proteina?: number
}
type Profile = TrackingData & { mediciones: Measurement[] }

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
    : 'Fecha no disponible'
}

export default function PatientProgressScreen() {
  const { data, loading, error, reload } = useResource<Profile>('/seguimiento-comidas/mi-progreso')
  const measurements = [...(data?.mediciones || [])].sort((a, b) =>
    (b.fecha || b.createdAt).localeCompare(a.fecha || a.createdAt) ||
    (b.createdAt || '').localeCompare(a.createdAt || ''))
  const latest = measurements[0]
  const previous = measurements[1]
  const difference = latest && previous ? latest.peso - previous.peso : null

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mi progreso</Text>
    <Text style={styles.body}>Consulta tus mediciones y registros diarios de comidas.</Text>
    {loading && <ActivityIndicator accessibilityLabel="Cargando mediciones"/>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {latest && <View style={styles.card}>
      <Text style={styles.cardTitle}>Última medición</Text>
      <Text style={styles.body}>{formatDate(latest.fecha || latest.createdAt)}</Text>
      <Text style={styles.title}>{latest.peso} kg</Text>
      {difference !== null && <Text style={styles.body}>
        Cambio desde la medición anterior: {difference > 0 ? '+' : ''}{difference.toFixed(1)} kg
      </Text>}
    </View>}
    {data && <MeasurementChart measurements={measurements} />}
    {data && <MeasurementComparison measurements={measurements} />}
    {data && <MealHistory data={data} editable />}
    <GamificationPanel />
    <Text accessibilityRole="header" style={styles.cardTitle}>Historial de mediciones</Text>
    {data && !measurements.length && <Text style={styles.body}>Todavía no tienes mediciones registradas.</Text>}
    {measurements.map(item => <View key={item._id} style={styles.card}>
      <Text style={styles.cardTitle}>{formatDate(item.fecha || item.createdAt)}</Text>
      <Text style={styles.body}>Peso: {item.peso} kg</Text>
      <Text style={styles.body}>Estatura: {(item.estatura * 100).toFixed(1)} cm</Text>
      {Number.isFinite(item.imc) && <Text style={styles.body}>IMC registrado: {item.imc?.toFixed(1)}</Text>}
      {Number.isFinite(item.grasaCorporal) && <Text style={styles.body}>Grasa corporal: {item.grasaCorporal}%</Text>}
    </View>)}
  </Page>
}
