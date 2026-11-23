import { useState } from 'react'
import { AppDialog } from '@/shared/ui/AppDialog'
import { MealContent } from '../plans/MealContent'
import { exportPlan, loadClinicBrand } from '../plans/exportPlan'
import type { Plan } from '../plans/models'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { router, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import type { PlanData } from '../plans/models'

export default function ClinicPlansScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const { session } = useAuth()
  const [preview,setPreview] = useState<Plan | null>(null)
  const [remove,setRemove] = useState<Plan | null>(null)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  async function download(plan: Plan) { if (!session || busy) return; setBusy(true); setError(''); try { await exportPlan(plan,resource.data?.paciente.name || 'Paciente', await loadClinicBrand(session.token)) } catch(cause) { setError(cause instanceof Error ? cause.message : 'No se pudo exportar el plan.') } finally { setBusy(false) } }
  async function deletePlan() { if (busy || !remove || !session) return; setBusy(true); setError(''); try { await request('/planes/'+patient+'/'+remove._id,{token:session.token,method:'DELETE'}); setRemove(null); resource.reload() } catch(cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el plan.') } finally { setBusy(false) } }
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<PlanData>(valid ? '/planes/' + patient : null)
  if (!valid) return <Page>
    <Text style={styles.cardTitle}>Aún no tienes un paciente elegido.</Text>
    <Text style={styles.body}>Elige uno para crear o consultar su dieta.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'plan' } })} />
  </Page>
  return <Page bottomInset>
    <AppDialog visible={!!error} title="No se pudo completar la acción" message={error} onClose={() => setError('')} />
    <AppDialog visible={!!preview} title={preview?.nombre || 'Plan alimenticio'} onClose={() => setPreview(null)}>
      {preview && (preview.comidas?.length ? preview.comidas.map((meal,index) =>
        <View key={meal._id || index} style={styles.card}>
          <Text style={styles.cardTitle}>{[meal.nombre, meal.hora].filter(Boolean).join(' · ')}</Text>
          <MealContent meal={meal} />
        </View>) : <Text style={styles.body}>Este plan no tiene comidas registradas.</Text>)}
      <Button label="Volver" onPress={() => setPreview(null)} />
    </AppDialog>
    <AppDialog visible={!!remove} title="¿Eliminar este plan?" message={'Se eliminará '+(remove?.nombre || '')+' y sus seguimientos asociados. Esta acción no se puede deshacer.'} onClose={() => { if (!busy) setRemove(null) }}>
      <Button label={busy ? 'Eliminando…' : 'Sí, eliminar plan'} disabled={busy} onPress={() => void deletePlan()} /><Button label="Conservar plan" selected={false} disabled={busy} onPress={() => setRemove(null)} />
    </AppDialog>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <>
      <Text style={styles.title}>{resource.data.paciente.name}</Text>
      <Button label="Crear dieta" onPress={() => router.push({ pathname: '/dieta', params: { patient } })} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Planes alimenticios</Text>
      {!resource.data.planes.length && <Text style={styles.body}>Este paciente todavía no tiene dietas registradas.</Text>}
      {resource.data.planes.map(plan => <View key={plan._id} style={styles.card}>
        <Text style={styles.cardTitle}>{plan.nombre}</Text>
        <Text style={styles.body}>Desde {plan.fechaInicio.slice(0, 10)} · {plan.comidas.length} comidas</Text>
        <Text style={[styles.body, { fontSize: 13, fontWeight: '700',
          color: plan.aceptacionPaciente?.estado === 'aceptada' ? '#176344' : '#846d3e' }]}>
          {plan.aceptacionPaciente?.estado === 'aceptada'
            ? '✓ El paciente confirmó que recibió la dieta'
            : 'Pendiente de confirmación del paciente'}
        </Text>
        {plan.metaEnergiaKcal != null && <Text style={styles.body}>Meta: {plan.metaEnergiaKcal} kcal</Text>}
        {!!plan.objetivo && <Text style={styles.body}>{plan.objetivo}</Text>}
        <Button selected={false} label="Ver plan completo" disabled={busy} onPress={() => setPreview(plan)} />
        <View style={styles.row}><Button expand selected={false} label="PDF / compartir" disabled={busy} onPress={() => void download(plan)} /><Button expand selected={false} label="Eliminar plan" disabled={busy} onPress={() => setRemove(plan)} /></View>
        <Button label="Abrir y editar dieta" onPress={() => router.push({ pathname: '/dieta', params: { patient, id: plan._id } })} />
      </View>)}
    </>}
  </Page>
}
