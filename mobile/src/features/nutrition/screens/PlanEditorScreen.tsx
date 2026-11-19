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
import { CatalogPicker } from '../plans/CatalogPicker'
import { MealEditor } from '../plans/MealEditor'
import { editPlan, fromCatalog, newMeal, newPlan, planPayload, planTotals, type DraftPlan, type Plan, type PlanData } from '../plans/models'
import { numberInput, type Measurement } from '../clinicalModels'

type Requirements = { expediente: object | null; mediciones: Measurement[]; calculos: { resultado: { objetivoKcal: number } }[] }
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

function Editor({ patient, initial, requirements, refreshRequirements }: {
  patient: string; initial?: Plan; requirements?: Requirements; refreshRequirements: () => void
}) {
  const { session } = useAuth()
  const [planId, setPlanId] = useState(initial?._id)
  const [draft, setDraft] = useState(() => initial ? editPlan(initial) : newPlan())
  const [activeMeal, setActiveMeal] = useState(draft.meals[0]?.key || '')
  const [catalogMeal, setCatalogMeal] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  useUnsavedChanges(dirty, busy)
  const totals = planTotals(draft.meals)
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
      Alert.alert('Dieta guardada', 'El plan alimenticio quedó disponible para el paciente.', [{ text: 'Aceptar' }])
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) refreshRequirements()
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la dieta. Tus cambios siguen en esta pantalla.')
    } finally { submitting.current = false; setBusy(false) }
  }
  function save() {
    if (busy || blocked) return
    try {
      const body = planPayload(draft)
      Alert.alert('Guardar dieta', 'Este plan quedará disponible para el paciente. ¿Guardar los cambios?', [
        { text: 'Seguir editando', style: 'cancel' }, { text: 'Guardar', onPress: () => void persist(body) },
      ])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa los datos del plan.') }
  }
  return <>
    {!planId && requirements && blocked && <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Completa los datos del paciente</Text>
      <Text style={styles.body}>Para crear una dieta se necesita expediente clínico y mediciones válidas. Puedes volver aquí después de registrarlos.</Text>
      {missingRecord && <Button label="Abrir expediente" onPress={() => router.push({ pathname: '/expediente', params: { patient } })} />}
      {missingMeasurements && <Button label="Ir a mediciones" onPress={() => router.push({ pathname: '/mediciones', params: { patient } })} />}
    </View>}
    <View style={[styles.card, { gap: 12 }]}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{planId ? 'Editar dieta' : 'Nueva dieta'}</Text>
      <FormField label="Nombre de la dieta" value={draft.name} disabled={busy} onChange={name => change({ ...draft, name })} />
      <FormField label="Objetivo e indicaciones generales · opcional" multiline value={draft.goal} disabled={busy} onChange={goal => change({ ...draft, goal })} />
      <FormField label="Fecha de inicio (AAAA-MM-DD)" value={draft.date} disabled={busy} onChange={date => change({ ...draft, date })} />
      <FormField label="Meta total de energía (kcal) · opcional" numeric value={draft.energy} disabled={busy} onChange={energy => change({ ...draft, energy })} />
      <View style={styles.row}>
        <Button expand selected={false} disabled={busy || !Number.isFinite(target) || target <= 100} label="−100 kcal" onPress={() => change({ ...draft, energy: String(Math.round((target - 100) * 10) / 10) })} />
        <Button expand selected={false} disabled={busy || !Number.isFinite(target)} label="+100 kcal" onPress={() => change({ ...draft, energy: String(Math.round((target + 100) * 10) / 10) })} />
      </View>
      {!!requirements?.calculos[0] && <Button selected={false} disabled={busy} label={`Usar último cálculo: ${requirements.calculos[0].resultado.objetivoKcal} kcal`}
        onPress={() => change({ ...draft, energy: String(requirements.calculos[0].resultado.objetivoKcal) })} />}
      <Text style={styles.body}>Deja la meta vacía para quitarla. Los nutrientes se calculan con los alimentos y sus porciones.</Text>
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Totales del plan</Text>
      <Text style={styles.body}>{totals.kcal.toFixed(1)} kcal{draft.energy.trim() ? ` / ${draft.energy} kcal de meta` : ''}</Text>
      <Text style={styles.body}>Proteínas {totals.proteina.toFixed(1)} g · Carbohidratos {totals.carbohidratos.toFixed(1)} g · Grasas {totals.grasas.toFixed(1)} g</Text>
    </View>
    <Text accessibilityRole="header" style={styles.cardTitle}>Comidas</Text>
    {draft.meals.map(meal => <Button key={meal.key} disabled={busy} selected={meal.key === activeMeal}
      label={`${meal.nombre || 'Sin nombre'} · ${meal.alimentos.length} alimentos`} onPress={() => setActiveMeal(meal.key)} />)}
    <Button selected={false} disabled={busy} label="Agregar comida" onPress={() => {
      const meal = newMeal('Nueva comida'); change({ ...draft, meals: [...draft.meals, meal] }); setActiveMeal(meal.key)
    }} />
    {current && <MealEditor key={current.key} meal={current} busy={busy}
      onChange={meal => change({ ...draft, meals: draft.meals.map(item => item.key === meal.key ? meal : item) })}
      onCatalog={() => setCatalogMeal(current.key)}
      onRemove={() => { const meals = draft.meals.filter(item => item.key !== current.key); change({ ...draft, meals }); setActiveMeal(meals[0]?.key || '') }} />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button disabled={busy || blocked || !dirty} label={busy ? 'Guardando…' : 'Guardar dieta'} onPress={save} />
    {catalogMeal && <CatalogPicker onClose={() => setCatalogMeal(null)} onChoose={food => {
      change({ ...draft, meals: draft.meals.map(meal => meal.key === catalogMeal ? { ...meal, alimentos: [...meal.alimentos, fromCatalog(food)] } : meal) })
      setCatalogMeal(null)
    }} />}
  </>
}

export default function PlanEditorScreen() {
  const { patient, id } = useLocalSearchParams<{ patient?: string; id?: string }>()
  const valid = validId(patient) && (!id || validId(id))
  const resource = useResource<PlanData>(valid ? '/planes/' + patient : null)
  const requirements = useResource<Requirements>(valid && !id ? '/calculo-nutricional/' + patient : null)
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para crear una dieta.</Text><Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'create-plan' } })} /></Page>
  const existing = id ? resource.data?.planes.find(plan => plan._id === id) : undefined
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!id && <ListState loading={requirements.loading} error={requirements.error} reload={requirements.reload} />}
    {resource.data && <Text style={styles.title}>{resource.data.paciente.name}</Text>}
    {resource.data && id && !existing && <Text style={styles.error}>Esta dieta no está disponible. Regresa a los planes del paciente.</Text>}
    {resource.data && (!id || existing) && <Editor key={`${patient}-${id || 'new'}`} patient={patient!} initial={existing} requirements={requirements.data} refreshRequirements={requirements.reload} />}
  </Page>
}
