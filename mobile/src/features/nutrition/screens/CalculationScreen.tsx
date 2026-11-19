import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { ListState } from '@/shared/ui/ListState'
import { clinicalDate, clinicalTime, measurementChanged, numberInput, type Measurement, type Calculation } from '../clinicalModels'

type Data = { paciente: { name: string }; mediciones: Measurement[]; calculos: Calculation[] }
const fields = [
  ['factorActividad', 'Factor de actividad (1 a 2.5)'], ['ajusteKcal', 'Ajuste de energía (−1000 a +1000 kcal)'],
  ['carbohidratos', 'Carbohidratos (%)'], ['proteinas', 'Proteínas (%)'], ['grasas', 'Grasas (%)'],
] as const

export default function CalculationScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<Data>(valid ? '/calculo-nutricional/' + patient : null)
  const { session } = useAuth()
  const [measurementId, setMeasurementId] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [form, setForm] = useState<Record<string, string>>({ factorActividad: '', ajusteKcal: '0', carbohidratos: '', proteinas: '', grasas: '' })
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const measurement = resource.data?.mediciones.find(item => item._id === measurementId)
  async function save() {
    if (busy || !session || !valid) return
    const values = Object.fromEntries(fields.map(([key]) => [key, numberInput(form[key])]))
    const total = values.carbohidratos + values.proteinas + values.grasas
    if (!measurement || measurement.edad < 18 || !sex || fields.some(([key]) => !Number.isFinite(values[key])) ||
      values.factorActividad < 1 || values.factorActividad > 2.5 || Math.abs(values.ajusteKcal) > 1000 ||
      ['carbohidratos', 'proteinas', 'grasas'].some(key => values[key] < 0 || values[key] > 100) ||
      Math.abs(total - 100) > 0.001 || notes.length > 1000) {
      setError('Selecciona una medición de un adulto y el sexo para la fórmula. Completa los parámetros; los macronutrientes deben sumar 100%.'); return
    }
    setBusy(true); setError('')
    try {
      await request('/calculo-nutricional/' + patient, { token: session.token, body: {
        medicionId: measurement._id, sexoCalculo: sex, factorActividad: values.factorActividad,
        ajusteKcal: values.ajusteKcal,
        porcentajes: { carbohidratos: values.carbohidratos, proteinas: values.proteinas, grasas: values.grasas },
        observaciones: notes.trim(),
      } })
      resource.reload()
      Alert.alert('Cálculo guardado', 'El borrador se guardó con la medición utilizada y su fecha.', [{ text: 'Aceptar' }])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el cálculo.') }
    finally { setBusy(false) }
  }
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para realizar el cálculo nutricional.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace('/pacientes')} /></Page>
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <>
      <Text style={styles.title}>{resource.data.paciente.name}</Text>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Nuevo cálculo · Mifflin-St Jeor</Text>
        <Text style={styles.body}>Selecciona la medición. Esta versión del motor admite pacientes de 18 años o más.</Text>
        {!resource.data.mediciones.length && <Button label="Registrar medición" onPress={() => router.push({ pathname: '/mediciones', params: { patient } })} />}
        {resource.data.mediciones.map(item => <Button key={item._id} disabled={busy || item.edad < 18}
          selected={measurementId === item._id}
          label={`${clinicalDate.format(new Date(item.fecha))} · ${item.peso} kg · ${item.edad} años`}
          onPress={() => setMeasurementId(item._id)} />)}
        <Text style={styles.body}>Sexo utilizado por la fórmula</Text>
        <View style={styles.row}>
          <Button expand disabled={busy} selected={sex === 'female'} label="Femenino" onPress={() => setSex('female')} />
          <Button expand disabled={busy} selected={sex === 'male'} label="Masculino" onPress={() => setSex('male')} />
        </View>
        {fields.map(([key, label]) => <FormField key={key} numeric label={label} value={form[key]} disabled={busy}
          onChange={value => setForm(previous => ({ ...previous, [key]: value }))} />)}
        <FormField label="Observaciones (máximo 1000 caracteres)" multiline value={notes} onChange={setNotes} disabled={busy} />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Button disabled={busy || !measurement} label={busy ? 'Guardando…' : 'Calcular y guardar borrador'} onPress={() => void save()} />
      </View>
      <Text accessibilityRole="header" style={styles.cardTitle}>Historial de cálculos</Text>
      {!resource.data.calculos.length && <Text style={styles.body}>Aún no hay cálculos guardados.</Text>}
      {resource.data.calculos.map(item => {
        const newer = measurementChanged(item, resource.data!.mediciones)
        return <View key={item._id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.resultado.objetivoKcal} kcal · Borrador</Text>
          <Text style={styles.body}>Creado: {clinicalTime.format(new Date(item.createdAt))}</Text>
          <Text style={styles.body}>Medición: {item.fechaMedicion ? clinicalDate.format(new Date(item.fechaMedicion)) : 'Fecha no disponible'} · {item.peso} kg · {item.estaturaCm} cm · {item.edad} años</Text>
          {newer && <Text accessibilityRole="alert" style={styles.error}>Hay mediciones nuevas o modificadas. Crea otro cálculo para utilizar los datos actuales.</Text>}
          <Text style={styles.body}>Basal: {item.resultado.metabolismoBasal} kcal · Gasto total: {item.resultado.gastoTotal} kcal</Text>
          <Text style={styles.body}>Carbohidratos: {item.resultado.carbohidratosGramos} g · Proteínas: {item.resultado.proteinasGramos} g · Grasas: {item.resultado.grasasGramos} g</Text>
          {!!item.observaciones && <Text style={styles.body}>{item.observaciones}</Text>}
        </View>
      })}
    </>}
  </Page>
}
