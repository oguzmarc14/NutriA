import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, Page, colors, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { ListState } from '@/shared/ui/ListState'
import { calculationEstimate, clinicalDay } from '../calculationEstimate'
import { clinicalTime, measurementChanged, numberInput, type Measurement, type Calculation } from '../clinicalModels'

type Data = {
  paciente: { name: string; sex?: 'male' | 'female' }
  mediciones: Measurement[]
  calculos: Calculation[]
}
type Form = { factorActividad: string; ajusteKcal: string; carbohidratos: string; proteinas: string; grasas: string }
const defaults: Form = { factorActividad: '1.4', ajusteKcal: '0', carbohidratos: '50', proteinas: '20', grasas: '30' }
const fields: [keyof Form, string][] = [
  ['factorActividad', 'Factor de actividad (1 a 2.5)'],
  ['ajusteKcal', 'Ajuste de energía (−1000 a +1000 kcal)'],
  ['carbohidratos', 'Carbohidratos (%)'],
  ['proteinas', 'Proteínas (%)'],
  ['grasas', 'Grasas (%)'],
]

export default function CalculationScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<Data>(valid ? '/calculo-nutricional/' + patient : null)
  const { session } = useAuth()
  const initializedFor = useRef<string | null>(null)
  const [measurementId, setMeasurementId] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [form, setForm] = useState<Form>(defaults)
  const [notes, setNotes] = useState('')
  const [measurementsOpen, setMeasurementsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!resource.data || !patient || initializedFor.current === patient) return
    initializedFor.current = patient
    const latest = resource.data.calculos[0]
    const recent = resource.data.mediciones
    const matching = latest && recent.some(item => item._id === latest.medicion)
    setMeasurementId(matching ? latest.medicion : recent[0]?._id || '')
    setSex(latest?.sexoCalculo || resource.data.paciente.sex || null)
    setForm({
      factorActividad: String(latest?.factorActividad ?? defaults.factorActividad),
      ajusteKcal: String(latest?.ajusteKcal ?? defaults.ajusteKcal),
      carbohidratos: String(latest?.porcentajes?.carbohidratos ?? defaults.carbohidratos),
      proteinas: String(latest?.porcentajes?.proteinas ?? defaults.proteinas),
      grasas: String(latest?.porcentajes?.grasas ?? defaults.grasas),
    })
    setNotes(latest?.observaciones || '')
  }, [resource.data, patient])

  const measurement = resource.data?.mediciones.find(item => item._id === measurementId)
  const values = {
    factorActividad: numberInput(form.factorActividad),
    ajusteKcal: numberInput(form.ajusteKcal),
    carbohidratos: numberInput(form.carbohidratos),
    proteinas: numberInput(form.proteinas),
    grasas: numberInput(form.grasas),
  }
  const estimated = calculationEstimate({
    measurement, sex, factor: values.factorActividad, adjustment: values.ajusteKcal,
    carbs: values.carbohidratos, protein: values.proteinas, fats: values.grasas,
  })
  const sum = [values.carbohidratos, values.proteinas, values.grasas].reduce((total, n) => total + n, 0)

  async function save() {
    if (busy || !session || !valid) return
    if (!measurement || !sex || !estimated || notes.length > 1000) {
      setError('Selecciona una medición de adulto, sexo y parámetros válidos. Los macronutrientes deben sumar 100%.')
      return
    }
    setBusy(true); setError('')
    try {
      await request('/calculo-nutricional/' + patient, {
        token: session.token,
        body: {
          medicionId: measurement._id, sexoCalculo: sex,
          factorActividad: values.factorActividad, ajusteKcal: values.ajusteKcal,
          porcentajes: { carbohidratos: values.carbohidratos, proteinas: values.proteinas, grasas: values.grasas },
          observaciones: notes.trim(),
        },
      })
      resource.reload()
      Alert.alert('Cálculo guardado', 'Se guardó el cálculo con la medición seleccionada y su fecha.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el cálculo.')
    } finally { setBusy(false) }
  }
  if (!valid) return <Page>
    <Text style={styles.cardTitle}>Elige un paciente para realizar el cálculo nutricional.</Text>
    <Button label="Elegir paciente" onPress={() => router.replace('/pacientes')} />
  </Page>

  return <Page bottomInset>
    <View style={local.heading}>
      <Text style={local.eyebrow}>EVALUACIÓN NUTRICIONAL</Text>
      <Text accessibilityRole="header" style={local.title}>Cálculo nutricional</Text>
      <Text style={local.caption}>{resource.data?.paciente.name || 'Cargando paciente…'}</Text>
    </View>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />

    {resource.data && <>
      {!!resource.data.calculos.length && <View style={local.notice}>
        <Ionicons name="checkmark-circle-outline" size={20} color={colors.green} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={local.noticeTitle}>Último cálculo guardado</Text>
          <Text style={local.caption}>{resource.data.calculos[0].resultado.objetivoKcal} kcal/día ·
            {clinicalTime.format(new Date(resource.data.calculos[0].createdAt))}</Text>
          <Text style={local.caption}>Los parámetros del último cálculo se recuperaron para que puedas ajustarlos.</Text>
        </View>
      </View>}
      <View style={local.card}>
        <Text style={local.section}>1. Medición de referencia</Text>
        {!resource.data.mediciones.length && <Button label="Registrar medición"
          onPress={() => router.push({ pathname: '/mediciones', params: { patient } })} />}
        {measurement && <View style={local.selection}>
          <Text style={local.selectionTitle}>Medición · {clinicalDay(measurement.fecha)}</Text>
          <View style={local.measureGrid}>
            <Text style={local.measureText}>Peso: {measurement.peso} kg</Text>
            <Text style={local.measureText}>Estatura: {(measurement.estatura * 100).toFixed(1)} cm</Text>
            <Text style={local.measureText}>Edad: {measurement.edad} años</Text>
            <Text style={local.measureText}>Actividad: nivel {measurement.nivelActividadFisica}</Text>
          </View>
          <Pressable accessibilityRole="button" disabled={busy}
            onPress={() => setMeasurementsOpen(open => !open)} style={local.link}>
            <Text style={local.linkText}>{measurementsOpen ? 'Ocultar mediciones' : 'Cambiar medición'}</Text>
            <Ionicons name={measurementsOpen ? 'chevron-up' : 'chevron-down'} color={colors.green} size={18} />
          </Pressable>
        </View>}
        {!measurement && resource.data.mediciones.length > 0 &&
          <Button label="Seleccionar medición" selected={false} onPress={() => setMeasurementsOpen(true)} />}
        {measurementsOpen && resource.data.mediciones.map(item =>
          <Pressable key={item._id} disabled={busy || item.edad < 18}
            accessibilityRole="button" accessibilityState={{ selected: item._id === measurementId }}
            onPress={() => { setMeasurementId(item._id); setMeasurementsOpen(false) }}
            style={[local.measureOption, item._id === measurementId && local.selectedOption,
              item.edad < 18 && styles.disabled]}>
            <Ionicons name={item._id === measurementId ? 'radio-button-on' : 'radio-button-off'}
              color={colors.green} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={local.optionTitle}>{clinicalDay(item.fecha)}</Text>
              <Text style={local.caption}>{item.peso} kg · {item.edad} años</Text>
            </View>
          </Pressable>)}
        {measurement && measurement.edad < 18 &&
          <Text accessibilityRole="alert" style={styles.error}>La fórmula de esta versión es para adultos (18+).</Text>}
      </View>

      <View style={local.card}>
        <Text style={local.section}>2. Parámetros del cálculo</Text>
        <Text style={local.label}>Sexo utilizado por Mifflin-St Jeor</Text>
        <View style={styles.row}>
          <Button expand disabled={busy} selected={sex === 'female'} label="Femenino" onPress={() => setSex('female')} />
          <Button expand disabled={busy} selected={sex === 'male'} label="Masculino" onPress={() => setSex('male')} />
        </View>
        {fields.map(([key, label]) => <FormField key={key} numeric label={label}
          value={form[key]} disabled={busy}
          onChange={value => setForm(previous => ({ ...previous, [key]: value }))} />)}
        <Text style={[local.caption, { textAlign: 'right', fontWeight: '700' }]}>
          Distribución total: {Number.isFinite(sum) ? sum.toFixed(1) : '—'}% / 100%
        </Text>
        <FormField label="Observaciones" multiline value={notes} onChange={setNotes} disabled={busy} />
      </View>

      <View style={local.card}>
        <Text style={local.section}>3. Resultados estimados</Text>
        <Text style={local.caption}>Vista previa de Mifflin-St Jeor antes de guardar.</Text>
        {estimated ? <>
          <View style={local.results}>
            {([
              ['Metabolismo basal',estimated.basal,'kcal'],
              ['Gasto total',estimated.gasto,'kcal'],
              ['Objetivo diario',estimated.objetivo,'kcal'],
            ] as const).map(([label, value, unit]) => <View key={label} style={local.result}>
              <Text style={local.caption}>{label}</Text>
              <Text style={local.resultValue}>{value} <Text style={local.unit}>{unit}</Text></Text>
            </View>)}
          </View>
          <View style={local.macros}>
            <Text style={local.macro}>Carbohidratos: {estimated.carbohidratos} g</Text>
            <Text style={local.macro}>Proteínas: {estimated.proteinas} g</Text>
            <Text style={local.macro}>Grasas: {estimated.grasas} g</Text>
          </View>
        </> : <Text style={local.hint}>
          Selecciona una medición de adulto, sexo y parámetros válidos para consultar los resultados.
        </Text>}
        <Text style={local.caption}>Los resultados son estimaciones que requieren valoración profesional.</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button disabled={busy || !estimated} label={busy ? 'Guardando…' : 'Guardar cálculo'}
        onPress={() => void save()} />

      <View style={local.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: historyOpen }}
          onPress={() => setHistoryOpen(open => !open)} style={local.historyButton}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={local.section}>Ver anteriores</Text>
            <Text style={local.caption}>{resource.data.calculos.length} cálculos guardados</Text>
          </View>
          <Ionicons name={historyOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.green} />
        </Pressable>
        {historyOpen && (!resource.data.calculos.length ?
          <Text style={local.caption}>Todavía no hay cálculos guardados.</Text> :
          resource.data.calculos.map(item => {
            const newer = measurementChanged(item, resource.data!.mediciones)
            return <View key={item._id} style={local.historyEntry}>
              <Text style={local.optionTitle}>{item.resultado.objetivoKcal} kcal/día · Borrador</Text>
              <Text style={local.caption}>Guardado: {clinicalTime.format(new Date(item.createdAt))}</Text>
              <Text style={local.caption}>Medición: {clinicalDay(item.fechaMedicion)} · {item.peso} kg</Text>
              <Text style={local.caption}>Basal: {item.resultado.metabolismoBasal} kcal ·
                Gasto: {item.resultado.gastoTotal} kcal</Text>
              <Text style={local.caption}>Carbs: {item.resultado.carbohidratosGramos} g ·
                Proteína: {item.resultado.proteinasGramos} g · Grasas: {item.resultado.grasasGramos} g</Text>
              {newer && <Text style={[local.caption, { color: '#a06d27' }]}>
                Hay mediciones posteriores o modificadas.</Text>}
              {!!item.observaciones && <Text style={local.caption}>{item.observaciones}</Text>}
            </View>
          }))}
      </View>
    </>}
  </Page>
}
const local = StyleSheet.create({
  heading: { gap: 3 }, eyebrow: { fontSize: 10, fontWeight: '800', color: colors.green, letterSpacing: 1.3 },
  title: { fontSize: 27, fontWeight: '800', color: colors.ink },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  notice: { backgroundColor: '#eaf5ec', borderRadius: 17, padding: 13, flexDirection: 'row', gap: 10 },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  card: { backgroundColor: '#fbfdfb', borderWidth: 1, borderColor: '#d0e3d7', borderRadius: 21, padding: 16, gap: 12 },
  section: { fontSize: 17, fontWeight: '800', color: colors.ink },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  selection: { backgroundColor: '#e9f3eb', borderRadius: 16, padding: 14, gap: 9 },
  selectionTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  measureText: { color: '#416f56', fontWeight: '700', fontSize: 12, width: '48%' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 7 },
  linkText: { fontSize: 13, color: colors.green, fontWeight: '800' },
  measureOption: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 11, backgroundColor: '#f3f8f4', borderRadius: 13 },
  selectedOption: { borderWidth: 1, borderColor: '#5f9b76' },
  optionTitle: { fontSize: 13, fontWeight: '800', color: colors.ink },
  results: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  result: { width: '47%', flexGrow: 1, backgroundColor: '#edf6ee', borderRadius: 14, padding: 12, gap: 7 },
  resultValue: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  unit: { fontSize: 11, color: colors.muted },
  macros: { backgroundColor: '#e6f3e9', borderRadius: 14, padding: 12, gap: 5 },
  macro: { fontSize: 13, fontWeight: '700', color: '#286a4e' },
  hint: { backgroundColor: '#f3f7f3', borderRadius: 12, padding: 16, color: colors.muted, lineHeight: 20 },
  historyButton: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  historyEntry: { borderTopWidth: 1, borderColor: '#d6e7da', paddingTop: 13, gap: 5 },
})
