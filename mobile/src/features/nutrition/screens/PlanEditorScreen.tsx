import { AppDialog } from '@/shared/ui/AppDialog'
import { DateField } from '@/shared/ui/DateTimeField'
import { useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { ApiError, request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { MealEditor } from '../plans/MealEditor'
import { assistedPlan, duplicatePlan, editPlan, newMeal, newPlan, planPayload, planTotals, type DraftPlan, type Plan, type PlanData } from '../plans/models'
import { measurementChanged, numberInput, type Calculation, type Measurement } from '../clinicalModels'

type Requirements = { expediente: { alergias?: string; nutricion?: Parameters<typeof assistedPlan>[0] & { intoleranciasAlimentarias?: string } } | null; mediciones: Measurement[]; calculos: Calculation[] }
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

function Editor({ patient, initial, requirements, refreshRequirements, previousPlans }: {
  patient: string; initial?: Plan; requirements?: Requirements; refreshRequirements: () => void; previousPlans: Plan[]
}) {
  const { session } = useAuth()
  const [planId, setPlanId] = useState(initial?._id)
  const [draft, setDraft] = useState(() => initial ? editPlan(initial) : newPlan())
  const [activeMeal, setActiveMeal] = useState(draft.meals[0]?.key || '')
  const [guideOpen, setGuideOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(!initial)
  const [confirmSave, setConfirmSave] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  useUnsavedChanges(dirty, busy)
  const totals = planTotals(draft.meals)
  const reference = requirements?.calculos[0]
  const current = draft.meals.find(meal => meal.key === activeMeal)
  const target = draft.energy.trim() ? numberInput(draft.energy) : totals.kcal
  const missingRecord = !requirements?.expediente
  const missingMeasurements = !requirements?.mediciones.some(item => item.peso > 0 && item.estatura >= 0.5 && item.estatura <= 3 && item.edad >= 1 && item.edad <= 120 && item.nivelActividadFisica >= 1 && item.nivelActividadFisica <= 5)
  const blocked = !planId && (!requirements || missingRecord || missingMeasurements)
  function change(next: DraftPlan) { setDraft(next); setDirty(true); setError('') }
  async function persist(body: ReturnType<typeof planPayload>) {
    if (!session || submitting.current) return
    submitting.current = true; setBusy(true); setError('')
    try {
      const { plan } = await request<{ plan: Plan }>('/planes/' + patient + (planId ? '/' + planId : ''), {
        token: session.token, method: planId ? 'PUT' : 'POST', body,
      })
      setPlanId(plan._id)
      const saved = editPlan(plan)
      setDraft(saved); setActiveMeal(saved.meals[0]?.key || ''); setDirty(false)
      setSavedOpen(true)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) refreshRequirements()
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la dieta. Tus cambios siguen en esta pantalla.')
    } finally { submitting.current = false; setBusy(false) }
  }
  function save() {
    if (busy || blocked) return
    try {
      planPayload(draft)
      setConfirmSave(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa los datos del plan.') }
  }
  function begin(next: DraftPlan) {
    const apply = () => { change(next); setActiveMeal(next.meals[0]?.key || ''); setModeOpen(false) }
    if (dirty) Alert.alert('Reemplazar borrador', 'Se reemplazarán las comidas actuales. ¿Continuar?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aceptar', onPress: apply }])
    else apply()
  }
  return <>
    <AppDialog visible={modeOpen && !blocked} title="¿Cómo quieres crear este plan?" message="Elige cómo comenzar. Puedes cambiar de modalidad antes de guardar." onClose={() => setModeOpen(false)}>
      <Button label="Plan asistido" disabled={!requirements?.calculos[0]} onPress={() => begin(assistedPlan(requirements?.expediente?.nutricion || {}, requirements!.calculos[0].resultado.objetivoKcal))} />
      <Text style={styles.body}>Usa objetivos, cantidad de comidas y horarios del expediente. Requiere un cálculo guardado.</Text>
      <Button label="Duplicar último plan" disabled={!previousPlans.length} onPress={() => begin(duplicatePlan([...previousPlans].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]))} />
      <Text style={styles.body}>Recupera alimentos y cantidades para ajustarlos en una copia independiente.</Text>
      <Button label="Desde cero" onPress={() => begin(newPlan())} />
      <Button selected={false} label="Cancelar" onPress={() => setModeOpen(false)} />
    </AppDialog>
    <AppDialog visible={confirmSave} title={planId ? 'Guardar cambios' : 'Guardar plan'} message="El plan alimenticio quedará disponible para el paciente. ¿Confirmas el guardado?" onClose={() => setConfirmSave(false)}>
      <View style={styles.row}><Button expand selected={false} label="Cancelar" onPress={() => setConfirmSave(false)} />
        <Button expand label="Aceptar" onPress={() => { setConfirmSave(false); try { void persist(planPayload(draft)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa los datos.') } }} /></View>
    </AppDialog>
    <AppDialog visible={savedOpen} title="Plan guardado correctamente" message="El paciente ya puede consultar su plan alimenticio." success onClose={() => setSavedOpen(false)} />
    <AppDialog visible={!planId && !!requirements && blocked} title="Información del paciente incompleta" onClose={() => router.back()}>
      <Text style={styles.body}>Antes de crear el plan alimenticio</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>Completa los datos del paciente</Text>
      <Text style={styles.body}>Para crear una dieta se necesita expediente clínico y mediciones válidas. Puedes volver aquí después de registrarlos.</Text>
      {missingRecord && <Button label="Abrir expediente" onPress={() => router.push({ pathname: '/expediente', params: { patient } })} />}
      {missingMeasurements && <Button label="Ir a mediciones" onPress={() => router.push({ pathname: '/mediciones', params: { patient } })} />}
      <Button selected={false} label="Cancelar" onPress={() => router.back()} />
    </AppDialog>
    {!!requirements && <View style={styles.card}>
      <Button selected={false} label={guideOpen ? 'Ocultar guía clínica del paciente' : 'Guía clínica del paciente'} onPress={() => setGuideOpen(!guideOpen)} />
      {guideOpen && <><Text style={styles.body}>Objetivos: {requirements.expediente?.nutricion?.objetivos?.join(', ') || 'Sin registrar'}</Text>
        <Text style={styles.body}>Comidas al día: {requirements.expediente?.nutricion?.numeroComidasDia || 'Sin registrar'}</Text>
        <Text style={styles.body}>Primera comida: {requirements.expediente?.nutricion?.primeraComida || 'Sin registrar'} · Última comida: {requirements.expediente?.nutricion?.ultimaComida || 'Sin registrar'}</Text>
        <Text style={styles.body}>Alergias: {requirements.expediente?.alergias || 'Sin registrar'}</Text>
        <Text style={styles.body}>Intolerancias: {requirements.expediente?.nutricion?.intoleranciasAlimentarias || 'Sin registrar'}</Text>
        {!!reference && <><Text style={styles.body}>Cálculo guardado: {new Date(reference.createdAt).toLocaleDateString('es-MX')}</Text>
          {measurementChanged(reference, requirements.mediciones) && <Text style={styles.error}>Hay mediciones nuevas o modificadas. Revisa el cálculo antes de continuar.</Text>}</>}
        <Button selected={false} label="Ver cálculo nutricional" onPress={() => router.push({ pathname: '/calculo', params: { patient } })} />
      </>}
    </View>}
    <View style={[styles.card, { gap: 12 }]}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{planId ? 'Editar plan alimenticio' : 'Nuevo plan alimenticio'}</Text>
      <FormField label="Nombre de la dieta" value={draft.name} disabled={busy} onChange={name => change({ ...draft, name })} />
      <FormField label="Objetivo e indicaciones generales · opcional" multiline value={draft.goal} disabled={busy} onChange={goal => change({ ...draft, goal })} />
      <DateField label="Fecha de inicio" value={draft.date} disabled={busy} onChange={date => change({ ...draft, date })} />
      <FormField label="Meta total de energía (kcal) · opcional" numeric value={draft.energy} disabled={busy} onChange={energy => change({ ...draft, energy })} />
      <View style={styles.row}>
        <Button expand selected={false} disabled={busy || !Number.isFinite(target) || target <= 100} label="−100 kcal" onPress={() => change({ ...draft, energy: String(Math.round((target - 100) * 10) / 10) })} />
        <Button expand selected={false} disabled={busy || !Number.isFinite(target)} label="+100 kcal" onPress={() => change({ ...draft, energy: String(Math.round((target + 100) * 10) / 10) })} />
      </View>
      {!!requirements?.calculos[0] && <Button selected={false} disabled={busy} label={`Usar último cálculo: ${requirements.calculos[0].resultado.objetivoKcal} kcal`}
        onPress={() => change({ ...draft, energy: String(requirements.calculos[0].resultado.objetivoKcal) })} />}
      {!planId && <Button selected={false} disabled={busy} label="Cambiar modalidad" onPress={() => setModeOpen(true)} />}
      <Text style={styles.body}>Deja la meta vacía para quitarla. Los nutrientes se calculan con los alimentos y sus porciones.</Text>
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Seguimiento del plan</Text>
      <Text style={styles.body}>{totals.kcal.toFixed(1)} kcal{draft.energy.trim() ? ` / ${draft.energy} kcal de meta` : ''}</Text>
      {[{ label: 'Energía', actual: totals.kcal, goal: draft.energy.trim() ? numberInput(draft.energy) : null, unit: 'kcal' },
        { label: 'Proteínas', actual: totals.proteina, goal: reference?.resultado.proteinasGramos, unit: 'g' },
        { label: 'Carbohidratos', actual: totals.carbohidratos, goal: reference?.resultado.carbohidratosGramos, unit: 'g' },
        { label: 'Grasas', actual: totals.grasas, goal: reference?.resultado.grasasGramos, unit: 'g' }].map(metric => <View key={metric.label} style={{ gap: 6 }}>
          <Text style={styles.body}>{metric.label}: {metric.actual.toFixed(1)}{metric.goal != null && Number.isFinite(metric.goal) ? ' / ' + metric.goal.toFixed(1) : ''} {metric.unit}</Text>
          {metric.goal != null && Number.isFinite(metric.goal) && metric.goal > 0 && <><View style={{ height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#dfede5' }}>
            <View style={{ height: 7, width: `${Math.min(100, metric.actual / metric.goal * 100)}%`, backgroundColor: metric.actual > metric.goal ? '#b47820' : '#176344' }} /></View>
            <Text style={styles.body}>{metric.actual > metric.goal ? 'Excedente' : 'Pendiente'}: {Math.abs(metric.goal - metric.actual).toFixed(1)} {metric.unit}</Text></>}
        </View>)}
    </View>
    <Text accessibilityRole="header" style={styles.cardTitle}>Comidas</Text>
    {draft.meals.map(meal => <Button key={meal.key} disabled={busy} selected={meal.key === activeMeal}
      label={`${meal.nombre || 'Sin nombre'} · ${meal.alimentos.length} alimentos`} onPress={() => setActiveMeal(meal.key)} />)}
    <Button selected={false} disabled={busy} label="Agregar comida" onPress={() => {
      const meal = newMeal('Nueva comida'); change({ ...draft, meals: [...draft.meals, meal] }); setActiveMeal(meal.key)
    }} />
    {current && <MealEditor key={current.key} patient={patient} meal={current} busy={busy}
      onChange={meal => change({ ...draft, meals: draft.meals.map(item => item.key === meal.key ? meal : item) })}
      onRemove={() => { const meals = draft.meals.filter(item => item.key !== current.key); change({ ...draft, meals }); setActiveMeal(meals[0]?.key || '') }} />}
    <AppDialog visible={!!error} title="Revisa los datos del plan" message={error} onClose={() => setError('')} />
    {current && <View style={styles.row}>
      <Button expand disabled={busy || draft.meals[0]?.key === current.key} selected={false} label="Mover antes" onPress={() => {
        const meals = [...draft.meals], index = meals.findIndex(m => m.key === current.key); [meals[index - 1], meals[index]] = [meals[index], meals[index - 1]]; change({ ...draft, meals })
      }} />
      <Button expand disabled={busy || draft.meals[draft.meals.length - 1]?.key === current.key} selected={false} label="Mover después" onPress={() => {
        const meals = [...draft.meals], index = meals.findIndex(m => m.key === current.key); [meals[index + 1], meals[index]] = [meals[index], meals[index + 1]]; change({ ...draft, meals })
      }} />
    </View>}
    <View style={styles.card}><Text style={styles.cardTitle}>Distribución por comida</Text>
      {draft.meals.map(meal => { const subtotal = planTotals([meal]); const percent = numberInput(meal.percentage); const goal = Number.isFinite(percent) && Number.isFinite(target) ? target * percent / 100 : null
        return <View key={meal.key} style={{ gap: 6 }}><Text style={styles.body}>{meal.nombre}: {subtotal.kcal.toFixed(1)} kcal{goal === null ? '' : ` / ${goal.toFixed(1)} kcal`}</Text>
          <View style={{ height: 7, backgroundColor: '#dfede5', borderRadius: 4, overflow: 'hidden' }}><View style={{ height: 7, width: `${Math.min(100, goal && goal > 0 ? subtotal.kcal / goal * 100 : 0)}%`, backgroundColor: '#176344' }} /></View></View>
      })}
    </View>
    <View style={styles.row}><Button expand selected={false} disabled={busy} label="Cancelar" onPress={() => router.back()} />
    <Button expand disabled={busy || blocked || !dirty} label={busy ? 'Guardando…' : planId ? 'Guardar cambios' : 'Guardar plan'} onPress={save} /></View>

  </>
}

export default function PlanEditorScreen() {
  const { patient, id } = useLocalSearchParams<{ patient?: string; id?: string }>()
  const valid = validId(patient) && (!id || validId(id))
  const resource = useResource<PlanData>(valid ? '/planes/' + patient : null)
  const requirements = useResource<Requirements>(valid ? '/calculo-nutricional/' + patient : null)
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para crear una dieta.</Text><Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'create-plan' } })} /></Page>
  const existing = id ? resource.data?.planes.find(plan => plan._id === id) : undefined
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!id && <ListState loading={requirements.loading} error={requirements.error} reload={requirements.reload} />}
    {resource.data && <Text style={styles.title}>{resource.data.paciente.name}</Text>}
    {resource.data && id && !existing && <Text style={styles.error}>Esta dieta no está disponible. Regresa a los planes del paciente.</Text>}
    {resource.data && (!id || existing) && <Editor key={`${patient}-${id || 'new'}`} patient={patient!} initial={existing} requirements={requirements.data} refreshRequirements={requirements.reload} previousPlans={resource.data.planes} />}
  </Page>
}
