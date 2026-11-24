import { showNotice } from '@/shared/ui/NoticeDialog'
import { MealContent } from '../plans/MealContent'
import type { Meal as PlanMeal } from '../plans/models'
import { PeriodCalendar } from '@/features/appointments/PeriodCalendar'
import { localToday, type CalendarView } from '@/features/clinic/workCalendar'
import { exportPlan, loadClinicBrand } from '../plans/exportPlan'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { useResource } from '@/shared/hooks/useResource'
import { activePlan, findTracking, states, validDay, type TrackingRecord } from '../tracking/models'

type Meal = PlanMeal & { _id: string }

type Plan = { _id: string; nombre: string; objetivo?: string; fechaInicio?: string; createdAt: string; comidas: Meal[];
  aceptacionPaciente?: { estado?: 'pendiente'|'aceptada'; fecha?: string|null } }
type Profile = { paciente?: {name?: string}; planes: Plan[]; seguimientosComida: TrackingRecord[] }

const startDate = (plan: Plan) => (plan.fechaInicio || plan.createdAt).slice(0, 10)

export default function PatientPlanScreen() {
  const { session } = useAuth()
  const [accepting,setAccepting] = useState(false)
  const [acceptError,setAcceptError] = useState('')
  const { data, loading, error, reload } = useResource<Profile>('/mi-perfil')
  const [date, setDate] = useState(localToday)
  const [view, setView] = useState<CalendarView>('Mes')
  const [exporting, setExporting] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const validDate = validDay(date)
  const plans = [...(data?.planes || [])].sort((a, b) => startDate(b).localeCompare(startDate(a)) || b.createdAt.localeCompare(a.createdAt) || b._id.localeCompare(a._id))
  const assigned = activePlan(plans, date)
  const plan = selectedPlanId ? plans.find(p => p._id === selectedPlanId) : assigned
  const trackable = !!plan && plan._id === assigned?._id && date <= localToday()
  const upcoming = [...new Map([...plans].reverse().filter(item => startDate(item) > localToday())
    .map(item => [startDate(item), item])).values()]
  const past = plans.filter(item => startDate(item) <= localToday())
  function changeDate(next: string) { setDate(next); setSelectedPlanId(''); setPdfError('') }
  async function sharePlan() {
    if (!session || !plan || exporting) return
    setExporting(true); setPdfError('')
    try {
      const clinic = await loadClinicBrand(session.token, plan._id)
      await exportPlan({ ...plan, fechaInicio: startDate(plan) }, data?.paciente?.name || 'Paciente', clinic)
    } catch (cause) { setPdfError(cause instanceof Error ? cause.message : 'No se pudo abrir el PDF.') }
    finally { setExporting(false) }
  }
  async function acceptDiet() {
    if (!session || !plan || accepting || plan.aceptacionPaciente?.estado === 'aceptada') return
    setAccepting(true); setAcceptError('')
    try {
      await request('/mi-perfil/planes/' + plan._id + '/aceptar',
        { token: session.token, method: 'PATCH' })
      reload()
      showNotice('Dieta recibida', 'Confirmaste que recibiste tu dieta. Tu nutriólogo recibirá una notificación.')
    } catch (cause) {
      setAcceptError(cause instanceof Error ? cause.message : 'No se pudo confirmar la dieta.')
    } finally { setAccepting(false) }
  }

  return <Page>
    <Text accessibilityRole="header" style={styles.title}>Mi plan alimenticio</Text>
    <View style={styles.card}>
      <PeriodCalendar title="Calendario de dietas" today={localToday()} focus={date} selected={date} view={view}
        onView={setView} onFocus={changeDate} onSelect={changeDate} mark={day => {
          const menu = activePlan(plans, day)
          return menu ? { label: menu.nombre, starts: startDate(menu) === day } : undefined
        }} />
      <Text style={styles.body}>● Dieta asignada · El círculo más grande indica el inicio de un plan</Text>
    </View>
    {!!data && <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Próximas dietas</Text>
      {upcoming.length ? upcoming.map(item => <Button key={item._id} label={startDate(item) + ' · ' + item.nombre}
        selected={plan?._id === item._id} onPress={() => changeDate(startDate(item))}/>)
        : <Text style={styles.body}>No hay nuevos planes programados.</Text>}
    </View>}
    {loading && <ActivityIndicator accessibilityLabel="Cargando dieta"/>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {validDate && date > localToday() && <Text style={styles.body}>Puedes consultar menús futuros; el registro de comidas se habilita cuando llegue ese día.</Text>}
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
              showNotice('Confirmar recepción de dieta',
                'Tu nutriólogo sabrá que recibiste este plan. ¿Deseas confirmarlo?',[
                  {text:'Cancelar',style:'cancel'},
                  {text:'Confirmar',onPress:()=>void acceptDiet()},
                ])} />
          </View>}
        <Button label={exporting ? 'Preparando PDF…' : 'Compartir PDF'} selected={false}
          disabled={exporting || !plan.comidas.length} onPress={() => void sharePlan()} />
        {!!pdfError && <Text accessibilityRole="alert" style={styles.error}>{pdfError}</Text>}
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
    {!!past.length && <>
      <Button selected={false} label={showHistory ? 'Ocultar dietas anteriores' : 'Ver dietas anteriores (' + past.length + ')'}
        onPress={() => setShowHistory(value => !value)} />
      {showHistory && past.map(item => <Button key={item._id} selected={false}
        label={item.nombre + ' · ' + startDate(item)} onPress={() => { setDate(startDate(item)); setSelectedPlanId(item._id); setShowHistory(false) }}/>)}
    </>}
  </Page>
}
