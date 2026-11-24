import { showNotice } from '@/shared/ui/NoticeDialog'
import { loadDraft, saveDraft, removeDraft, restoreDraftIds } from '../plans/draftStore'
import { reorderMeals } from '../plans/reorderMeals'
import { PlanTracker } from '../plans/PlanTracker'
import { MealNavigator } from '../plans/MealNavigator'
import { dietColors as dc, dietStyles as ds, DietDisclosure } from '../plans/dietUI'
import { AppDialog } from '@/shared/ui/AppDialog'
import { DateField } from '@/shared/ui/DateTimeField'
import { useEffect, useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ApiError, request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { MealEditor } from '../plans/MealEditor'
import { assistedPlan, balanceMealDistribution, duplicatePlan, editPlan, newMeal, newPlan, editablePlanPayload, planDistribution, planTotals, suggestedPlanName, type DraftPlan, type Plan, type PlanData } from '../plans/models'
import { measurementChanged, numberInput, type Calculation, type Measurement } from '../clinicalModels'

type Requirements = { expediente: { alergias?: string; nutricion?: Parameters<typeof assistedPlan>[0] & { intoleranciasAlimentarias?: string } } | null; mediciones: Measurement[]; calculos: Calculation[] }
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)

function PlanModeOption({ icon, label, description, disabled, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; description: string; disabled?: boolean; onPress: () => void
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [{
      flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 68, padding: 11,
      borderWidth: 1, borderColor: dc.border, borderRadius: 15, backgroundColor: disabled ? '#fff' : dc.soft,
    }, pressed && styles.pressed]}>
    <View style={ds.iconTile}><Ionicons name={icon} size={20} color={dc.green} /></View>
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={[ds.label, { color: disabled ? dc.muted : dc.green }]}>{label}</Text>
      <Text style={ds.caption}>{description}</Text>
    </View>
    {!disabled && <Ionicons name="chevron-forward" size={17} color={dc.green} />}
  </Pressable>
}

function Editor({ patient, patientName, initial, templatePlan, requirements, refreshRequirements, previousPlans }: {
  patient: string; patientName: string; initial?: Plan; templatePlan?: Plan; requirements?: Requirements; refreshRequirements: () => void; previousPlans: Plan[]
}) {
  const { session } = useAuth()
  const [planId, setPlanId] = useState(initial?._id)
  const [draft, setDraft] = useState(() => {
    const plan = initial ? editPlan(initial) : templatePlan ? { ...duplicatePlan(templatePlan), name: '' } : newPlan()
    return { ...plan, meals: balanceMealDistribution(plan.meals.length ? plan.meals : [newMeal()]) }
  })
  const [nameOpen, setNameOpen] = useState(false)
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
  const [savedTemplateName, setSavedTemplateName] = useState<string | null>(null)
  const [dirty, setDirty] = useState(!!templatePlan)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const draftStorageKey = 'nutria.diet-draft.'+session!.user.id+'.'+patient+'.'+(initial?._id||'new')
  const [recovery,setRecovery]=useState<Awaited<ReturnType<typeof loadDraft>>>(null)
  const [draftReady,setDraftReady]=useState(false)
  const [draftMessage,setDraftMessage]=useState('')
  useEffect(()=>{let active=true;void loadDraft(draftStorageKey).then(saved=>{if(!active)return;if(saved)setRecovery(saved);else setDraftReady(true)}).catch(()=>{if(active){setDraftMessage('No se pudo recuperar el borrador local. Puedes continuar y guardar el plan en NutriA.');setDraftReady(true)}});return()=>{active=false}},[draftStorageKey])
  useEffect(()=>{if(!draftReady||!dirty||busy)return;let active=true;const timer=setTimeout(()=>{void saveDraft(draftStorageKey,draft).then(()=>{if(active)setDraftMessage('Borrador protegido guardado en este teléfono.')}).catch(cause=>{if(active)setDraftMessage(cause instanceof Error?cause.message:'No se pudo guardar el borrador local.')})},1500);return()=>{active=false;clearTimeout(timer)}},[draftStorageKey,draftReady,draft,dirty,busy])
  const [trackerOpen, setTrackerOpen] = useState(false)
  const distribution = planDistribution(draft.meals)
  const submitting = useRef(false)
  useUnsavedChanges(dirty, busy, dirty ? distribution.error : undefined)
  const totals = planTotals(draft.meals)
  const reference = requirements?.calculos[0]
  const current = draft.meals.find(meal => meal.key === activeMeal)
  const target = draft.energy.trim() ? numberInput(draft.energy) : reference?.resultado.objetivoKcal || 0
  const missingRecord = !requirements?.expediente
  const missingMeasurements = !requirements?.mediciones.some(item => item.peso > 0 && item.estatura >= 0.5 && item.estatura <= 3 && item.edad >= 1 && item.edad <= 120 && item.nivelActividadFisica >= 1 && item.nivelActividadFisica <= 5)
  const blocked = !planId && (!requirements || missingRecord || missingMeasurements)
  const suggestedName = suggestedPlanName(patientName, draft.date, previousPlans)
  const name = draft.name.trim() || suggestedName
  let savePayload: ReturnType<typeof editablePlanPayload> | undefined
  let saveReason = blocked ? 'Completa el expediente y las mediciones del paciente.' : ''
  if (!saveReason) {
    try { savePayload = editablePlanPayload({ ...draft, name }) }
    catch (cause) { saveReason = cause instanceof Error ? cause.message : 'Revisa los datos del plan.' }
  }
  function change(next: DraftPlan) { setDraft(next); setDirty(true); setError('') }
  function changePercentage(key: string, percent: number) {
    setDraft(current => ({ ...current, meals: balanceMealDistribution(current.meals, { key, percent }) }))
    setDirty(true); setError('')
  }
  function removeMeal(key: string) {
    if (draft.meals.length === 1) { setError('El plan debe conservar al menos una comida.'); return }
    const meals = balanceMealDistribution(draft.meals.filter(meal => meal.key !== key))
    change({ ...draft, meals })
    if (activeMeal === key) setActiveMeal(meals[0].key)
  }
  async function persist(body: ReturnType<typeof editablePlanPayload>) {
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
      setSavedTemplateName(nombre)
    } catch (cause) {
      setTemplateError(cause instanceof Error ? cause.message : 'No pudimos guardar la copia privada.')
    } finally { setTemplateBusy(false) }
  }
  function save() {
    if (busy) return
    if (saveReason) { setError(saveReason); return }
    setConfirmSave(true)
  }
  function begin(next: DraftPlan) {
    const apply = () => { change({ ...next, name: draft.name, meals: balanceMealDistribution(next.meals) }); setActiveMeal(next.meals[0]?.key || ''); setModeOpen(false) }
    if (dirty) showNotice('Reemplazar borrador', 'Se reemplazarán las comidas actuales. ¿Continuar?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aceptar', onPress: apply }])
    else apply()
  }
  return <View style={{ flex: 1 }}><Page contentStyle={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
    <Text style={ds.title}>{planId ? 'Editar plan alimenticio' : 'Crear plan alimenticio'}</Text>
    <Text style={ds.caption}>Paciente · {patientName}</Text>
    {!!draftMessage&&<Text style={ds.caption}>{draftMessage}</Text>}
    <AppDialog visible={!!recovery} title="Recuperar borrador" message={recovery?'Hay un borrador protegido de este paciente guardado el '+new Date(recovery.savedAt).toLocaleString('es-MX')+'. Comprueba los datos antes de guardarlo en NutriA.':''} onClose={()=>{void removeDraft(draftStorageKey).catch(()=>{});setRecovery(null);setDraftReady(true)}}>
      <Button label="Recuperar borrador" onPress={()=>{if(recovery){const restored=restoreDraftIds(recovery.draft);const meals=balanceMealDistribution(restored.meals.length?restored.meals:[newMeal()]);change({...restored,meals});setActiveMeal(meals[0].key);setModeOpen(false)}setRecovery(null);setDraftReady(true)}}/>
      <Button label="Conservar formulario actual" selected={false} onPress={()=>{void removeDraft(draftStorageKey).catch(()=>{});setRecovery(null);setDraftReady(true)}}/>
    </AppDialog>
    <AppDialog visible={modeOpen && !blocked && draftReady && !recovery} title="Crear dieta"
      onClose={() => setModeOpen(false)}>
      <View style={{ gap: 8 }}>
        <PlanModeOption icon="sparkles-outline" label="Plan asistido"
          description={requirements?.calculos[0] ? 'Empieza con la meta, las comidas y los horarios del expediente.' : 'Guarda un cálculo nutricional para usar esta opción.'}
          disabled={!requirements?.calculos[0]}
          onPress={() => {
            const calculation = requirements?.calculos[0]
            if (calculation) begin(assistedPlan(requirements.expediente?.nutricion || {}, calculation.resultado.objetivoKcal))
          }} />
        <PlanModeOption icon="copy-outline" label="Duplicar último plan"
          description={previousPlans.length ? 'Empieza con una copia editable de las comidas y porciones.' : 'Disponible cuando el paciente tenga una dieta guardada.'}
          disabled={!previousPlans.length}
          onPress={() => {
            const previous = [...previousPlans].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
            if (previous) begin(duplicatePlan(previous))
          }} />
        <PlanModeOption icon="add-circle-outline" label="Desde cero"
          description="Crea el menú y elige tus propios ingredientes." onPress={() => begin(newPlan())} />
      </View>
      <Button selected={false} label="Cancelar" onPress={() => setModeOpen(false)} />
    </AppDialog>
    <AppDialog visible={confirmSave} title={planId ? 'Guardar cambios' : 'Guardar plan'} message={name + (draft.meals.some(meal => !meal.alimentos.length) ? "\n\nLas comidas nuevas sin ingredientes se omitirán y se redistribuirá su porcentaje entre las guardadas." : "")} onClose={() => setConfirmSave(false)}>
      <View style={styles.row}><Button expand selected={false} label="Cancelar" onPress={() => setConfirmSave(false)} />
        <Button expand label="Aceptar" onPress={() => { setConfirmSave(false); if (savePayload) void persist(savePayload); else setError(saveReason) }} /></View>
    </AppDialog>
    <AppDialog visible={savedOpen} title="¡Dieta creada!" success
      message="El plan del paciente se guardó correctamente. ¿Deseas guardar una copia reutilizable en Mis dietas?"
      onClose={() => setSavedOpen(false)}>
      <Button label="Guardar en Mis dietas" onPress={() => { setSavedOpen(false); setTemplateOpen(true) }} />
      <Button label="Ahora no" selected={false} onPress={() => setSavedOpen(false)} />
    </AppDialog>
    <AppDialog visible={templateOpen || savedTemplateName !== null}
      title={savedTemplateName !== null ? 'Guardada en Mis dietas' : 'Guardar en Mis dietas'}
      success={savedTemplateName !== null}
      message={savedTemplateName === null ? 'Elige un nombre para tu copia privada. La fecha se registra automáticamente.' : undefined}
      onClose={() => {
        if (templateBusy) return
        setTemplateOpen(false)
        setSavedTemplateName(null)
      }}>
      {savedTemplateName !== null ? <>
        <View style={[ds.inset, { alignItems: 'center' }]}>
          <Text style={[ds.label, { textAlign: 'center' }]}>{savedTemplateName}</Text>
          <Text style={[ds.caption, { textAlign: 'center' }]}>Copia privada en NutriA Community</Text>
        </View>
        <Button label="Ir a Mis dietas" onPress={() => {
          setSavedTemplateName(null)
          router.push({ pathname: '/comunidad', params: { tab: 'dietas' } })
        }} />
        <Button label="Seguir editando" selected={false} onPress={() => setSavedTemplateName(null)} />
      </> : <>
        <FormField label="Nombre de la dieta *" value={templateName} disabled={templateBusy}
          onChange={value => { setTemplateName(value); setTemplateError('') }} />
        {!!templateError && <Text accessibilityRole="alert" style={styles.error}>{templateError}</Text>}
        <Button label={templateBusy ? 'Guardando copia…' : 'Guardar copia privada'}
          disabled={templateBusy} onPress={() => void saveTemplate()} />
        <Button label="Cancelar" selected={false} disabled={templateBusy} onPress={() => setTemplateOpen(false)} />
      </>}
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
    }} onSelect={setActiveMeal} onAdd={() => setAddMealOpen(true)} onRemove={removeMeal} />
    <AppDialog visible={addMealOpen} title="Agregar tiempo de comida" message="Elige un tipo. Puedes cambiar su nombre y hora después." onClose={() => setAddMealOpen(false)}>
      {['Desayuno', 'Colación', 'Comida', 'Cena', 'Otra comida'].map(name => <Button key={name} label={name} selected={false} onPress={() => {
        const meal = { ...newMeal(name), percentage: '0', hora: ({ Desayuno: '08:00', Colación: '11:30', Comida: '14:30', Cena: '20:30' } as Record<string, string>)[name] || '' }
        change({ ...draft, meals: balanceMealDistribution([...draft.meals, meal], { key: meal.key, percent: 100 / (draft.meals.length + 1) }) }); setActiveMeal(meal.key); setAddMealOpen(false)
      }} />)}
    </AppDialog>
    {current && <MealEditor key={current.key} patient={patient} meal={current} index={draft.meals.findIndex(m => m.key === current.key)} target={target} busy={busy}
      onChange={meal => change({ ...draft, meals: draft.meals.map(item => item.key === meal.key ? meal : item) })}
      onRemove={() => removeMeal(current.key)} />}
    <AppDialog visible={!!error} title="Revisa los datos del plan" message={error} onClose={() => setError('')} />
    <View style={[ds.card, ds.body]}>
      <DietDisclosure label="Nombre del plan · opcional" open={nameOpen} disabled={busy} onPress={() => setNameOpen(!nameOpen)}>
        <Text style={ds.caption}>Nombre sugerido: {suggestedName}</Text>
        <FormField label="Nombre personalizado" value={draft.name} disabled={busy} onChange={name => change({ ...draft, name })} />
      </DietDisclosure>
      <Text style={ds.caption}>{name}</Text>
    </View>
    </Page>
    {!!saveReason && <View style={{ paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#fff4e7' }}>
      <Text accessibilityLiveRegion="polite" style={[ds.caption, { color: '#804619' }]}>{saveReason}</Text>
    </View>}
    <View style={[styles.row, { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#f7fcf8' }]}>
      <Button expand selected={false} disabled={busy} label="Cancelar" onPress={() => router.back()} />
      <Button expand disabled={busy} label={busy ? 'Guardando…' : planId ? 'Guardar cambios' : 'Guardar plan'} onPress={save} />
    </View>
    <PlanTracker draft={draft} reference={reference} active={activeMeal} disabled={busy || blocked} open={trackerOpen}
      onOpenChange={setTrackerOpen} onPercentageChange={changePercentage} onChange={change} />
  </View>
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
