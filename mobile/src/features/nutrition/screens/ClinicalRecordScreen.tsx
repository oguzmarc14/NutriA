import { RecordSectionFields } from '../RecordSectionFields'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { ListState } from '@/shared/ui/ListState'

import { clinicalFields as fields, clinicalForm, clinicalUpdate } from '../clinicalRecordModel'

type RecordData = { paciente: { name: string }; expediente: Record<string, unknown> | null }
function RecordForm({ patient, initial }: { patient: string; initial: Record<string, unknown> | null }) {
  const { session } = useAuth()
  const [base, setBase] = useState(initial)
  const [form, setForm] = useState(() => clinicalForm(initial))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useUnsavedChanges(dirty, busy)
  async function save() {
    if (busy || !session) return
    setBusy(true); setError('')
    try {
      const body = clinicalUpdate(base, form)
      const result = await request<{ expediente: Record<string, unknown> }>('/expedientes/' + patient, {
        token: session.token, method: 'PUT', body,
      })
      setBase(result.expediente); setForm(clinicalForm(result.expediente)); setDirty(false)
      Alert.alert('Expediente guardado', 'Los datos clínicos se guardaron correctamente. Puedes regresar a la dieta.', [{ text: 'Aceptar' }])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el expediente.') }
    finally { setBusy(false) }
  }
  return <View style={[styles.card, { gap: 12 }]}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Datos clínicos principales</Text>
    <Text style={styles.body}>Registra antecedentes, tratamientos, hábitos, nutrición y deporte. Las secciones que no modifiques conservarán sus datos.</Text>
    {fields.map(([key, label]) => <FormField key={key} multiline disabled={busy} label={label} value={form[key]}
      onChange={value => { setForm(previous => ({ ...previous, [key]: value })); setDirty(true) }} />)}
    <RecordSectionFields form={form} disabled={busy} onChange={(key,value) => { setForm(previous => ({ ...previous,[key]:value })); setDirty(true) }} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button disabled={busy || !dirty} label={busy ? 'Guardando…' : 'Guardar expediente'} onPress={() => void save()} />
  </View>
}
export default function ClinicalRecordScreen() {
  const { patient } = useLocalSearchParams<{ patient?: string }>()
  const valid = typeof patient === 'string' && /^[a-f\d]{24}$/i.test(patient)
  const resource = useResource<RecordData>(valid ? '/expedientes/' + patient : null)
  if (!valid) return <Page><Text style={styles.cardTitle}>Elige un paciente para abrir su expediente.</Text><Button label="Elegir paciente" onPress={() => router.replace('/pacientes')} /></Page>
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <><Text style={styles.title}>{resource.data.paciente.name}</Text><RecordForm key={patient} patient={patient!} initial={resource.data.expediente} /></>}
  </Page>
}
