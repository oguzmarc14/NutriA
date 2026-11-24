import { useEffect, useRef, useState } from 'react'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Linking, Pressable, Share, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'
import { Page, Button, colors, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { DateField, TimeField } from '@/shared/ui/DateTimeField'
import { ClosedDaysCalendar } from './ClosedDaysCalendar'
import { AppDialog } from '@/shared/ui/AppDialog'
import { ListState } from '@/shared/ui/ListState'
type Slot = {dia:number;inicio:string;fin:string}
type DateBlock = {fecha:string;inicio:string;fin:string}
type Work = {dias:number[];inicio:string;fin:string;zonaHoraria:string;diasNoLaborables?:{fecha:string;motivo:string}[]}
type Booking = {franjas:Slot[];publicado:boolean;anticipacionHoras:number;bloqueos?:Slot[];bloqueosPorFecha?:DateBlock[]}
const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const minutes = (time: string) => Number(time.slice(0,2))*60 + Number(time.slice(3))
const timeValue = (time: number) => String(Math.floor(time/60)).padStart(2,'0') + ':' + String(time%60).padStart(2,'0')
function emptyDays(work: Work, slots: Slot[]) {
  const start = Math.ceil(minutes(work.inicio)/30)*30
  const end = Math.floor(minutes(work.fin)/30)*30
  return end-start < 60 ? [] : work.dias.filter(dia => !slots.some(slot => slot.dia === dia))
    .map(dia => ({ dia, inicio: timeValue(start), fin: timeValue(end) }))
}
function bookingForDays(b: Booking | undefined, days: number[]): Booking {
  return { franjas: (b?.franjas || []).filter(f => days.includes(f.dia)), publicado: !!b?.publicado,
    anticipacionHoras: b?.anticipacionHoras ?? 2, bloqueos: (b?.bloqueos || []).filter(f => days.includes(f.dia)),
    bloqueosPorFecha: b?.bloqueosPorFecha || [] }
}
const scheduleSections = [
  { id: 'work', label: 'Jornada', icon: 'time-outline' },
  { id: 'closed', label: 'Días no laborables', icon: 'calendar-clear-outline' },
  { id: 'booking', label: 'Citas y bloqueos', icon: 'calendar-outline' },
] as const
export default function ScheduleScreen() {
  const {session}=useAuth(),resource=useResource<{horarioCitas:Booking;horarioLaboral:Work}>('/horario/citas')
  const [work,setWork]=useState<Work>({dias:[1,2,3,4,5],inicio:'09:00',fin:'18:00',zonaHoraria:'America/Mexico_City',diasNoLaborables:[]})
  const [booking,setBooking]=useState<Booking>({franjas:[],publicado:false,anticipacionHoras:2,bloqueos:[],bloqueosPorFecha:[]})
  const [baseline,setBaseline]=useState({work:'',booking:''}),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const [section,setSection]=useState<(typeof scheduleSections)[number]['id']>('work')
  const lock=useRef(false),loaded=useRef(false)
  const dirty=loaded.current&&(JSON.stringify(work)!==baseline.work||JSON.stringify(booking)!==baseline.booking)
  useUnsavedChanges(dirty,busy)
  useEffect(()=>{if(!resource.data||loaded.current)return
    const w=resource.data.horarioLaboral,b=resource.data.horarioCitas
    const nextW={dias:w?.dias||[1,2,3,4,5],inicio:w?.inicio||'09:00',fin:w?.fin||'18:00',zonaHoraria:w?.zonaHoraria||'America/Mexico_City',diasNoLaborables:w?.diasNoLaborables||[]}
    const nextB=bookingForDays(b,nextW.dias)
    setWork(nextW);setBooking(nextB);setBaseline({work:JSON.stringify(nextW),booking:JSON.stringify(nextB)});loaded.current=true
  },[resource.data])
  async function save(kind:'work'|'booking') {
    if(!session||lock.current)return
    if(kind==='work'&&(!work.dias.length||!work.inicio||work.fin<=work.inicio)){setError('Elige días laborales y un horario de inicio anterior al final.');return}
    if(kind==='booking'&&(!booking.franjas.length||!Number.isInteger(booking.anticipacionHoras)||booking.anticipacionHoras<0||booking.anticipacionHoras>72||[...booking.franjas,...booking.bloqueos||[],...booking.bloqueosPorFecha||[]].some(s=>!/^([01]\d|2[0-3]):(?:00|30)$/.test(s.inicio)||!/^([01]\d|2[0-3]):(?:00|30)$/.test(s.fin)||s.fin<=s.inicio))){setError('Agrega bloques válidos, con minutos 00 o 30. La anticipación debe ser de 0 a 72 horas.');return}
    lock.current=true;setBusy(true);setError('')
    try {
      const result = await request<{horarioCitas?: Booking}>(kind==='work'?'/horario':'/horario/citas',{
        token:session.token,method:'PUT',body:kind==='work'?work:booking,
      })
      setBaseline(prev=>({...prev,[kind]:JSON.stringify(kind==='work'?work:booking)}))
      if (kind==='work' && result.horarioCitas) {
        const next = bookingForDays(result.horarioCitas, work.dias)
        const previous = JSON.parse(baseline.booking) as Booking
        setBaseline({work:JSON.stringify(work),booking:JSON.stringify(next)})
        setBooking(JSON.stringify(booking)===baseline.booking ? next : {
          ...bookingForDays(booking, work.dias),
          franjas: [...booking.franjas.filter(f=>work.dias.includes(f.dia)),
            ...next.franjas.filter(f=>!previous.franjas.some(old=>old.dia===f.dia) && !booking.franjas.some(old=>old.dia===f.dia))].slice(0,21),
        })
      }
      setMessage(kind==='work'?'Jornada guardada. Puedes ajustar los bloques en Citas y bloqueos.':'Bloques y disponibilidad de citas guardados.')
    }
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el horario.')}
    finally{lock.current=false;setBusy(false)}
  }
  const published = Boolean(baseline.booking && (JSON.parse(baseline.booking) as Booking).publicado)
  const agendaUrl = session ? 'https://nutri-a-six.vercel.app/agenda/' + encodeURIComponent(session.user.id) : ''
  async function openSharedAgenda(share: boolean) {
    if (!published || !agendaUrl) return
    try {
      if (share) await Share.share({ message: 'Consulta los horarios de mi consultorio en NutriA: ' + agendaUrl })
      else await Linking.openURL(agendaUrl)
    } catch { setError('No se pudo abrir el enlace de la agenda.') }
  }

  function slotEditor(rows:Slot[],field:'franjas'|'bloqueos') {
    return <>{rows.map((slot,index)=><View key={index} style={styles.card}><View style={styles.row}>{days.map((label,dia)=>work.dias.includes(dia) && <Button key={dia} label={label} selected={slot.dia===dia} disabled={busy} onPress={()=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,dia}:row)})}/>)}</View>
      <TimeField halfHour label="Inicio del bloque" value={slot.inicio} disabled={busy} onChange={inicio=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,inicio}:row)})}/><TimeField halfHour label="Fin del bloque" value={slot.fin} disabled={busy} onChange={fin=>setBooking({...booking,[field]:rows.map((row,i)=>i===index?{...row,fin}:row)})}/><Button label="Quitar bloque" selected={false} disabled={busy} onPress={()=>setBooking({...booking,[field]:rows.filter((_,i)=>i!==index)})}/>
    </View>)}<Button label={field==='franjas'?'Agregar bloque de consulta':'Agregar bloqueo semanal'} selected={false} disabled={busy||rows.length>=(field==='franjas'?21:35)} onPress={()=>setBooking({...booking,[field]:[...rows,{dia:work.dias[0]??1,inicio:work.inicio,fin:work.fin}]})}/></>
  }
  return <Page bottomInset contentStyle={{ width: '100%', maxWidth: 700, alignSelf: 'center' }}>
    <View style={{gap:5}}>
      <Text accessibilityRole="header" style={styles.title}>Disponibilidad de la clínica</Text>
      <Text style={styles.body}>Configura tu jornada, vacaciones y los horarios que pueden reservar tus pacientes.</Text>
    </View>
    <ListState {...resource}/>
    {resource.data && <>
      <View accessibilityRole="tablist" style={{gap:6,padding:6,borderRadius:18,backgroundColor:'#edf6f0'}}>
        {scheduleSections.map(item => <Pressable key={item.id} accessibilityRole="tab"
          accessibilityState={{ selected: section === item.id, disabled: busy }} disabled={busy}
          onPress={() => setSection(item.id)} style={({pressed}) => [{
            minHeight:44,paddingHorizontal:12,gap:9,flexDirection:'row',alignItems:'center',borderRadius:12,
            backgroundColor:section===item.id ? colors.green : 'transparent',
          },pressed && styles.pressed]}>
          <Ionicons name={item.icon} size={19} color={section===item.id ? colors.white : colors.green}/>
          <Text style={{flex:1,fontWeight:'700',color:section===item.id ? colors.white : colors.ink}}>{item.label}</Text>
          {section===item.id && <Ionicons name="checkmark" size={18} color={colors.white}/>}
        </Pressable>)}
      </View>
      {section === 'work' && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Jornada semanal</Text>
        <Text style={styles.body}>Selecciona los días que trabajas y tu horario habitual.</Text>
        <View style={styles.row}>{days.map((label,dia)=><Button key={dia} label={label} selected={work.dias.includes(dia)} disabled={busy}
          onPress={()=>setWork({...work,dias:work.dias.includes(dia)?work.dias.filter(d=>d!==dia):[...work.dias,dia]})}/>)}</View>
        <TimeField label="Inicio de jornada" value={work.inicio} disabled={busy} onChange={inicio=>setWork({...work,inicio})}/>
        <TimeField label="Fin de jornada" value={work.fin} disabled={busy} onChange={fin=>setWork({...work,fin})}/>
        <FormField label="Zona horaria" value={work.zonaHoraria} disabled={busy} onChange={zonaHoraria=>setWork({...work,zonaHoraria})}/>
      </View>}
      {section === 'closed' && <ClosedDaysCalendar days={work.diasNoLaborables||[]} working={work.dias}
        disabled={busy} onChange={diasNoLaborables=>setWork({...work,diasNoLaborables})}/>}
      {section !== 'booking' && <Button label={busy?'Guardando…':'Guardar horario laboral'} disabled={busy||JSON.stringify(work)===baseline.work} onPress={()=>void save('work')}/>}
      {section === 'booking' && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Bloques de consulta</Text>
        <Text style={styles.body}>Cada bloque debe permitir consultas de 60 minutos y quedar dentro de la jornada guardada. Usa horas con minutos 00 o 30.</Text>
        {!!emptyDays(work,booking.franjas).length && <Button label="Usar jornada para días sin bloques" selected={false}
          disabled={busy || booking.franjas.length>=21}
          onPress={()=>setBooking({...booking,franjas:[...booking.franjas,...emptyDays(work,booking.franjas)].slice(0,21)})}/>}
        {slotEditor(booking.franjas,'franjas')}
      <Text style={styles.cardTitle}>Bloqueos semanales</Text>{slotEditor(booking.bloqueos||[],'bloqueos')}
      <Text style={styles.cardTitle}>Bloqueos por fecha</Text>{(booking.bloqueosPorFecha||[]).map((block,index)=><View key={index} style={{gap:8}}><DateField label="Fecha del bloqueo" value={block.fecha} disabled={busy} onChange={fecha=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,fecha}:b)})}/><TimeField halfHour label="Inicio del bloqueo" value={block.inicio} disabled={busy} onChange={inicio=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,inicio}:b)})}/><TimeField halfHour label="Fin del bloqueo" value={block.fin} disabled={busy} onChange={fin=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.map((b,i)=>i===index?{...b,fin}:b)})}/><Button label="Quitar bloqueo por fecha" selected={false} disabled={busy} onPress={()=>setBooking({...booking,bloqueosPorFecha:booking.bloqueosPorFecha!.filter((_,i)=>i!==index)})}/></View>)}
      <Button label="Agregar bloqueo por fecha" selected={false} disabled={busy||(booking.bloqueosPorFecha?.length||0)>=100} onPress={()=>setBooking({...booking,bloqueosPorFecha:[...booking.bloqueosPorFecha||[],{fecha:'',inicio:work.inicio,fin:work.fin}]})}/>
      <FormField label="Anticipación mínima (horas, 0 a 72)" numeric value={String(booking.anticipacionHoras)} disabled={busy} onChange={value=>setBooking({...booking,anticipacionHoras:Number(value)})}/><Button label={booking.publicado?'Agenda pública: activada':'Agenda pública: desactivada'} selected={booking.publicado} disabled={busy} onPress={()=>setBooking({...booking,publicado:!booking.publicado})}/><Text style={styles.body}>La agenda pública solo cambia al guardar esta configuración.</Text><Button label={busy?'Guardando…':'Guardar bloques de citas'} disabled={busy||JSON.stringify(booking)===baseline.booking} onPress={()=>void save('booking')}/>
    </View>}
    {section === 'booking' && <>
      {published && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Agenda para pacientes</Text>
        <Text style={styles.body}>Comparte tus horarios disponibles por WhatsApp, correo u otra aplicación.</Text>
        <Button label="Compartir agenda" onPress={() => void openSharedAgenda(true)} />
        <Button label="Ver agenda pública" selected={false} onPress={() => void openSharedAgenda(false)} />
      </View>}
      <Button label="Configurar pagos de la agenda" selected={false} onPress={() => router.push('/configurar-pagos')} />
    </>}
    </>}
    <AppDialog visible={!!error} title="Revisa los horarios" message={error} onClose={()=>setError('')}/><AppDialog visible={!!message} success title="Horario guardado" message={message} onClose={()=>setMessage('')}/>
  </Page>
}
