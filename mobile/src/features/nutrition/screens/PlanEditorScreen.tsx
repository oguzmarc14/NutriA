import { loadDraft, saveDraft, removeDraft, restoreDraftIds } from '../plans/draftStore'
import { reorderMeals } from '../plans/reorderMeals'
import { PlanTracker } from '../plans/PlanTracker'
import { MealNavigator } from '../plans/MealNavigator'
import { dietColors as dc, dietStyles as ds, DietDisclosure } from '../plans/dietUI'
import { AppDialog } from '@/shared/ui/AppDialog'
import { DateField } from '@/shared/ui/DateTimeField'
import { useEffect, useRef, useState } from 'react'
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

function Editor({ patient, patientName, initial, templatePlan, requirements, refreshRequirements, previousPlans }: {
  patient: string; patientName: string; initial?: Plan; templatePlan?: Plan; requirements?: Requirements; refreshRequirements: () => void; previousPlans: Plan[]
}) {
  const { session } = useAuth()
  const [planId, setPlanId] = useState(initial?._id)
  const [draft, setDraft] = useState(() => initial ? editPlan(initial) : templatePlan ? duplicatePlan(templatePlan) : newPlan())
  const [activeMeal, setActiveMeal] = useState(draft.meals[0]?.key || '')
  const [goalOpen, setGoalOpen] = useState(!!initial?.objetivo)
  const [addMealOpen, setAddMealOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(!initial && !templatePlan)
  const [confirmSave, setConfirmSave] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateError, setTemplateError] = useState('')
  const [templateBusy, setTemplateBusy] = useState(false)
  const [dirty, setDirty] = useState(!!templatePlan)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const draftStorageKey = 'nutria.diet-draft.'+session!.user.id+'.'+patient+'.'+(initial?._id||'new')
  const [recovery,setRecovery]=useState<Awaited<ReturnType<typeof loadDraft>>>(null)
  const [draftReady,setDraftReady]=useState(false)
  const [draftMessage,setDraftMessage]=useState('')
  useEffect(()=>{let active=true;void loadDraft(draftStorageKey).then(saved=>{if(!active)return;if(saved)setRecovery(saved);else setDraftReady(true)}).catch(()=>{if(active){setDraftMessage('No se pudo recuperar el borrador local. Puedes continuar y guardar el plan en NutriA.');setDraftReady(true)}});return()=>{active=false}},[draftStorageKey])
  useEffect(()=>{if(!draftReady||!dirty||busy)return;let active=true;const timer=setTimeout(()=>{void saveDraft(draftStorageKey,draft).then(()=>{if(active)setDraftMessage('Borrador protegido guardado en este teléfono.')}).catch(cause=>{if(active)setDraftMessage(cause instanceof Error?cause.message:'No se pudo guardar el borrador local.')})},1500);return()=>{active=false;clearTimeout(timer)}},[draftStorageKey,draftReady,draft,dirty,busy])
  const submitting = useRef(false)
  useUnsavedChanges(dirty, busy)
  const totals = planTotals(draft.meals)
  const reference = requirements?.calculos[0]
  const current = draft.meals.find(meal => meal.key === activeMeal)
  const target = draft.energy.trim() ? numberInput(draft.energy) : reference?.resultado.objetivoKcal || 0
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
      await removeDraft(draftStorageKey).catch(()=>{})
      setPlanId(plan._id)
      const saved = editPlan(plan)
      setDraft(saved); setActiveMeal(saved.meals[0]?.key || ''); setDirty(false)
      setTemplateName(plan.nombre)
      setSavedOpen(true)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) refreshRequirements()
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la dieta. Tus cambios siguen en esta pantalla.')
    } finally { submitting.current = false; setBusy(false) }
  }
  async function saveTemplate() {
    if (!session?.token || !planId || templateBusy) return
    const nombre = templateName.trim()
    if (nombre.length < 3 || nombre.length > 100) {
      setTemplateError('Escribe un nombre de 3 a 100 caracteres para guardar la dieta.')
      return
    }
    setTemplateBusy(true)
    setTemplateError('')
    try {
      await request('/community/mis-dietas', {
        token: session.token, method: 'POST', body: { planId, nombre },
      })
      setTemplateOpen(false)
      Alert.alert('Dieta guardada', 'La copia privada «' + nombre + '» está en NutriA Community → Mis dietas.', [
        { text: 'Continuar' },
        { text: 'Ver Mis dietas', onPress: () =>
          router.push({ pathname: '/comunidad', params: { tab: 'dietas' } }) },
      ])
    } catch (cause) {
      setTemplateError(cause instanceof Error ? cause.message : 'No pudimos guardar la copia privada.')
    } finally { setTemplateBusy(false) }
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
  return <View style={{ flex: 1 }}><Page contentStyle={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
    <Text style={ds.title}>{planId ? 'Editar plan alimenticio' : 'Crear plan alimenticio'}</Text>
    <Text style={ds.caption}>Paciente · {patientName}</Text>
    {!!draftMessage&&<Text style={ds.caption}>{draftMessage}</Text>}
    <AppDialog visible={!!recovery} title="Recuperar borrador" message={recovery?'Hay un borrador protegido de este paciente guardado el '+new Date(recovery.savedAt).toLocaleString('es-MX')+'. Comprueba los datos antes de guardarlo en NutriA.':''} onClose={()=>{void removeDraft(draftStorageKey).catch(()=>{});setRecovery(null);setDraftReady(true)}}>
      <Button label="Recuperar borrador" onPress={()=>{if(recovery){const restored=restoreDraftIds(recovery.draft);change(restored);setActiveMeal(restored.meals[0]?.key||'');setModeOpen(false)}setRecovery(null);setDraftReady(true)}}/>
      <Button label="Conservar formulario actual" selected={false} onPress={()=>{void removeDraft(draftStorageKey).catch(()=>{});setRecovery(null);setDraftReady(true)}}/>
    </AppDialog>
    <AppDialog visible={modeOpen && !blocked && draftReady && !recovery} title="¿Cómo quieres crear este plan?" message="Elige cómo comenzar. Puedes cambiar de modalidad antes de guardar." onClose={() => setModeOpen(false)}>
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
    <AppDialog visible={savedOpen} title="¡Dieta creada!" success
      message="El plan del paciente se guardó correctamente. ¿Deseas guardar una copia reutilizable en Mis dietas?"
      onClose={() => setSavedOpen(false)}>
      <Button label="Guardar en Mis dietas" onPress={() => { setSavedOpen(false); setTemplateOpen(true) }} />
      <Button label="Ahora no" selected={false} onPress={() => setSavedOpen(false)} />
    </AppDialog>
    <AppDialog visible={templateOpen} title="Guardar en Mis dietas"
      message="Elige un nombre para tu copia privada. La fecha de guardado se registra automáticamente."
      onClose={() => { if (!templateBusy) setTemplateOpen(false) }}>
      <FormField label="Nombre de la dieta *" value={templateName} disabled={templateBusy}
        onChange={value => { setTemplateName(value); setTemplateError('') }} />
      {!!templateError && <Text accessibilityRole="alert" style={styles.error}>{templateError}</Text>}
      <Button label={templateBusy ? 'Guardando copia…' : 'Guardar copia privada'}
        disabled={templateBusy} onPress={() => void saveTemplate()} />
      <Button label="Cancelar" selected={false} disabled={templateBusy}
        onPress={() => setTemplateOpen(false)} />
    </AppDialog>
    <AppDialog visible={!planId && !!requirements && blocked} title="Información del paciente incompleta" onClose={() => router.back()}>
      <Text style={styles.body}>Antes de crear el plan alimenticio</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>Completa los datos del paciente</Text>
      <Text style={styles.body}>Para crear una dieta se necesita expediente clínico y mediciones válidas. Puedes volver aquí después de registrarlos.</Text>
      {missingRecord && <Button label="Abrir expediente" onPress={() => router.push({ pathname: '/expediente', params: { patient } })} />}
      {missingMeasurements && <Button label="Ir a mediciones" onPress={() => router.push({ pathname: '/mediciones', params: { patient } })} />}
      <Button selected={false} label="Cancelar" onPress={() => router.back()} />
    </AppDialog>
    <View style={[ds.card, ds.body]}>
      <Text style={ds.title}>Datos del plan</Text>
      <FormField label="Nombre del plan *" value={draft.name} disabled={busy} onChange={name => change({ ...draft, name })} />
      <DateField label="Fecha de inicio" value={draft.date} disabled={busy} onChange={date => change({ ...draft, date })} />
      <DietDisclosure label="Objetivo e indicaciones generales" open={goalOpen} disabled={busy} onPress={() => setGoalOpen(!goalOpen)}>
        <FormField label="Indicaciones · opcional" multiline value={draft.goal} disabled={busy} onChange={goal => change({ ...draft, goal })} />
      </DietDisclosure>
      {!planId && <DietDisclosure label="Modalidad y guía clínica" open={guideOpen} disabled={busy} onPress={() => setGuideOpen(!guideOpen)}>
        <Button selected={false} disabled={busy} label="Cambiar modalidad" onPress={() => setModeOpen(true)} />
        {!!requirements && <><Text style={ds.caption}>Objetivos clínicos: {requirements.expediente?.nutricion?.objetivos?.join(', ') || 'Sin registrar'}</Text>
          <Text style={ds.caption}>Comidas al día: {requirements.expediente?.nutricion?.numeroComidasDia || 'Sin registrar'} · {requirements.expediente?.nutricion?.primeraComida || '—'} a {requirements.expediente?.nutricion?.ultimaComida || '—'}</Text>
          <Text style={ds.caption}>Alergias: {requirements.expediente?.alergias || 'Sin registrar'}</Text>
          <Text style={ds.caption}>Intolerancias: {requirements.expediente?.nutricion?.intoleranciasAlimentarias || 'Sin registrar'}</Text>
          {!!reference && <Text style={ds.caption}>Cálculo guardado: {new Date(reference.createdAt).toLocaleDateString('es-MX')}</Text>}
          <Button selected={false} label="Ver cálculo nutricional" onPress={() => router.push({ pathname: '/calculo', params: { patient } })} />
        </>}
      </DietDisclosure>}
    </View>
    {!!reference && !!requirements && measurementChanged(reference, requirements.mediciones) && <View style={ds.inset}>
      <Text style={ds.caption}>Hay mediciones nuevas o modificadas. Revisa el cálculo nutricional antes de continuar.</Text>
      <Button selected={false} label="Revisar cálculo" onPress={() => router.push({ pathname: '/calculo', params: { patient } })} />
    </View>}
    <MealNavigator meals={draft.meals} active={activeMeal} disabled={busy} onReorder={(from, to) => {
      if (from === to) return
      change({ ...draft, meals: reorderMeals(draft.meals, from, to) })
    }} onSelect={setActiveMeal} onAdd={() => setAddMealOpen(true)} onMove={(key, direction) => {
      const meals = [...draft.meals], index = meals.findIndex(meal => meal.key === key), next = index + direction
      if (index < 0 || next < 0 || next >= meals.length) return
      ;[meals[index], meals[next]] = [meals[next], meals[index]]; change({ ...draft, meals })
    }} onRemove={key => {
      const meals = draft.meals.filter(meal => meal.key !== key)
      change({ ...draft, meals })
      if (activeMeal === key) setActiveMeal(meals[0]?.key || '')
    }} />
    <AppDialog visible={addMealOpen} title="Agregar tiempo de comida" message="Elige un tipo. Puedes cambiar su nombre y hora después." onClose={() => setAddMealOpen(false)}>
      {['Desayuno', 'Colación', 'Comida', 'Cena', 'Otra comida'].map(name => <Button key={name} label={name} selected={false} onPress={() => {
        const meal = { ...newMeal(name), hora: ({ Desayuno: '08:00', Colación: '11:30', Comida: '14:30', Cena: '20:30' } as Record<string, string>)[name] || '' }
        change({ ...draft, meals: [...draft.meals, meal] }); setActiveMeal(meal.key); setAddMealOpen(false)
      }} />)}
    </AppDialog>
    {current && <MealEditor key={current.key} patient={patient} meal={current} index={draft.meals.findIndex(m => m.key === current.key)} target={target} busy={busy}
      onChange={meal => change({ ...draft, meals: draft.meals.map(item => item.key === meal.key ? meal : item) })}
      onRemove={() => { const meals = draft.meals.filter(item => item.key !== current.key); change({ ...draft, meals }); setActiveMeal(meals[0]?.key || '') }} />}
    <AppDialog visible={!!error} title="Revisa los datos del plan" message={error} onClose={() => setError('')} />
    <View style={styles.row}><Button expand selected={false} disabled={busy} label="Cancelar" onPress={() => router.back()} />
    <Button expand disabled={busy || blocked || !dirty} label={busy ? 'Guardando…' : planId ? 'Guardar cambios' : 'Guardar plan'} onPress={save} /></View>

  </Page><PlanTracker draft={draft} reference={reference} active={activeMeal} disabled={busy || blocked} onChange={change} /></View>
}

export default function PlanEditorScreen() {
  const { patient, id, template } = useLocalSearchParams<{ patient?: string; id?: string; template?: string }>()
  const valid = validId(patient) && (!id || validId(id)) && (!template || validId(template))
  const resource = useResource<PlanData>(valid ? '/planes/' + patient : null)
  const requirements = useResource<Requirements>(valid ? '/calculo-nutricional/' + patient : null)
  const templateResource = useResource<{ plan: Plan }>(valid && template ? '/community/mis-dietas/' + template : null)
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para crear una dieta.</Text><Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'create-plan' } })} /></Page>
  const existing = id ? resource.data?.planes.find(plan => plan._id === id) : undefined
  if (resource.data && (!id || existing) && (!template || templateResource.data) &&
    (id || (!requirements.loading && !requirements.error))) return <Editor
      key={String(patient) + '-' + (id || 'new') + '-' + (template || 'blank')}
      patient={patient!} patientName={resource.data.paciente.name} initial={existing}
      templatePlan={templateResource.data?.plan} requirements={requirements.data}
      refreshRequirements={requirements.reload} previousPlans={resource.data.planes} />
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!id && <ListState loading={requirements.loading} error={requirements.error} reload={requirements.reload} />}
    {template && <ListState loading={templateResource.loading} error={templateResource.error} reload={templateResource.reload} />}
    {resource.data && <View style={{ gap: 5 }}><Text style={{ color: dc.ink, fontSize: 25, fontWeight: '800' }}>{id ? 'Editar plan alimenticio' : 'Crear plan alimenticio'}</Text>
      <Text style={ds.caption}>Paciente · {resource.data.paciente.name}</Text></View>}
    {resource.data && id && !existing && <Text style={styles.error}>Esta dieta no está disponible. Regresa a los planes del paciente.</Text>}
  </Page>
}
