import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { DietDisclosure } from './plans/dietUI'
import { habitDetails, recordSections } from './recordSections'
import { optionalNutritionFields } from './clinicalRecordModel'

export function YesNoDetail({label,value,checked,onChange,onToggle,disabled}:{
  label:string;value:string;checked:boolean;onChange:(value:string)=>void;onToggle:(yes:boolean)=>void;disabled:boolean
}) {
  return <View style={{gap:8,padding:12,backgroundColor:'#f5faf6',borderRadius:16,borderWidth:1,borderColor:'#d8e7dc'}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
    <Ionicons name="clipboard-outline" size={17} color={colors.green} />
    <Text style={[styles.body,{flex:1,fontSize:14,fontWeight:'700',color:colors.ink}]}>{label}</Text>
    <View style={{flexDirection:'row',backgroundColor:'#e8f0eb',borderRadius:12,padding:2}}>
      {([false,true] as const).map(yes=><Pressable key={String(yes)}
        accessibilityRole="button" accessibilityLabel={label+': '+(yes?'Sí':'No')}
        accessibilityState={{selected:checked===yes,disabled}}
        disabled={disabled} onPress={()=>onToggle(yes)}
        style={{minHeight:44,minWidth:44,borderRadius:10,alignItems:'center',justifyContent:'center',
          backgroundColor:checked===yes?(yes?colors.green:'white'):'transparent'}}>
        <Text style={{fontWeight:checked===yes?'800':'500',color:checked===yes?(yes?'white':colors.ink):colors.muted}}>{yes?'Sí':'No'}</Text>
      </Pressable>)}
    </View>
    </View>
    {checked&&<FormField label={'Detalles de '+label.toLowerCase()+' (opcional)'} multiline
      value={value} onChange={onChange} disabled={disabled}/>}
  </View>
}

const optional=new Set<string>(optionalNutritionFields)

export function RecordSectionFields({form,active,disabled,onChange,onToggle}:{
  form:Record<string,string>;active:readonly string[];disabled:boolean;
  onChange:(key:string,value:string)=>void;onToggle:(key:string,yes:boolean)=>void
}){
  const [collapsed,setCollapsed]=useState<string[]>([])
  return <>{recordSections.map(section=><View key={section.label} style={{backgroundColor:'#fff',borderRadius:20,padding:14,
    borderWidth:1,borderColor:'#cfe0d5'}}>
    <DietDisclosure label={section.label} open={!collapsed.includes(section.label)}
      onPress={()=>setCollapsed(previous=>previous.includes(section.label)
        ? previous.filter(label=>label!==section.label) : [...previous,section.label])} disabled={disabled}>
      <View style={{gap:15}}>
        {section.fields.map(field=>{
          const name=field.path
          if(name==='nutricion.objetivoPrincipal')return null // se calcula del primer objetivo elegido
          if(habitDetails[name])return null
          const detail=section.fields.find(item=>habitDetails[item.path]===name)
          if(detail)return <YesNoDetail key={name} label={field.label} checked={form[name]==='true'}
            value={form[detail.path]||''} disabled={disabled}
            onChange={value=>onChange(detail.path,value)} onToggle={yes=>{
              onChange(name,String(yes))
              if(!yes)onChange(detail.path,'')
            }}/>
          if(name==='deporte.lugarOtro'&&form['deporte.lugarEntrenamiento']!=='otro')return null
          if(name==='nutricion.objetivoOtro'&&!(form['nutricion.objetivos']||'').split(',').includes('otro'))return null
          if(optional.has(name))return <YesNoDetail key={name} label={field.label} checked={active.includes(name)}
            value={form[name]||''} onChange={value=>onChange(name,value)} onToggle={yes=>onToggle(name,yes)} disabled={disabled}/>
          if(field.type==='boolean'||field.options)return <View key={name} style={{gap:8}}>
            <Text style={[styles.body,{fontSize:14,fontWeight:'700',color:colors.ink}]}>{field.label}</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {(field.type==='boolean'
                ? [['true','Sí'],['false','No']] as const
                : field.type==='multiple'
                  ? field.options!
                  : [['','Sin especificar'],...field.options!] as readonly (readonly [string,string])[])
                .map(([value,label])=>{
                  const selected=field.type==='multiple'?(form[name]||'').split(',').includes(value):form[name]===value
                  return <Pressable key={value} accessibilityRole="button" accessibilityState={{selected,disabled}}
                    accessibilityLabel={field.label+': '+label} disabled={disabled}
                    onPress={()=>{
                      if(field.type!=='multiple'){
                        onChange(name,value)
                        if(name==='deporte.lugarEntrenamiento'&&value!=='otro')onChange('deporte.lugarOtro','')
                      }else{
                        const previous=(form[name]||'').split(',').filter(Boolean)
                        const next=previous.includes(value)?previous.filter(x=>x!==value):[...previous,value]
                        onChange(name,next.join(','))
                        onChange('nutricion.objetivoPrincipal',next[0]||'')
                        if(!next.includes('otro'))onChange('nutricion.objetivoOtro','')
                      }
                    }}
                    style={{minHeight:44,paddingHorizontal:14,paddingVertical:11,borderRadius:13,
                      borderWidth:1,borderColor:selected?colors.green:colors.border,
                      backgroundColor:selected?colors.green:'#f4f9f5',justifyContent:'center'}}>
                    <Text style={{fontSize:13,fontWeight:'700',color:selected?'white':colors.ink}}>{label}</Text>
                  </Pressable>
                })}
            </View>
            {name==='deporte.nivelExperiencia'&&<Text style={[styles.body,{fontSize:12}]}>
              Principiante: sin experiencia · Principiante-intermedio: 1–5 meses · Intermedio: 6–24 meses · Avanzado: más de 24 meses.
            </Text>}
          </View>
          return <View key={name}>
            {field.type==='time'
              ? <TimeField label={field.label} value={form[name]||''} onChange={value=>onChange(name,value)} disabled={disabled}/>
              : <FormField label={field.label} numeric={field.type==='number'}
                  multiline={field.type!=='number'} value={form[name]||''} onChange={value=>onChange(name,value)} disabled={disabled}/>}
          </View>
        })}
      </View>
    </DietDisclosure>
  </View>)}</>
}
