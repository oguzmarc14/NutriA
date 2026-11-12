import { useEffect, useMemo, useState } from 'react'
import { Ban, CalendarClock, CalendarOff, Check, Copy, Eye, EyeOff, Plus, Save, Share2, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/auth'
import client from '../../api/client'
import './agenda.css'

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const toMin = v => Number(v.slice(0,2))*60 + Number(v.slice(3,5))
const toHour = n => String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0')
const vacio = {franjas:[],bloqueos:[],bloqueosPorFecha:[],publicado:false,anticipacionHoras:2}
const inicioBloqueo = {fecha:'',inicio:'12:00',fin:'13:00',motivo:''}

function plantilla(horario) {
  if(!horario?.configurado)return []
  const ini=Math.ceil(toMin(horario.inicio)/30)*30
  const fin=Math.floor(toMin(horario.fin)/30)*30
  if(fin-ini < 60)return []
  return horario.dias.map(dia => ({dia,inicio:toHour(ini),fin:toHour(fin)}))
}

function rangoValido(inicio,fin,laboral) {
  return inicio < fin && inicio>=laboral.inicio && fin<=laboral.fin &&
    /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(inicio) &&
    /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(fin)
}

export default function ConfiguracionCitas({ onSave }) {
  const {user} = useAuth()
  const [cargando,setCargando]=useState(true)
  const [guardando,setGuardando]=useState(false)
  const [laboral,setLaboral]=useState(null)
  const [form,setForm]=useState(vacio)
  const [bloqueoFecha,setBloqueoFecha]=useState(inicioBloqueo)
  const [error,setError]=useState('')
  const [exito,setExito]=useState('')
  const [guardado,setGuardado]=useState(false)
  const [publicadoGuardado,setPublicadoGuardado]=useState(false)
  const [copiado,setCopiado]=useState(false)

  useEffect(()=>{
    let vivo=true
    client.get('/horario/citas').then(({data})=>{
      if(!vivo)return
      setLaboral(data.horarioLaboral)
      const existente=data.horarioCitas
      setGuardado(Boolean(existente?.configurado))
      setPublicadoGuardado(Boolean(existente?.publicado))
      setForm({
        franjas:existente?.configurado ? (existente.franjas || []).map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})) : plantilla(data.horarioLaboral),
        bloqueos:(existente?.bloqueos || []).map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})),
        bloqueosPorFecha:(existente?.bloqueosPorFecha || []).map(f=>({fecha:f.fecha,inicio:f.inicio,fin:f.fin,motivo:f.motivo || ''})),
        publicado:Boolean(existente?.publicado),
        anticipacionHoras:existente?.anticipacionHoras ?? 2,
      })
    }).catch(e=>{if(vivo)setError(e.response?.data?.message||'No se pudieron cargar los horarios de consulta.')})
      .finally(()=>{if(vivo)setCargando(false)})
    return ()=>{vivo=false}
  },[])

  const enlace = window.location.origin + '/agenda/' + (user.id || user._id)
  const diasLaborales = useMemo(()=>laboral?.dias || [],[laboral])
  const bloquesPorDia = dia => form.franjas.filter(f=>f.dia===dia)
  const bloqueosPorDia = dia => form.bloqueos.filter(f=>f.dia===dia)
  function activarDia(dia) {
    if (bloquesPorDia(dia).length) {
      setForm(f=>({...f,franjas:f.franjas.filter(b=>b.dia!==dia)}))
    } else {
      const base=plantilla(laboral).find(x=>x.dia===dia)
      if(base)setForm(f=>({...f,franjas:[...f.franjas,base]}))
    }
    setExito('')
  }

  function editar(dia,index,campo,valor,coleccion='franjas') {
    let ordinal=0
    setForm(f=>({...f,[coleccion]:f[coleccion].map(fr=>{
      if(fr.dia!==dia)return fr
      if(ordinal++!==index)return fr
      return {...fr,[campo]:valor}
    })}))
    setExito('')
  }

  function quitarBloque(dia,index,coleccion='franjas') {
    let ordinal=0
    setForm(f=>({...f,[coleccion]:f[coleccion].filter(fr=>fr.dia!==dia || ordinal++!==index)}))
    setExito('')
  }

  function agregarBloque(dia) {
    const franjas=bloquesPorDia(dia)
    const final=toMin(laboral.fin)
    const ultimo=franjas.length ? Math.max(...franjas.map(fr=>toMin(fr.fin))) : Math.ceil(toMin(laboral.inicio)/30)*30
    const comienzo=Math.ceil(ultimo/30)*30
    if(comienzo+60>final){setError('Reduce el bloque anterior para dejar espacio a un horario adicional.');return}
    setForm(f=>({...f,franjas:[...f.franjas,{dia,inicio:toHour(comienzo),fin:toHour(Math.min(comienzo+60,final))}]}))
    setError('');setExito('')
  }

  function agregarBloqueoSemanal(dia) {
    if(form.bloqueos.length>=35){setError('Máximo 35 horas bloqueadas semanales.');return}
    const inicio=Math.ceil(toMin(laboral.inicio)/30)*30
    const fin=Math.floor(toMin(laboral.fin)/30)*30
    const existentes=bloqueosPorDia(dia)
    for(let t=inicio;t+30<=fin;t+=30) {
      const libre=!existentes.some(x=>t<toMin(x.fin)&&t+30>toMin(x.inicio))
      if(libre){
        setForm(f=>({...f,bloqueos:[...f.bloqueos,{dia,inicio:toHour(t),fin:toHour(Math.min(t+60,fin))}]}))
        setError('');setExito('')
        return
      }
    }
    setError('Ya no hay horas libres que puedas bloquear en este día.')
  }

  function agregarFechaBloqueada() {
    setError('');setExito('')
    const fecha=bloqueoFecha.fecha
    const fechavalida=/^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
      Number.isFinite(new Date(fecha+'T12:00:00Z').getTime()) &&
      new Date(fecha+'T12:00:00Z').toISOString().slice(0,10)===fecha
    if(!fechavalida){setError('Selecciona una fecha válida.');return}
    if(!rangoValido(bloqueoFecha.inicio,bloqueoFecha.fin,laboral)) {
      setError('La hora bloqueada debe quedar dentro de la jornada y tener inicio anterior al fin.');return
    }
    if(form.bloqueosPorFecha.length>=100){setError('Máximo 100 bloqueos por fecha.');return}
    const solapado=form.bloqueosPorFecha.some(x=>x.fecha===fecha &&
      bloqueoFecha.inicio<x.fin && bloqueoFecha.fin>x.inicio)
    if(solapado){setError('Ya tienes una hora bloqueada que se superpone en esa fecha.');return}
    setForm(f=>({...f,bloqueosPorFecha:[
      ...f.bloqueosPorFecha,{...bloqueoFecha,motivo:bloqueoFecha.motivo.trim().slice(0,80)},
    ].sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.inicio.localeCompare(b.inicio))}))
    setBloqueoFecha(inicioBloqueo)
  }

  function validos() {
    const grupos = [...form.bloqueos,...form.bloqueosPorFecha]
    if(!grupos.every(x=>rangoValido(x.inicio,x.fin,laboral)))return false
    if(form.bloqueos.some(x=>!diasLaborales.includes(x.dia)))return false
    const overlap=(arr,a,b)=>arr.some((x,i)=>arr.some((y,j)=>j!==i && x[a]===y[a] &&
      x.inicio<y.fin && x.fin>y.inicio))
    return !overlap(form.bloqueos,'dia') && !overlap(form.bloqueosPorFecha,'fecha')
  }

  async function guardar(e) {
    e.preventDefault();setError('');setExito('')
    if(!laboral?.configurado) {setError('Primero configura tu horario laboral desde Editar perfil.');return}
    if(!form.franjas.length){setError('Selecciona al menos un bloque de consulta.');return}
    if(!validos()){setError('Verifica que las horas bloqueadas estén dentro de la jornada y no se superpongan.');return}
    setGuardando(true)
    try{
      const payload={...form,franjas:[...form.franjas].sort((a,b)=>a.dia-b.dia||a.inicio.localeCompare(b.inicio))}
      const {data}=await client.put('/horario/citas',payload)
      setForm({
        franjas:(data.horarioCitas.franjas||[]).map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})),
        bloqueos:(data.horarioCitas.bloqueos||[]).map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})),
        bloqueosPorFecha:(data.horarioCitas.bloqueosPorFecha||[]).map(f=>({fecha:f.fecha,inicio:f.inicio,fin:f.fin,motivo:f.motivo||''})),
        publicado:data.horarioCitas.publicado,anticipacionHoras:data.horarioCitas.anticipacionHoras,
      })
      setGuardado(true);setPublicadoGuardado(Boolean(data.horarioCitas.publicado))
      setExito('Horario y horas bloqueadas guardados. Los bloqueos aplican a nuevas citas.')
      window.dispatchEvent(new Event('nutria-horario-citas-actualizado'))
      onSave?.(data.horarioCitas)
    }catch(err){setError(err.response?.data?.message||'No se pudieron guardar los bloques de consulta.') }
    finally{setGuardando(false)}
  }

  async function copiar() {
    try{await navigator.clipboard.writeText(enlace);setCopiado(true)}
    catch{setError('Tu navegador no permitió copiar. Selecciona el enlace del campo para copiarlo manualmente.')}
  }

  return <section className="nutria-agenda-panel nutria-agenda-config min-w-0 rounded-[26px] border p-3 sm:p-6">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="nutria-agenda-icon grid size-11 shrink-0 place-items-center rounded-xl"><CalendarClock size={23}/></span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-black leading-tight sm:text-xl">Configurar horarios de citas</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed opacity-75 sm:text-sm">Define las horas de consulta, los descansos y los horarios que deseas retirar de la disponibilidad.</p>
        </div>
      </div>
      {guardado && <span className="nutria-agenda-pill max-w-full break-words rounded-full px-3 py-1 text-[11px] font-bold">{publicadoGuardado?'Calendario público activo':'Enlace público desactivado'}</span>}
    </div>

    {cargando ? <p role="status" className="mt-5 text-sm">Cargando horarios...</p> :
     !laboral?.configurado ? <p className="nutria-agenda-error mt-5 rounded-xl border p-4 text-sm">Primero guarda tus días y horas de trabajo en la sección superior de esta página.</p> :
     <form onSubmit={guardar} className="mt-5 min-w-0 space-y-5">
       <p className="nutria-agenda-muted break-words text-xs leading-relaxed">Jornada: {laboral.inicio}–{laboral.fin} · {laboral.zonaHoraria}. Cada consulta dura 60 minutos. Los bloqueos quitan espacios libres sin eliminar las citas existentes.</p>
       <div className="space-y-3">
         {DIAS.map((nombre,dia)=>{
           if(!diasLaborales.includes(dia))return null
           const blocks=bloquesPorDia(dia)
           const bloqueos=bloqueosPorDia(dia)
           return <div key={dia} className="nutria-agenda-day min-w-0 rounded-2xl border p-3 sm:p-4">
             <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
               <label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-extrabold">
                 <input type="checkbox" checked={blocks.length>0} onChange={()=>activarDia(dia)} className="accent-[#297c59]" />
                 {nombre}
               </label>
               <span className="text-[11px] opacity-70">{blocks.length} bloques disponibles · {bloqueos.length} bloqueos de hora</span>
             </div>
             {blocks.length>0 && <div className="mt-3 space-y-2">
               <p className="nutria-agenda-muted text-[11px] font-extrabold">Horario ofrecido a pacientes</p>
               {blocks.map((fr,i)=><div key={dia+'-'+i} className="nutria-agenda-time-row">
                 <label className="nutria-agenda-time-label">Desde
                   <input type="time" step="1800" required value={fr.inicio} onChange={e=>editar(dia,i,'inicio',e.target.value)} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm" />
                 </label>
                 <label className="nutria-agenda-time-label">Hasta
                   <input type="time" step="1800" required value={fr.fin} onChange={e=>editar(dia,i,'fin',e.target.value)} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm" />
                 </label>
                 <button type="button" onClick={()=>quitarBloque(dia,i)} className="nutria-agenda-secondary nutria-agenda-time-remove grid min-h-11 place-items-center rounded-xl border" aria-label={'Quitar bloque '+(i+1)+' de '+nombre}><Trash2 size={16}/></button>
               </div>)}
               {blocks.length<3 && <button type="button" onClick={()=>agregarBloque(dia)} className="nutria-agenda-text inline-flex min-h-10 items-center gap-1.5 text-xs font-bold"><Plus size={15}/>Agregar otro bloque disponible</button>}
             </div>}

             <div className="mt-4 min-w-0 border-t border-current/10 pt-3">
               <div className="flex flex-wrap items-center justify-between gap-2">
                 <p className="flex items-center gap-2 text-xs font-extrabold"><Ban size={16}/> Horas que no estarán disponibles</p>
                 <button type="button" onClick={()=>agregarBloqueoSemanal(dia)} className="nutria-agenda-secondary inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 text-xs font-bold"><Plus size={14}/>Bloquear hora semanal</button>
               </div>
               {bloqueos.length===0 ? <p className="nutria-agenda-muted mt-2 text-xs">Sin horas bloqueadas este día.</p> :
                 <div className="mt-2 space-y-2">
                   {bloqueos.map((fr,i)=><div key={dia+'-blocked-'+i} className="nutria-agenda-time-row">
                     <label className="nutria-agenda-time-label">Desde
                       <input type="time" step="1800" required value={fr.inicio} onChange={e=>editar(dia,i,'inicio',e.target.value,'bloqueos')} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
                     </label>
                     <label className="nutria-agenda-time-label">Hasta
                       <input type="time" step="1800" required value={fr.fin} onChange={e=>editar(dia,i,'fin',e.target.value,'bloqueos')} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
                     </label>
                     <button type="button" onClick={()=>quitarBloque(dia,i,'bloqueos')} className="nutria-agenda-secondary nutria-agenda-time-remove grid min-h-11 place-items-center rounded-xl border" aria-label={'Quitar bloqueo '+(i+1)+' de '+nombre}><Trash2 size={16}/></button>
                   </div>)}
                 </div>}
             </div>
           </div>
         })}
       </div>

       <section className="nutria-agenda-day min-w-0 rounded-2xl border p-3 sm:p-4" aria-labelledby="bloqueos-fecha-heading">
         <h3 id="bloqueos-fecha-heading" className="flex items-center gap-2 text-sm font-extrabold"><CalendarOff size={18}/>Bloquear horas de una fecha específica</h3>
         <p className="nutria-agenda-muted mt-2 text-xs leading-5">Por ejemplo, bloquear únicamente las 12:00 del próximo viernes sin afectar los demás viernes. Para cerrar todo un día utiliza Días no laborables.</p>
         <div className="nutria-agenda-fecha-grid mt-3">
           <label className="nutria-agenda-time-label">Fecha
             <input type="date" value={bloqueoFecha.fecha} onChange={e=>setBloqueoFecha(x=>({...x,fecha:e.target.value}))} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
           </label>
           <label className="nutria-agenda-time-label">Desde
             <input type="time" step="1800" value={bloqueoFecha.inicio} onChange={e=>setBloqueoFecha(x=>({...x,inicio:e.target.value}))} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
           </label>
           <label className="nutria-agenda-time-label">Hasta
             <input type="time" step="1800" value={bloqueoFecha.fin} onChange={e=>setBloqueoFecha(x=>({...x,fin:e.target.value}))} className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
           </label>
           <label className="nutria-agenda-time-label">Motivo opcional
             <input type="text" maxLength={80} value={bloqueoFecha.motivo} onChange={e=>setBloqueoFecha(x=>({...x,motivo:e.target.value}))} placeholder="Compromiso, descanso..." className="nutria-agenda-input nutria-agenda-time-input rounded-lg border p-2 text-sm"/>
           </label>
         </div>
         <button type="button" onClick={agregarFechaBloqueada} className="nutria-agenda-secondary mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-xs font-extrabold sm:w-auto"><Ban size={16}/>Agregar bloqueo de fecha</button>
         {form.bloqueosPorFecha.length>0 && <ul className="mt-4 grid min-w-0 gap-2">
           {form.bloqueosPorFecha.map((item,i)=><li key={item.fecha+'-'+item.inicio} className="nutria-agenda-bloqueo-item flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
             <div className="min-w-0 break-words text-xs">
               <strong>{item.fecha}</strong> · {item.inicio}–{item.fin}
               {item.motivo && <p className="mt-1 opacity-70">{item.motivo}</p>}
             </div>
             <button type="button" onClick={()=>{setForm(x=>({...x,bloqueosPorFecha:x.bloqueosPorFecha.filter((_,j)=>j!==i)}));setExito('')}} aria-label={'Quitar bloqueo de '+item.fecha+' a las '+item.inicio} className="nutria-agenda-secondary grid size-10 shrink-0 place-items-center rounded-xl border"><Trash2 size={16}/></button>
           </li>)}
         </ul>}
       </section>

       <div className="grid min-w-0 gap-3 sm:grid-cols-2">
         <label className="grid min-w-0 gap-2 text-sm font-bold">Anticipación mínima
           <select className="nutria-agenda-input min-h-11 w-full min-w-0 rounded-xl border p-3 text-sm" value={form.anticipacionHoras} onChange={e=>setForm(f=>({...f,anticipacionHoras:Number(e.target.value)}))}>
             <option value={0}>Sin anticipación adicional</option><option value={1}>1 hora</option>
             <option value={2}>2 horas</option><option value={6}>6 horas</option>
             <option value={12}>12 horas</option><option value={24}>24 horas</option>
           </select>
         </label>
         <label className="nutria-agenda-day flex min-w-0 items-center gap-3 rounded-xl border p-3">
           <input type="checkbox" checked={form.publicado} onChange={e=>setForm(f=>({...f,publicado:e.target.checked}))} className="shrink-0 accent-[#297c59]"/>
           <div className="min-w-0"><span className="flex flex-wrap items-center gap-2 text-sm font-extrabold">{form.publicado?<Eye size={17}/>:<EyeOff size={17}/>} Compartir disponibilidad</span>
             <span className="block break-words text-xs opacity-70">Publicar solo horas libres, nunca datos de pacientes</span>
           </div>
         </label>
       </div>
       {error && <p role="alert" className="nutria-agenda-error break-words rounded-xl border p-3 text-sm font-semibold">{error}</p>}
       {exito && <p role="status" className="nutria-agenda-success break-words rounded-xl p-3 text-sm font-bold">{exito}</p>}
       <button type="submit" disabled={guardando} className="nutria-agenda-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-black disabled:opacity-50 sm:w-auto sm:px-5">
         <Save size={17} className="shrink-0"/>{guardando?'Guardando…':'Guardar horarios de citas'}
       </button>
     </form>}

    {guardado && publicadoGuardado && <div className="nutria-agenda-day mt-6 min-w-0 space-y-3 rounded-2xl border p-3 sm:p-4">
      <h3 className="flex items-center gap-2 text-sm font-extrabold"><Share2 size={17}/> Enlace para tus pacientes</h3>
      <p className="break-words text-xs leading-relaxed opacity-75">Comparte el enlace por WhatsApp o correo. Solo muestra espacios disponibles; todavía no confirma reservaciones automáticamente.</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input type="text" readOnly value={enlace} aria-label="Enlace de disponibilidad" onFocus={e=>e.target.select()} className="nutria-agenda-input min-w-0 w-full flex-1 rounded-xl border p-3 text-xs"/>
        <button type="button" onClick={copiar} className="nutria-agenda-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold">
          {copiado?<Check size={17}/>:<Copy size={17}/>} {copiado?'Copiado':'Copiar enlace'}
        </button>
      </div>
      <a href={enlace} target="_blank" rel="noopener noreferrer" className="nutria-agenda-text inline-flex min-w-0 items-center gap-1.5 break-all text-xs font-extrabold underline">Ver calendario como paciente</a>
    </div>}
  </section>
}
