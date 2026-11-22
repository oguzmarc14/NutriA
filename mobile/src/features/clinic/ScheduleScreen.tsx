import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { Page, Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { DateField, TimeField } from '@/shared/ui/DateTimeField'
import { AppDialog } from '@/shared/ui/AppDialog'
import { ListState } from '@/shared/ui/ListState'
type Slot = {dia:number;inicio:string;fin:string}
type DateBlock = {fecha:string;inicio:string;fin:string}
type Work = {dias:number[];inicio:string;fin:string;zonaHoraria:string;diasNoLaborables?:{fecha:string;motivo:string}[]}
type Booking = {franjas:Slot[];publicado:boolean;anticipacionHoras:number;bloqueos?:Slot[];bloqueosPorFecha?:DateBlock[]}
const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
export default function ScheduleScreen() {
  const {session}=useAuth(),resource=useResource<{horarioCitas:Booking;horarioLaboral:Work}>('/horario/citas')
  const [work,setWork]=useState<Work>({dias:[1,2,3,4,5],inicio:'09:00',fin:'18:00',zonaHoraria:'America/Mexico_City',diasNoLaborables:[]})
  const [booking,setBooking]=useState<Booking>({franjas:[],publicado:false,anticipacionHoras:2,bloqueos:[],bloqueosPorFecha:[]})
  const [baseline,setBaseline]=useState({work:'',booking:''}),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const lock=useRef(false),loaded=useRef(false)
  const dirty=loaded.current&&(JSON.stringify(work)!==baseline.work||JSON.stringify(booking)!==baseline.booking)
  useUnsavedChanges(dirty,busy)
  useEffect(()=>{if(!resource.data||loaded.current)return
    const w=resource.data.horarioLaboral,b=resource.data.horarioCitas
    const nextW={dias:w?.dias||[1,2,3,4,5],inicio:w?.inicio||'09:00',fin:w?.fin||'18:00',zonaHoraria:w?.zonaHoraria||'America/Mexico_City',diasNoLaborables:w?.diasNoLaborables||[]}
    const nextB={franjas:b?.franjas||[],publicado:!!b?.publicado,anticipacionHoras:b?.anticipacionHoras??2,bloqueos:b?.bloqueos||[],bloqueosPorFecha:b?.bloqueosPorFecha||[]}
    setWork(nextW);setBooking(nextB);setBaseline({work:JSON.stringify(nextW),booking:JSON.stringify(nextB)});loaded.current=true
  },[resource.data])
  async function save(kind:'work'|'booking') {
    if(!session||lock.current)return
    if(kind==='work'&&(!work.dias.length||!work.inicio||work.fin<=work.inicio)){setError('Elige días laborales y un horario de inicio anterior al final.');return}
    if(kind==='booking'&&(!booking.franjas.length||!Number.isInteger(booking.anticipacionHoras)||booking.anticipacionHoras<0||booking.anticipacionHoras>72||[...booking.franjas,...booking.bloqueos||[],...booking.bloqueosPorFecha||[]].some(s=>!/^([01]\d|2[0-3]):(?:00|30)$/.test(s.inicio)||!/^([01]\d|2[0-3]):(?:00|30)$/.test(s.fin)||s.fin<=s.inicio))){setError('Agrega bloques válidos, con minutos 00 o 30. La anticipación debe ser de 0 a 72 horas.');return}
    lock.current=true;setBusy(true);setError('')
    try{await request(kind==='work'?'/horario':'/horario/citas',{token:session.token,method:'PUT',body:kind==='work'?work:booking});setBaseline(prev=>({...prev,[kind]:JSON.stringify(kind==='work'?work:booking)}));setMessage(kind==='work'?'Horario laboral guardado. Revisa que los bloques de citas queden dentro de este horario.':'Bloques y disponibilidad de citas guardados.')}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el horario.')}
    finally{lock.current=false;setBusy(false)}
  }
  function slotEditor(rows:Slot[],field:'franjas'|'bloqueos') {
    return <>{rows.map((slot,index)=><View key={index} style={styles.card}><View style={styles.row}>{days.map((label,dia)=><Button key={dia} label={label} selected={slot.dia===dia} disabled={busy} onPress={()=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,dia}:row)})}/>)}</View>
      <TimeField label="Inicio del bloque" value={slot.inicio} disabled={busy} onChange={inicio=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,inicio}:row)})}/><TimeField label="Fin del bloque" value={slot.fin} disabled={busy} onChange={fin=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,fin}:row)})}/><Button label="Quitar bloque" selected={false} disabled={busy} onPress={()=>setBooking({...booking,[field]:rows.filter((_,i)=>i!==index)})}/>
    </View>)}<Button label={field==='franjas'?'Agregar bloque de consulta':'Agregar bloqueo semanal'} selected={false} disabled={busy||rows.length>=(field==='franjas'?21:35)} onPress={()=>setBooking({...booking,[field]:[...rows,{dia:work.dias[0]||1,inicio:work.inicio,fin:work.fin}]})}/></>
  }
  return <Page bottomInset><Text style={styles.title}>Horarios y disponibilidad</Text><ListState {...resource}/>
    {resource.data&&<><View style={styles.card}><Text style={styles.cardTitle}>Horario laboral</Text><View style={styles.row}>{days.map((label,dia)=><Button key={dia} label={label} selected={work.dias.includes(dia)} disabled={busy} onPress={()=>setWork({...work,dias:work.dias.includes(dia)?work.dias.filter(d=>d!==dia):[...work.dias,dia]})}/>)}</View>
      <TimeField label="Inicio de jornada" value={work.inicio} disabled={busy} onChange={inicio=>setWork({...work,inicio})}/><TimeField label="Fin de jornada" value={work.fin} disabled={busy} onChange={fin=>setWork({...work,fin})}/><FormField label="Zona horaria" value={work.zonaHoraria} disabled={busy} onChange={zonaHoraria=>setWork({...work,zonaHoraria})}/>
      <Text style={styles.cardTitle}>Días no laborables</Text>{(work.diasNoLaborables||[]).map((day,index)=><View key={index} style={{gap:8}}><DateField label="Fecha no laborable" value={day.fecha} disabled={busy} onChange={fecha=>setWork({...work,diasNoLaborables:work.diasNoLaborables!.map((d,i)=>i===index?{...d,fecha}:d)})}/><FormField label="Motivo (máximo 80 caracteres)" value={day.motivo} disabled={busy} onChange={motivo=>setWork({...work,diasNoLaborables:work.diasNoLaborables!.map((d,i)=>i===index?{...d,motivo}:d)})}/><Button label="Quitar día" selected={false} disabled={busy} onPress={()=>setWork({...work,diasNoLaborables:work.diasNoLaborables!.filter((_,i)=>i!==index)})}/></View>)}
      <Button label="Agregar día no laborable" selected={false} disabled={busy||(work.diasNoLaborables?.length||0)>=100} onPress={()=>setWork({...work,diasNoLaborables:[...work.diasNoLaborables||[],{fecha:'',motivo:''}]})}/><Button label={busy?'Guardando…':'Guardar horario laboral'} disabled={busy||JSON.stringify(work)===baseline.work} onPress={()=>void save('work')}/>
    </View><View style={styles.card}><Text style={styles.cardTitle}>Bloques de consulta</Text><Text style={styles.body}>Cada bloque debe permitir consultas de 60 minutos y quedar dentro del horario laboral guardado. Usa horas con minutos 00 o 30.</Text>{slotEditor(booking.franjas,'franjas')}
      <Text style={styles.cardTitle}>Bloqueos semanales</Text>{slotEditor(booking.bloqueos||[],'bloqueos')}
      <Text style={styles.cardTitle}>Bloqueos por fecha</Text>{(booking.bloqueosPorFecha||[]).map((block,index)=><View key={index} style={{gap:8}}><DateField label="Fecha del bloqueo" value={block.fecha} disabled={busy} onChange={fecha=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,fecha}:b)})}/><TimeField label="Inicio del bloqueo" value={block.inicio} disabled={busy} onChange={inicio=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,inicio}:b)})}/><TimeField label="Fin del bloqueo" value={block.fin} disabled={busy} onChange={fin=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,fin}:b)})}/><Button label="Quitar bloqueo por fecha" selected={false} disabled={busy} onPress={()=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.filter((_,i)=>i!==index)})}/></View>)}
      <Button label="Agregar bloqueo por fecha" selected={false} disabled={busy||(booking.bloqueosPorFecha?.length||0)>=100} onPress={()=>setBooking({...booking,bloqueosPorFecha:[...booking.bloqueosPorFecha||[],{fecha:'',inicio:work.inicio,fin:work.fin}]})}/>
      <FormField label="Anticipación mínima (horas, 0 a 72)" numeric value={String(booking.anticipacionHoras)} disabled={busy} onChange={value=>setBooking({...booking,anticipacionHoras:Number(value)})}/><Button label={booking.publicado?'Agenda pública: activada':'Agenda pública: desactivada'} selected={booking.publicado} disabled={busy} onPress={()=>setBooking({...booking,publicado:!booking.publicado})}/><Text style={styles.body}>La agenda pública solo cambia al guardar esta configuración.</Text><Button label={busy?'Guardando…':'Guardar bloques de citas'} disabled={busy||JSON.stringify(booking)===baseline.booking} onPress={()=>void save('booking')}/>
    </View></>}
    <AppDialog visible={!!error} title="Revisa los horarios" message={error} onClose={()=>setError('')}/><AppDialog visible={!!message} success title="Horario guardado" message={message} onClose={()=>setMessage('')}/>
  </Page>
}
