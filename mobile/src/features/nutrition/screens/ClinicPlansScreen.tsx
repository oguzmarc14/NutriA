import { router, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import type { PlanData } from '../plans/models'

export default function ClinicPlansScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<PlanData>(valid ? '/planes/' + patient : null)
  if (!valid) return <Page>
    <Text style={styles.cardTitle}>Aún no tienes un paciente elegido.</Text>
    <Text style={styles.body}>Elige uno para crear o consultar su dieta.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace({ pathname: '/elegir-paciente', params: { intent: 'plan' } })} />
  </Page>
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <>
      <Text style={styles.title}>{resource.data.paciente.name}</Text>
      <Button label="Crear dieta" onPress={() => router.push({ pathname: '/dieta', params: { patient } })} />
      <Button selected={false} label="Actualizar planes" onPress={resource.reload} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Planes alimenticios</Text>
      {!resource.data.planes.length && <Text style={styles.body}>Este paciente todavía no tiene dietas registradas.</Text>}
      {resource.data.planes.map(plan => <View key={plan._id} style={styles.card}>
        <Text style={styles.cardTitle}>{plan.nombre}</Text>
        <Text style={styles.body}>Desde {plan.fechaInicio.slice(0, 10)} · {plan.comidas.length} comidas</Text>
        {plan.metaEnergiaKcal != null && <Text style={styles.body}>Meta: {plan.metaEnergiaKcal} kcal</Text>}
        {!!plan.objetivo && <Text style={styles.body}>{plan.objetivo}</Text>}
        <Button label="Abrir y editar dieta" onPress={() => router.push({ pathname: '/dieta', params: { patient, id: plan._id } })} />
      </View>)}
    </>}
  </Page>
}
