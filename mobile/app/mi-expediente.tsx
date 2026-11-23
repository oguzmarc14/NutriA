import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { clinicalActive, clinicalFields } from '@/features/nutrition/clinicalRecordModel'
import { habitDetails, recordSections, recordText, type RecordField } from '@/features/nutrition/recordSections'

function recordValue(record: Record<string, unknown>, field: RecordField, active: string[]) {
  const raw = recordText(record, field.path)
  const parent = habitDetails[field.path]
  if (parent && recordText(record, parent) !== 'true') return null
  if (field.path === 'deporte.lugarOtro' && recordText(record, 'deporte.lugarEntrenamiento') !== 'otro') return null
  const objectives = recordText(record, 'nutricion.objetivos')
  if (field.path === 'nutricion.objetivoPrincipal' && objectives) return null
  if (field.path === 'nutricion.objetivoOtro' && !(objectives || recordText(record, 'nutricion.objetivoPrincipal')).split(',').includes('otro')) return null
  if (field.type === 'boolean') return raw === 'true' ? 'Sí' : 'No'
  if (field.options && raw) return raw.split(',').map(value => field.options?.find(([key]) => key === value)?.[1] || value).join(', ')
  return raw || (active.includes(field.path) ? 'Sí' : 'Sin especificar')
}
export default function MyRecord() {
  const resource = useResource<{ expediente: Record<string,unknown> | null }>('/mi-perfil')
  const record = resource.data?.expediente || null
  const active = clinicalActive(record)
  const sections = [
    { label: 'Antecedentes personales patológicos', fields: clinicalFields.filter(([path]) => path !== 'observaciones').map(([path, label]) => ({ path, label })) },
    ...recordSections,
    { label: 'Observaciones generales', fields: [{ path: 'observaciones', label: 'Observaciones' }] },
  ]
  return <Page bottomInset><Text style={styles.title}>Mi expediente</Text><Text style={styles.body}>Información registrada por tu profesional. Si necesitas corregirla, coméntalo durante tu consulta.</Text><ListState {...resource} />
    {resource.data && !record && <Text style={styles.body}>Aún no hay expediente registrado.</Text>}
    {record && sections.map(section => <View key={section.label} style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{section.label}</Text>
      {section.fields.map(field => {
        const text = recordValue(record, field, active)
        return text == null ? null : <View key={field.path} style={{gap:4}}>
          <Text style={{fontWeight:'700',color:'#173f34'}}>{field.label}</Text>
          <Text style={styles.body}>{text}</Text>
        </View>
      })}
    </View>)}
  </Page>
}
