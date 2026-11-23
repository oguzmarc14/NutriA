import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { DietDisclosure } from './plans/dietUI'
import { recordSections } from './recordSections'
import { optionalNutritionFields } from './clinicalRecordModel'

export function YesNoDetail({label,value,checked,onChange,onToggle,disabled}:{
  label:string;value:string;checked:boolean;onChange:(value:string)=>void;onToggle:(yes:boolean)=>void;disabled:boolean
}) {
  return <View style={{gap:8,padding:12,backgroundColor:'#f5faf6',borderRadius:16,borderWidth:1,borderColor:'#d8e7dc'}}>
    <Text style={[styles.body,{fontSize:14,fontWeight:'700',color:colors.ink}]}>{label}</Text>
    <View style={{flexDirection:'row',gap:8}}>
      {([false,true] as const).map(yes=><Pressable key={String(yes)}
        accessibilityRole="button" accessibilityLabel={label+': '+(yes?'Sí':'No')}
        accessibilityState={{selected:checked===yes,disabled}}
        disabled={disabled} onPress={()=>onToggle(yes)}
        style={{minHeight:44,flex:1,borderRadius:12,alignItems:'center',justifyContent:'center',
          borderWidth:1,borderColor:checked===yes?colors.green:'#cadaD1',
          backgroundColor:checked===yes?colors.green:'#fff'}}>
        <Text style={{fontWeight:'800',color:checked===yes?'white':colors.green}}>{yes?'Sí':'No'}</Text>
      </Pressable>)}
    </View>
    {checked&&<FormField label={'Detalles de '+label.toLowerCase()+' (opcional)'} multiline
      value={value} onChange={onChange} disabled={disabled}/>}
  </View>
}

const optionDetails:Record<string,string>={
  'tratamientoFarmacologico.descripcion':'tratamientoFarmacologico.usa',
  'tabaquismo.frecuenciaSemanal':'tabaquismo.fuma',
  'alcohol.frecuencia':'alcohol.consume',
  'drogas.descripcion':'drogas.consume',
  'anabolicos.descripcion':'anabolicos.consume',
  'suplementos.descripcion':'suplementos.consume',
}
const optional=new Set<string>(optionalNutritionFields)

export function RecordSectionFields({form,active,disabled,onChange,onToggle}:{
  form:Record<string,string>;active:readonly string[];disabled:boolean;
  onChange:(key:string,value:string)=>void;onToggle:(key:string,yes:boolean)=>void
}){
  const [open,setOpen]=useState<string|null>('Nutrición y objetivos')
  return <>{recordSections.map(section=><View key={section.label} style={{backgroundColor:'#fff',borderRadius:20,padding:14,
    borderWidth:1,borderColor:'#cfe0d5'}}>
    <DietDisclosure label={section.label} open={open===section.label}
      onPress={()=>setOpen(open===section.label?null:section.label)} disabled={disabled}>
      <View style={{gap:15}}>
        {section.fields.map(field=>{
          const name=field.path
          if(name==='nutricion.objetivoPrincipal')return null // se calcula del primer objetivo elegido
          if(optionDetails[name] && form[optionDetails[name]]!=='true')return null
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
                        if(field.type==='boolean'&&value==='false'){
                          const dependent=Object.entries(optionDetails).find(([_,parent])=>parent===name)?.[0]
                          if(dependent)onChange(dependent,'')
                        }
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
