import { MealContent } from '../plans/MealContent'
import type { Meal as PlanMeal } from '../plans/models'
import { DateField } from '@/shared/ui/DateTimeField'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'
import { activePlan, findTracking, states, validDay, type TrackingRecord } from '../tracking/models'

type Meal = PlanMeal & { _id: string }

type Plan = { _id: string; nombre: string; objetivo?: string; fechaInicio?: string; createdAt: string; comidas: Meal[];
  aceptacionPaciente?: { estado?: 'pendiente'|'aceptada'; fecha?: string|null } }
type Profile = { planes: Plan[]; seguimientosComida: TrackingRecord[] }

function localDate() {
  const today = new Date()
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')].join('-')
}
const startDate = (plan: Plan) => (plan.fechaInicio || plan.createdAt).slice(0, 10)

export default function PatientPlanScreen() {
  const { session } = useAuth()
  const [accepting,setAccepting] = useState(false)
  const [acceptError,setAcceptError] = useState('')
  const { data, loading, error, reload } = useResource<Profile>('/mi-perfil')
  const [date, setDate] = useState(localDate)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const validDate = validDay(date)
  const plans = [...(data?.planes || [])].sort((a, b) => startDate(b).localeCompare(startDate(a)) || b.createdAt.localeCompare(a.createdAt))
  const assigned = activePlan(plans, date)
  const plan = selectedPlanId ? plans.find(p => p._id === selectedPlanId) : assigned
  const trackable = !!plan && plan._id === assigned?._id && date <= localDate()
  function changeDate(next: string) { setDate(next); setSelectedPlanId('') }
  async function acceptDiet() {
    if (!session || !plan || accepting || plan.aceptacionPaciente?.estado === 'aceptada') return
    setAccepting(true); setAcceptError('')
    try {
      await request('/mi-perfil/planes/' + plan._id + '/aceptar',
        { token: session.token, method: 'PATCH' })
      reload()
      Alert.alert('Dieta recibida', 'Confirmaste que recibiste tu dieta. Tu nutriólogo recibirá una notificación.')
    } catch (cause) {
      setAcceptError(cause instanceof Error ? cause.message : 'No se pudo confirmar la dieta.')
    } finally { setAccepting(false) }
  }

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
        {plan.aceptacionPaciente?.estado === 'aceptada' ?
          <Text style={[styles.body,{color:'#246b55',fontWeight:'700'}]}>Dieta recibida y confirmada</Text> :
          <View style={{gap:8}}>
            <Text style={[styles.body,{fontSize:13}]}>Confirma únicamente que recibiste y revisaste esta dieta. No significa que hayas cumplido todas las comidas.</Text>
            <Button disabled={accepting} label={accepting?'Confirmando…':'Confirmar que recibí la dieta'} onPress={() =>
              Alert.alert('Confirmar recepción de dieta',
                'Tu nutriólogo sabrá que recibiste este plan. ¿Deseas confirmarlo?',[
                  {text:'Cancelar',style:'cancel'},
                  {text:'Confirmar',onPress:()=>void acceptDiet()},
                ])} />
          </View>}
        {!!acceptError && <Text accessibilityRole="alert" style={styles.error}>{acceptError}</Text>}
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
      <Button selected={false} label={showHistory ? 'Ocultar dietas anteriores' : 'Ver dietas anteriores (' + plans.length + ')'}
        onPress={() => setShowHistory(value => !value)} />
      {showHistory && plans.map(item => <Button key={item._id} selected={false}
        label={item.nombre + ' · ' + startDate(item)} onPress={() => { setDate(startDate(item)); setSelectedPlanId(item._id); setShowHistory(false) }}/>)}
    </>}
  </Page>
}
