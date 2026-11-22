import { Text, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { DietDisclosure } from './plans/dietUI'
import { useState } from 'react'
import { recordSections } from './recordSections'
export function RecordSectionFields({ form, disabled, onChange }: { form: Record<string,string>; disabled: boolean; onChange: (key: string,value: string) => void }) {
  const [open,setOpen] = useState<string | null>(null)
  return <>{recordSections.map(section => <DietDisclosure key={section.label} label={section.label} open={open === section.label} onPress={() => setOpen(open === section.label ? null : section.label)}>
    {section.fields.map(field => <View key={field.path} style={{gap:8}}>
      {field.type === 'boolean' || field.options ? <><Text style={styles.body}>{field.label}</Text><View style={styles.row}>
        {(field.type === 'boolean' ? [['','Sin especificar'],['true','Sí'],['false','No']] : field.type === 'multiple' ? field.options! : [['','Sin especificar'],...field.options!]).map(([value,label]) => <Button key={value} selected={field.type === 'multiple' ? (form[field.path] || '').split(',').includes(value) : form[field.path] === value} disabled={disabled} label={label} onPress={() => {
          if (field.type !== 'multiple') onChange(field.path,value)
          else { const selected = (form[field.path] || '').split(',').filter(Boolean); onChange(field.path,(selected.includes(value) ? selected.filter(v => v !== value) : [...selected,value]).join(',')) }
        }} />)}
      </View></> : field.type === 'time' ? <TimeField label={field.label} value={form[field.path] || ''} disabled={disabled} onChange={value => onChange(field.path,value)} /> :
      <FormField label={field.label} numeric={field.type === 'number'} multiline={field.type !== 'number'} value={form[field.path] || ''} disabled={disabled} onChange={value => onChange(field.path,value)} />}
    </View>)}
  </DietDisclosure>)}</>
}
