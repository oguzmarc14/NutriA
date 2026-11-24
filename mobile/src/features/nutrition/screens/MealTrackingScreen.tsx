import { showNotice } from '@/shared/ui/NoticeDialog'
import { useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Text, TextInput, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { localDate } from '../clinicalModels'
import { activePlan, findTracking, ratings, states, trackingPayload, validDay, type TrackingPlan, type TrackingRecord } from '../tracking/models'

type Meal = { _id: string; nombre: string; platillo?: string }
type PatientPlan = Omit<TrackingPlan, 'comidas'> & { comidas: Meal[] }
type Profile = { planes: PatientPlan[]; seguimientosComida: TrackingRecord[] }
function TrackingForm({ plan, meal, date, record }: { plan: PatientPlan; meal: Meal; date: string; record?: TrackingRecord }) {
  const { session } = useAuth()
  const [state, setState] = useState<string>(record?.estado || '')
  const [rating, setRating] = useState<string>(record?.agrado || '')
  const [comment, setComment] = useState(record?.comentario || '')
  const [saved, setSaved] = useState(record ? `${record.estado}|${record.agrado}|${record.comentario || ''}` : '||')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const dirty = `${state}|${rating}|${comment}` !== saved
  useUnsavedChanges(dirty, busy)
  async function save() {
    if (!session || submitting.current) return
    try {
      if (date > localDate()) throw new Error('Puedes consultar días futuros, pero registrar únicamente hoy o días anteriores.')
      const body = trackingPayload(plan, meal._id, date, state, rating, comment)
      submitting.current = true; setBusy(true); setError('')
      const result = await request<{ registro: TrackingRecord }>('/seguimiento-comidas/mi-registro', { token: session.token, body })
      setState(result.registro.estado); setRating(result.registro.agrado); setComment(result.registro.comentario || '')
      setSaved(`${result.registro.estado}|${result.registro.agrado}|${result.registro.comentario || ''}`)
      showNotice('Seguimiento guardado', 'Tu registro quedó guardado para el día ' + date + '.', [{ text: 'Aceptar' }])
    } catch (cause) { setError((cause instanceof Error ? cause.message : 'No se pudo guardar.') + ' Tus cambios siguen en esta pantalla.') }
    finally { submitting.current = false; setBusy(false) }
  }
  return <>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{meal.nombre}</Text>
      {!!meal.platillo && <Text style={styles.body}>{meal.platillo}</Text>}
      <Text style={styles.body}>{date} · {plan.nombre}</Text>
    </View>
    {date > localDate() && <Text style={styles.body}>El registro se habilita cuando llegue el día seleccionado.</Text>}
    <Text style={styles.cardTitle}>¿Cómo consumiste esta comida?</Text>
    {Object.entries(states).map(([value, label]) => <Button key={value} label={label} disabled={busy} selected={state === value} onPress={() => setState(value)} />)}
    <Text style={styles.cardTitle}>¿Qué te pareció?</Text>
    {Object.entries(ratings).map(([value, label]) => <Button key={value} label={label} disabled={busy} selected={rating === value} onPress={() => setRating(value)} />)}
    <Text style={styles.body}>Comentario opcional · {comment.length}/500</Text>
    <TextInput accessibilityLabel="Comentario sobre la comida" multiline maxLength={500} editable={!busy} value={comment} onChangeText={setComment}
      style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button label={busy ? 'Guardando…' : 'Guardar seguimiento'} disabled={busy || !dirty || !state || !rating || date > localDate()} onPress={() => void save()} />
    <Button selected={false} disabled={busy} label="Volver a mi plan" onPress={() => router.canGoBack() ? router.back() : router.replace('/mi-plan')} />
  </>
}
export default function MealTrackingScreen() {
  const { plan: planId, meal: mealId, date } = useLocalSearchParams<{ plan?: string; meal?: string; date?: string }>()
  const valid = typeof planId === 'string' && /^[a-f\d]{24}$/i.test(planId) && typeof mealId === 'string' && /^[a-f\d]{24}$/i.test(mealId) && typeof date === 'string' && validDay(date)
  const resource = useResource<Profile>(valid ? '/mi-perfil' : null)
  const plan = resource.data && date ? activePlan(resource.data.planes, date) : undefined
  const meal = plan && plan._id === planId ? plan.comidas.find(item => item._id === mealId) : undefined
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {(!valid || resource.data && !meal) && <><Text style={styles.error}>La dieta o la comida ya no está disponible para esta fecha.</Text><Button label="Abrir Mi plan" onPress={() => router.replace('/mi-plan')} /></>}
    {plan && meal && date && <TrackingForm key={`${plan._id}-${meal._id}-${date}`} plan={plan} meal={meal} date={date}
      record={findTracking(resource.data!.seguimientosComida || [], plan._id, meal._id, date)} />}
  </Page>
}
