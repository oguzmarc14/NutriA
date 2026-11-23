import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { DateField } from '@/shared/ui/DateTimeField'
import { FormField } from '@/shared/ui/FormField'
import { addClosedDays,calendarDays,localToday,shiftCalendar,validDay,type CalendarView,type ClosedDay } from './workCalendar'
const weekdays=['L','M','M','J','V','S','D']
const label=(day:string)=>new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))
export function ClosedDaysCalendar({days,working,onChange,disabled}:{days:ClosedDay[];working:number[];onChange:(days:ClosedDay[])=>void;disabled:boolean}){
  const [view,setView]=useState<CalendarView>('Mes')
  const [selected,setSelected]=useState(localToday)
  const [end,setEnd]=useState('')
  const [reason,setReason]=useState('')
  const [error,setError]=useState('')
  const closed=new Map(days.map(item=>[item.fecha,item]))
  const selectedClosed=closed.get(selected)
  const shown=calendarDays(selected,view)
  function add(){
    try {onChange(addClosedDays(days,selected,end||selected,reason));setError('');setEnd('');setReason('')}
    catch(cause){setError(cause instanceof Error?cause.message:'Verifica las fechas.')}
  }
  return <View style={[styles.card,{backgroundColor:'#eff7f1',borderWidth:1,borderColor:'#c9dfd0',gap:12}]}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Calendario de días no laborables</Text>
    <Text style={[styles.body,{fontSize:13}]}>Marca descansos o vacaciones por día, semana o mes. Los bloqueos impiden nuevas citas al guardar; las citas existentes NO se cancelan automáticamente.</Text>
    <View style={styles.row}>{(['Día','Semana','Mes'] as const).map(mode=>
      <Button key={mode} label={mode} selected={view===mode} disabled={disabled} onPress={()=>setView(mode)}/>)}</View>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Anterior" disabled={disabled}
        onPress={()=>setSelected(day=>shiftCalendar(day,view,-1))} style={{padding:10,minHeight:44}}>
        <Ionicons name="chevron-back" color={colors.green} size={22}/>
      </Pressable>
      <Text style={{flex:1,textAlign:'center',fontWeight:'800',color:colors.ink}}>{validDay(selected)?label(selected):'Elige fecha'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Siguiente" disabled={disabled}
        onPress={()=>setSelected(day=>shiftCalendar(day,view,1))} style={{padding:10,minHeight:44}}>
        <Ionicons name="chevron-forward" color={colors.green} size={22}/>
      </Pressable>
    </View>
    {view==='Mes' && <View style={{flexDirection:'row',gap:3}}>{weekdays.map((d,i)=><Text key={i} style={{flex:1,textAlign:'center',fontWeight:'700',color:colors.muted}}>{d}</Text>)}</View>}
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:3}}>
      {shown.map(day=>{
        const blocked=closed.has(day),workingDay=working.includes(new Date(day+'T12:00:00Z').getUTCDay())
        const current=day===selected
        return <Pressable key={day} accessibilityRole="button" accessibilityState={{selected:current}}
          accessibilityLabel={label(day)+(blocked?' cerrado':workingDay?' laboral':' descanso habitual')}
          disabled={disabled}
          onPress={()=>{setSelected(day);setEnd('');setReason(closed.get(day)?.motivo||'');setError('')}}
          style={{width:view==='Día'?'100%':'13.3%',minHeight:view==='Día'?62:46,borderRadius:10,
            backgroundColor:blocked?'#f7e0d7':current?'#d4ebdb':workingDay?'#fff':'#e9eeea',
            borderWidth:current?2:1,borderColor:current?colors.green:'#d9e5db',
            justifyContent:'center',alignItems:'center',gap:2,opacity:view==='Mes'&&day.slice(0,7)!==selected.slice(0,7)?0.55:1}}>
          <Text style={{fontWeight:blocked||current?'900':'600',color:blocked?'#974833':colors.ink}}>{Number(day.slice(8))}</Text>
          <Ionicons name={blocked?'close-circle':workingDay?'ellipse':'remove-outline'} size={11}
            color={blocked?'#974833':workingDay?'#6ca885':'#9daf9e'}/>
        </Pressable>
      })}
    </View>
    <Text style={[styles.body,{fontSize:12}]}>Verde: laboral · Rojo: bloqueado · Gris: descanso habitual</Text>
    <DateField label="Día seleccionado" value={selected} disabled={disabled}
      onChange={day=>{if(validDay(day)){setSelected(day);setEnd('');setError('')}else setError('Fecha inválida')}}/>
    <DateField label="Hasta (opcional, para varios días)" value={end} disabled={disabled} onChange={setEnd}/>
    <FormField label="Motivo del cierre (opcional)" value={reason} disabled={disabled} onChange={setReason}/>
    {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!selectedClosed&&<Text style={[styles.body,{fontSize:13}]}>Cerrado: {selectedClosed.motivo||'Sin motivo'}</Text>}
    <Button disabled={disabled} label={selectedClosed?'Actualizar motivo o fechas':'Bloquear día o rango'} onPress={add}/>
    {!!selectedClosed&&<Button selected={false} disabled={disabled} label="Habilitar nuevamente este día"
      onPress={()=>onChange(days.filter(item=>item.fecha!==selected))}/>}
    <Text style={[styles.body,{fontSize:12}]}>{days.length} fechas marcadas. Usa Guardar horario laboral para aplicar cambios.</Text>
    {days.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,8).map(item=>
      <Pressable key={item.fecha} accessibilityRole="button" onPress={()=>setSelected(item.fecha)}
        style={{padding:8,backgroundColor:'#fff',borderRadius:10,minHeight:40}}>
        <Text style={{color:colors.ink}}>{item.fecha} · {item.motivo||'Sin motivo'}</Text>
      </Pressable>)}
    {days.length>8&&<Text style={[styles.body,{fontSize:12}]}>Explora otras fechas desde el calendario.</Text>}
  </View>
}
