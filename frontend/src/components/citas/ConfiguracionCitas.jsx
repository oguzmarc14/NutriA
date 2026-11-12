import { confirmarAccion } from '../../utils/alertasAccion'
import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, Copy, Eye, EyeOff, Plus, Save, Share2, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/auth'
import client from '../../api/client'
import './agenda.css'

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const toMin = v => Number(v.slice(0,2))*60 + Number(v.slice(3,5))
const toHour = n => String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0')

function plantilla(horario) {
  if(!horario?.configurado)return []
  const ini=Math.ceil(toMin(horario.inicio)/30)*30
  const fin=Math.floor(toMin(horario.fin)/30)*30
  if(fin-ini < 60)return []
  return horario.dias.map(dia => ({dia,inicio:toHour(ini),fin:toHour(fin)}))
}

export default function ConfiguracionCitas({ onSave }) {
  const {user} = useAuth()
  const [cargando,setCargando]=useState(true)
  const [guardando,setGuardando]=useState(false)
  const [laboral,setLaboral]=useState(null)
  const [form,setForm]=useState({franjas:[],publicado:false,anticipacionHoras:2})
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
        franjas:existente?.configurado ? existente.franjas.map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})) : plantilla(data.horarioLaboral),
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

  function activarDia(dia) {
    if (bloquesPorDia(dia).length) {
      setForm(f=>({...f,franjas:f.franjas.filter(b=>b.dia!==dia)}))
    } else {
      const base=plantilla(laboral).find(x=>x.dia===dia)
      if(base)setForm(f=>({...f,franjas:[...f.franjas,base]}))
    }
    setExito('')
  }

  function editar(dia,index,campo,valor) {
    let ordinal=0
    setForm(f=>({...f,franjas:f.franjas.map(fr=>{
      if(fr.dia!==dia)return fr
      if(ordinal++!==index)return fr
      return {...fr,[campo]:valor}
    })}))
    setExito('')
  }

  function quitarBloque(dia,index) {
    let ordinal=0
    setForm(f=>({...f,franjas:f.franjas.filter(fr=>fr.dia!==dia || ordinal++!==index)}))
    setExito('')
  }

  function agregarBloque(dia) {
    const franjas=bloquesPorDia(dia)
    const final=toMin(laboral.fin)
    const ultimo=franjas.length ? Math.max(...franjas.map(fr=>toMin(fr.fin))) : Math.ceil(toMin(laboral.inicio)/30)*30
    const comienzo=Math.ceil(ultimo/30)*30
    if(comienzo+60>final) {
      setError('Reduce el bloque anterior para dejar espacio a un horario adicional.')
      return
    }
    setForm(f=>({...f,franjas:[...f.franjas,{dia,inicio:toHour(comienzo),fin:toHour(Math.min(comienzo+60,final))}]}))
    setError('');setExito('')
  }

  async function guardar(e) {
    e.preventDefault();setError('');setExito('')
    if(!laboral?.configurado) {setError('Primero configura tu horario laboral desde Editar perfil.');return}
    if(!form.franjas.length){setError('Selecciona al menos un bloque de consulta.');return}
    if (!(await confirmarAccion('¿Guardar los bloques de citas?'))) return
    setGuardando(true)
    try{
      const payload={...form,franjas:[...form.franjas].sort((a,b)=>a.dia-b.dia||a.inicio.localeCompare(b.inicio))}
      const {data}=await client.put('/horario/citas',payload)
      setForm({franjas:data.horarioCitas.franjas.map(f=>({dia:f.dia,inicio:f.inicio,fin:f.fin})),
        publicado:data.horarioCitas.publicado,anticipacionHoras:data.horarioCitas.anticipacionHoras})
      setGuardado(true);setPublicadoGuardado(Boolean(data.horarioCitas.publicado))
      setExito('Horarios de consulta guardados correctamente.')
      window.dispatchEvent(new Event('nutria-horario-citas-actualizado'))
      onSave?.(data.horarioCitas)
    }catch(err){setError(err.response?.data?.message||'No se pudieron guardar los bloques de consulta.')}
    finally{setGuardando(false)}
  }

  async function copiar() {
    try{await navigator.clipboard.writeText(enlace);setCopiado(true)}
    catch{setError('Tu navegador no permitió copiar. Selecciona el enlace del campo para copiarlo manualmente.')}
  }

  return <section className="nutria-agenda-panel rounded-[26px] border p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="nutria-agenda-icon grid size-11 place-items-center rounded-xl"><CalendarClock size={23}/></span>
        <div>
          <h2 className="text-xl font-black">Configurar horarios de citas</h2>
          <p className="mt-1 max-w-xl text-sm opacity-75">Elige los bloques en los que realmente ofreces consultas. Las pausas y los días sin atención no aparecerán en el calendario compartido.</p>
        </div>
      </div>
      {guardado && <span className="nutria-agenda-pill rounded-full px-3 py-1 text-xs font-bold">{publicadoGuardado?'Calendario público activo':'Enlace público desactivado'}</span>}
    </div>

    {cargando ? <p className="mt-5 text-sm">Cargando horarios...</p> :
     !laboral?.configurado ? <p className="nutria-agenda-error mt-5 rounded-xl border p-4 text-sm">Primero debes guardar tus días y horas de trabajo en <a className="font-extrabold underline" href="/editar-perfil">Editar perfil</a>.</p> :
     <form onSubmit={guardar} className="mt-5 space-y-5">
       <p className="nutria-agenda-muted text-xs">Jornada laboral: {laboral.inicio}–{laboral.fin} · {laboral.zonaHoraria}. Las consultas duran 60 minutos. Puedes crear varios bloques por día para dejar descansos.</p>
       <div className="space-y-3">
         {DIAS.map((nombre,dia)=>{
           const habilitado=diasLaborales.includes(dia)
           if(!habilitado)return null
           const blocks=bloquesPorDia(dia)
           return <div key={dia} className="nutria-agenda-day rounded-2xl border p-3 sm:p-4">
             <div className="flex flex-wrap items-center justify-between gap-2">
               <label className="flex cursor-pointer items-center gap-2 text-sm font-extrabold">
                 <input type="checkbox" checked={blocks.length>0} onChange={()=>activarDia(dia)} className="accent-[#297c59]" />
                 {nombre}
               </label>
               <span className="text-[11px] opacity-65">{blocks.length ? blocks.length + (blocks.length===1?' bloque':' bloques') : 'Sin consultas'}</span>
             </div>
             {blocks.length>0 && <div className="mt-3 space-y-2">
               {blocks.map((fr,i)=><div key={dia+'-'+i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                 <label className="grid gap-1 text-xs font-bold">Desde
                   <input type="time" step="1800" required value={fr.inicio} onChange={e=>editar(dia,i,'inicio',e.target.value)} className="nutria-agenda-input min-w-0 rounded-lg border px-2 py-2 text-sm" />
                 </label>
                 <label className="grid gap-1 text-xs font-bold">Hasta
                   <input type="time" step="1800" required value={fr.fin} onChange={e=>editar(dia,i,'fin',e.target.value)} className="nutria-agenda-input min-w-0 rounded-lg border px-2 py-2 text-sm" />
                 </label>
                 <button type="button" onClick={()=>quitarBloque(dia,i)} className="nutria-agenda-secondary grid size-10 place-items-center rounded-xl border" aria-label={'Quitar bloque '+(i+1)+' de '+nombre}><Trash2 size={16}/></button>
               </div>)}
               {blocks.length<3 && <button type="button" onClick={()=>agregarBloque(dia)} className="nutria-agenda-text inline-flex min-h-9 items-center gap-1.5 text-xs font-bold"><Plus size={14}/>Agregar otro bloque</button>}
             </div>}
           </div>
         })}
       </div>
       <div className="grid gap-4 sm:grid-cols-2">
         <label className="grid gap-2 text-sm font-bold">Anticipación mínima
           <select className="nutria-agenda-input min-h-11 rounded-xl border p-3 text-sm" value={form.anticipacionHoras} onChange={e=>setForm(f=>({...f,anticipacionHoras:Number(e.target.value)}))}>
             <option value={0}>Sin anticipación adicional</option><option value={1}>1 hora</option>
             <option value={2}>2 horas</option><option value={6}>6 horas</option>
             <option value={12}>12 horas</option><option value={24}>24 horas</option>
           </select>
         </label>
         <label className="nutria-agenda-day flex items-center gap-3 rounded-xl border p-3">
           <input type="checkbox" checked={form.publicado} onChange={e=>setForm(f=>({...f,publicado:e.target.checked}))} className="accent-[#297c59]"/>
           <div><span className="flex items-center gap-2 text-sm font-extrabold">{form.publicado?<Eye size={17}/>:<EyeOff size={17}/>} Compartir disponibilidad</span>
             <span className="block text-xs opacity-70">Publicar solo horas libres, nunca datos de pacientes</span>
           </div>
         </label>
       </div>
       {error && <p role="alert" className="nutria-agenda-error rounded-xl border p-3 text-sm font-semibold">{error}</p>}
       {exito && <p role="status" className="nutria-agenda-success rounded-xl p-3 text-sm font-bold">{exito}</p>}
       <button type="submit" disabled={guardando} className="nutria-agenda-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black disabled:opacity-50 sm:w-auto">
         <Save size={17}/>{guardando?'Guardando…':'Guardar horarios de citas'}
       </button>
     </form>}

    {guardado && publicadoGuardado && <div className="nutria-agenda-day mt-6 space-y-3 rounded-2xl border p-4">
      <h3 className="flex items-center gap-2 text-sm font-extrabold"><Share2 size={17}/> Enlace para tus pacientes</h3>
      <p className="text-xs opacity-75">Comparte el enlace por WhatsApp o correo. Solo enseña espacios disponibles, no permite ver información clínica ni confirma reservas automáticamente.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="text" readOnly value={enlace} aria-label="Enlace de disponibilidad" onFocus={e=>e.target.select()} className="nutria-agenda-input min-w-0 flex-1 rounded-xl border p-3 text-xs"/>
        <button type="button" onClick={copiar} className="nutria-agenda-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold">
          {copiado?<Check size={17}/>:<Copy size={17}/>} {copiado?'Copiado':'Copiar enlace'}
        </button>
      </div>
      <a href={enlace} target="_blank" rel="noopener noreferrer" className="nutria-agenda-text inline-flex items-center gap-1.5 text-xs font-extrabold underline">Ver calendario como paciente</a>
    </div>}
  </section>
}
