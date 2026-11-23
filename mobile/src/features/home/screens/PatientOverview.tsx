import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { localToday } from '@/features/clinic/workCalendar'
import { GamificationPanel } from '@/features/gamification/GamificationPanel'
import { dailySummary, planStart, type TrackingData, type TrackingPlan } from '@/features/nutrition/tracking/models'
import { MeasurementComparison } from '@/features/progress/MeasurementComparison'
import type { ComparedMeasurement } from '@/features/progress/MeasurementComparisonModel'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Button, colors, styles } from '@/shared/ui/primitives'

type Plan = TrackingPlan & { aceptacionPaciente?: { estado?: string } }
type Profile = { planes: Plan[]; seguimientosComida: TrackingData['registros']; mediciones: ComparedMeasurement[] }
const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2, signDisplay: 'exceptZero' })

export default function PatientOverview() {
  const profile = useResource<Profile>('/mi-perfil')
  if (!profile.data) return <ListState {...profile} />
  const { planes, seguimientosComida, mediciones } = profile.data
  const today = localToday()
  const meals = dailySummary({ planes, registros: seguimientosComida }, today)
  const active = planes.find(plan => plan._id === meals.plan?._id)
  const upcoming = planes.filter(plan => planStart(plan) > today).length
  const weights = mediciones.map(item => item.peso).filter((value): value is number =>
    typeof value === 'number' && Number.isFinite(value))
  const difference = weights.length > 1 ? weights[0] - weights[1] : null
  const stats = [
    ['Completas', meals.completed], ['Por registrar', meals.total - meals.recorded],
    ['Parciales', meals.partial], ['Omitidas', meals.skipped],
  ] as const

  return <>
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Ionicons name="scale-outline" size={24} color={colors.green} />
        <Text accessibilityRole="header" style={styles.cardTitle}>Último peso registrado</Text>
      </View>
      <Text style={styles.title}>{weights.length ? weights[0] + ' kg' : 'Sin registro'}</Text>
      {difference !== null && <Text style={styles.body}>{number.format(difference)} kg respecto al registro anterior</Text>}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Mi alimentación de hoy</Text>
      <Text style={styles.body}>{active?.nombre || 'Sin dieta vigente'}</Text>
      {active && <>
        <Text style={styles.body}>{active.aceptacionPaciente?.estado === 'aceptada' ? 'Recepción confirmada' : 'Recepción pendiente de confirmar'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {stats.map(([label, count]) => <View key={label}
            style={{ minWidth: '44%', flexGrow: 1, backgroundColor: '#edf5ef', padding: 12, borderRadius: 12 }}>
            <Text style={styles.cardTitle}>{count}</Text><Text style={styles.body}>{label}</Text>
          </View>)}
        </View>
      </>}
      <Text style={styles.body}>{upcoming} {upcoming === 1 ? 'plan próximo' : 'planes próximos'}</Text>
      <Button label="Abrir mi plan alimenticio" onPress={() => router.navigate('/mi-plan')} />
    </View>
    <GamificationPanel />
    <MeasurementComparison measurements={mediciones} />
  </>
}
