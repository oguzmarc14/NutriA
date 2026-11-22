import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { clinicalFields } from '@/features/nutrition/clinicalRecordModel'
import { recordSections, recordText } from '@/features/nutrition/recordSections'
export default function MyRecord() {
  const resource = useResource<{ expediente: Record<string,unknown> | null }>('/mi-perfil')
  const record = resource.data?.expediente || null
  return <Page bottomInset><Text style={styles.title}>Mi expediente</Text><Text style={styles.body}>Información registrada por tu profesional. Si necesitas corregirla, coméntalo durante tu consulta.</Text><ListState {...resource} />
    {resource.data && !record && <Text style={styles.body}>Aún no hay expediente registrado.</Text>}
    {record && [{label:'Antecedentes',fields:clinicalFields.map(([path,label])=>({path,label}))},...recordSections].map(section => <View key={section.label} style={styles.card}><Text style={styles.cardTitle}>{section.label}</Text>
      {section.fields.map(field => { const raw=recordText(record,field.path); const text=raw === 'true' ? 'Sí' : raw === 'false' ? 'No' : raw || 'Sin especificar'; return <View key={field.path} style={{gap:4}}><Text style={{fontWeight:'700',color:'#173f34'}}>{field.label}</Text><Text style={styles.body}>{text}</Text></View> })}</View>)}
  </Page>
}
