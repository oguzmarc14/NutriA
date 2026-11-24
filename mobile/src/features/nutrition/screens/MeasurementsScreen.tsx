import { showNotice } from '@/shared/ui/NoticeDialog'
import { DateField } from '@/shared/ui/DateTimeField'
import { MeasurementChart } from '@/features/progress/MeasurementChart'
import { MeasurementComparison } from '@/features/progress/MeasurementComparison'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { ListState } from '@/shared/ui/ListState'
import { clinicalDate, localDate, measurementDate, measurementDay, numberInput, type Measurement } from '../clinicalModels'

const fields = [
  ['edad', 'Edad (años)'], ['peso', 'Peso (kg)'], ['estatura', 'Estatura (metros)'],
  ['nivelActividadFisica', 'Nivel de actividad física (1 a 5)'],
  ['grasaCorporal', 'Grasa corporal (%) · opcional'], ['grasaVisceral', 'Grasa visceral · opcional'],
  ['masaMuscular', 'Masa muscular (kg) · opcional'], ['masaOsea', 'Masa ósea (kg) · opcional'],
  ['proteina', 'Proteína (%) · opcional'],
] as const
const blank = () => Object.fromEntries(fields.map(([key]) => [key, key === 'nivelActividadFisica' ? '1' : ''])) as Record<string, string>

export default function Measurements() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<{ paciente: { name: string }; mediciones: Measurement[] }>(valid ? '/mediciones/' + patient : null)
  const { session } = useAuth()
  const [form, setForm] = useState(blank)
  const [date, setDate] = useState(localDate())
  const [editing, setEditing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function reset() { setForm(blank()); setDate(localDate()); setEditing(null); setError('') }
  async function save() {
    if (busy || !valid || !session) return
    const values = Object.fromEntries(fields.map(([key], index) => [key, index > 3 && !form[key].trim() ? undefined : numberInput(form[key])]))
    const fecha = measurementDate(date)
    const { edad, peso, estatura, nivelActividadFisica: activity } = values
    if (!fecha || !Number.isInteger(edad) || edad! < 1 || edad! > 120 || !Number.isFinite(peso) || peso! <= 0 ||
      !Number.isFinite(estatura) || estatura! < 0.5 || estatura! > 3 || !Number.isInteger(activity) || activity! < 1 || activity! > 5 ||
      fields.slice(4).some(([key]) => values[key] !== undefined && (!Number.isFinite(values[key]) || values[key]! < 0 ||
        (['grasaCorporal', 'proteina'].includes(key) && values[key]! > 100)))) {
      setError('Revisa los valores y la fecha. Usa estatura en metros, edad entera de 1 a 120 y actividad de 1 a 5.'); return
    }
    setBusy(true); setError('')
    try {
      await request('/mediciones/' + patient + (editing ? '/' + editing : ''), {
        token: session.token, method: editing ? 'PUT' : 'POST', body: { ...values, fecha },
      })
      reset(); resource.reload()
      showNotice('Medición guardada', 'Los datos se guardaron correctamente.', [{ text: 'Aceptar' }])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la medición.') }
    finally { setBusy(false) }
  }
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para registrar mediciones.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace('/pacientes')} /></Page>
  return <Page key={editing ?? 'new'} bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <>
      <Text style={styles.title}>{resource.data.paciente.name}</Text>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>{editing ? 'Editar medición' : 'Nueva medición'}</Text>
        <DateField label="Fecha de medición" value={date} onChange={setDate} disabled={busy} />
        {fields.map(([key, label]) => <FormField key={key} numeric label={label} value={form[key]}
          disabled={busy} onChange={value => setForm(previous => ({ ...previous, [key]: value }))} />)}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Button disabled={busy} label={busy ? 'Guardando…' : 'Guardar medición'} onPress={() => void save()} />
        {editing && <Button disabled={busy} selected={false} label="Cancelar edición" onPress={reset} />}
      </View>
      <MeasurementChart measurements={resource.data.mediciones} />
      <MeasurementComparison measurements={resource.data.mediciones} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Historial de mediciones</Text>
      {!resource.data.mediciones.length && <Text style={styles.body}>Aún no hay mediciones registradas.</Text>}
      {resource.data.mediciones.map(item => <View key={item._id} style={styles.card}>
        <Text style={styles.cardTitle}>{clinicalDate.format(new Date(item.fecha))}</Text>
        <Text style={styles.body}>{item.peso} kg · {item.estatura} m · IMC {item.imc ?? '—'}</Text>
        <Button disabled={busy} selected={false} label="Editar medición" onPress={() => {
          setEditing(item._id); setDate(measurementDay(item.fecha)); setError('')
          setForm(Object.fromEntries(fields.map(([key]) => [key, item[key] == null ? '' : String(item[key])])))
        }} />
      </View>)}
    </>}
  </Page>
}
