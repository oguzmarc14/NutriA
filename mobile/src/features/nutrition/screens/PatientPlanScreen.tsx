import { MealContent } from '../plans/MealContent'
import type { Meal as PlanMeal } from '../plans/models'
import { DateField } from '@/shared/ui/DateTimeField'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'
import { activePlan, findTracking, states, validDay, type TrackingRecord } from '../tracking/models'

type Meal = PlanMeal & { _id: string }

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
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const validDate = validDay(date)
  const plans = [...(data?.planes || [])].sort((a, b) => startDate(b).localeCompare(startDate(a)) || b.createdAt.localeCompare(a.createdAt))
  const assigned = activePlan(plans, date)
  const plan = selectedPlanId ? plans.find(p => p._id === selectedPlanId) : assigned
  const trackable = !!plan && plan._id === assigned?._id && date <= localDate()
  function changeDate(next: string) { setDate(next); setSelectedPlanId('') }

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mi plan alimenticio</Text>
    <DateField label="Fecha del menú" value={date} onChange={changeDate} />
    {!validDate && <Text accessibilityRole="alert" style={styles.error}>Escribe una fecha válida en formato AAAA-MM-DD.</Text>}
    <Button label="Hoy" selected={false} onPress={() => changeDate(localDate())}/>
    {loading && <ActivityIndicator accessibilityLabel="Cargando dieta"/>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {validDate && date > localDate() && <Text style={styles.body}>Puedes consultar menús futuros; el registro de comidas se habilita cuando llegue ese día.</Text>}
    {plan ? <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{plan.nombre}</Text>
        <Text style={styles.body}>Aplicable desde {startDate(plan)}</Text>
        {!!plan.objetivo && <Text style={styles.body}>{plan.objetivo}</Text>}
      </View>
      {!trackable && <Text style={styles.body}>Consulta de un plan histórico o futuro. El seguimiento se registra en el plan vigente para cada fecha.</Text>}
      {(plan.comidas || []).map(meal =>
        <View key={meal._id} style={styles.card}>
          <Text style={styles.cardTitle}>{meal.nombre}{meal.hora ? ' · ' + meal.hora : ''}</Text>
          <Text style={styles.body}>{(() => { const saved = findTracking(data?.seguimientosComida || [], plan._id, meal._id, date); return saved ? states[saved.estado] : 'Sin registro para este día' })()}</Text>
          <Button selected={false} disabled={!trackable} label="Registrar o actualizar seguimiento"
            onPress={() => router.push({ pathname: '/registrar-comida', params: { plan: plan._id, meal: meal._id, date } })} />
          <MealContent meal={meal} />
        </View>)}
    </> : data && validDate && <Text style={styles.body}>No tienes una dieta asignada para esta fecha.</Text>}
    {!!plans.length && <>
      <Text accessibilityRole="header" style={styles.cardTitle}>Historial de dietas</Text>
      {plans.map(item => <Button key={item._id} selected={false}
        label={item.nombre + ' · ' + startDate(item)} onPress={() => { setDate(startDate(item)); setSelectedPlanId(item._id) }}/>)}
    </>}
  </Page>
}
