import { DateField } from '@/shared/ui/DateTimeField'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'
import { activePlan, findTracking, states, validDay, type TrackingRecord } from '../tracking/models'

type Food = { _id?: string; nombre: string; cantidad: number; porcion?: { descripcion?: string; unidad?: string } }
type Meal = { _id: string; nombre: string; hora?: string; platillo?: string; alimentos: Food[] }
type Plan = { _id: string; nombre: string; objetivo?: string; fechaInicio?: string; createdAt: string; comidas: Meal[] }
type Profile = { planes: Plan[]; seguimientosComida: TrackingRecord[] }

function localDate() {
  const today = new Date()
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')].join('-')
}
const startDate = (plan: Plan) => (plan.fechaInicio || plan.createdAt).slice(0, 10)

export default function PatientPlanScreen() {
  const { data, loading, error, reload } = useResource<Profile>('/mi-perfil')
  const [date, setDate] = useState(localDate)
  const validDate = validDay(date)
  const plans = [...(data?.planes || [])].sort((a, b) => startDate(b).localeCompare(startDate(a)) || b.createdAt.localeCompare(a.createdAt))
  const plan = activePlan(plans, date)

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mi plan alimenticio</Text>
    <DateField label="Fecha del menú" value={date} onChange={setDate} />
    {!validDate && <Text accessibilityRole="alert" style={styles.error}>Escribe una fecha válida en formato AAAA-MM-DD.</Text>}
    <Button label="Hoy" selected={false} onPress={() => setDate(localDate())}/>
    {loading && <ActivityIndicator accessibilityLabel="Cargando dieta"/>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {validDate && date > localDate() && <Text style={styles.body}>Puedes consultar menús futuros; el registro de comidas se habilita cuando llegue ese día.</Text>}
    {plan ? <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{plan.nombre}</Text>
        <Text style={styles.body}>Aplicable desde {startDate(plan)}</Text>
        {!!plan.objetivo && <Text style={styles.body}>{plan.objetivo}</Text>}
      </View>
      {[...(plan.comidas || [])].sort((a, b) => (a.hora || '99:99').localeCompare(b.hora || '99:99')).map(meal =>
        <View key={meal._id} style={styles.card}>
          <Text style={styles.cardTitle}>{meal.nombre}{meal.hora ? ' · ' + meal.hora : ''}</Text>
          <Text style={styles.body}>{(() => { const saved = findTracking(data?.seguimientosComida || [], plan._id, meal._id, date); return saved ? states[saved.estado] : 'Sin registro para este día' })()}</Text>
          <Button selected={false} disabled={date > localDate()} label="Registrar o actualizar seguimiento"
            onPress={() => router.push({ pathname: '/registrar-comida', params: { plan: plan._id, meal: meal._id, date } })} />
          {!!meal.platillo && <Text style={styles.body}>{meal.platillo}</Text>}
          {(meal.alimentos || []).map((food, index) => <Text key={food._id || index} style={styles.body}>
            {food.nombre} · {food.cantidad} {food.porcion?.descripcion || food.porcion?.unidad || 'porciones'}
          </Text>)}
        </View>)}
    </> : data && validDate && <Text style={styles.body}>No tienes una dieta asignada para esta fecha.</Text>}
    {!!plans.length && <>
      <Text accessibilityRole="header" style={styles.cardTitle}>Historial de dietas</Text>
      {plans.map(item => <Button key={item._id} selected={false}
        label={item.nombre + ' · ' + startDate(item)} onPress={() => setDate(startDate(item))}/>)}
    </>}
  </Page>
}
