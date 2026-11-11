import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarCheck, Check, Copy, Leaf, ShieldCheck } from 'lucide-react'
import client from '../api/client'
import SelectorDisponibilidad from '../components/citas/SelectorDisponibilidad'
import '../components/citas/agenda.css'

export default function AgendaPublicaPage() {
  const {nutritionistId}=useParams()
  const [datos,setDatos]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [seleccion,setSeleccion]=useState(null)
  const [copiado,setCopiado]=useState(false)
  useEffect(()=>{
    const controller=new AbortController()
    setLoading(true);setError('');setSeleccion(null)
    client.get('/agenda-publica/'+nutritionistId,{params:{dias:21},signal:controller.signal})
      .then(({data})=>setDatos(data))
      .catch(e=>{if(!controller.signal.aborted)setError(
        e.response?.status===404
          ? 'El calendario no está disponible. Consulta directamente con tu nutriólogo.'
          : 'No se pudieron consultar los horarios en este momento.'
      )})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[nutritionistId])

  async function copiar() {
    if(!seleccion)return
    const texto='Hola, quisiera solicitar una consulta de nutrición el '+seleccion.fecha+
      ' a las '+seleccion.hora+' ('+datos.zonaHoraria+'). Vi este horario en la agenda de '+
      datos.profesional+'. ¿Me confirman si sigue disponible?'
    try{await navigator.clipboard.writeText(texto);setCopiado(true)}
    catch{setError('No se pudo copiar el mensaje. Revisa los permisos del navegador.')}
  }

  return <main className="nutria-agenda-publica min-h-dvh p-3 sm:p-8">
    <div className="mx-auto max-w-[850px] space-y-5">
      <header className="overflow-hidden rounded-[28px] bg-linear-to-br from-[#143c30] via-[#245c43] to-[#367555] p-6 text-[#f5fff7] sm:p-9">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#c6ecd1]"><Leaf size={19}/>NutriA</div>
        <h1 className="mt-5 text-2xl font-black sm:text-4xl">Horarios disponibles para consulta</h1>
        {datos && <div className="mt-4 space-y-1">
          <p className="text-lg font-bold">{datos.profesional}</p>
          <p className="text-sm text-[#d0e8d8]">{datos.clinica}</p>
        </div>}
        <p className="mt-4 text-sm text-[#d9f2e1]">Elige un horario libre y envíalo al consultorio para solicitar tu cita. Tu selección no representa una reserva confirmada.</p>
      </header>
      <section className="nutria-agenda-panel rounded-[26px] border p-4 sm:p-7">
        {loading ? <p role="status" className="py-10 text-center text-sm">Consultando horarios...</p> :
         error && !datos ? <p role="alert" className="nutria-agenda-error rounded-xl border p-4 text-sm font-semibold">{error}</p> :
         <div className="space-y-6">
           <div className="flex flex-wrap items-center justify-between gap-2">
             <h2 className="text-lg font-extrabold">Próximos 21 días</h2>
             <span className="nutria-agenda-pill rounded-full px-3 py-1 text-xs font-bold">60 minutos por consulta</span>
           </div>
           <SelectorDisponibilidad dias={datos.dias} seleccion={seleccion} onSelect={s=>{setSeleccion(s);setCopiado(false)}} zonaHoraria={datos.zonaHoraria}/>
           {seleccion && <div className="nutria-agenda-day rounded-2xl border p-5">
             <h3 className="flex items-center gap-2 text-base font-extrabold"><CalendarCheck size={19}/>Horario seleccionado</h3>
             <p className="mt-2 text-sm">Fecha: <strong>{seleccion.fecha}</strong> · Hora: <strong>{seleccion.hora}</strong></p>
             <button type="button" onClick={copiar} className="nutria-agenda-primary mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold sm:w-auto">
               {copiado?<Check size={18}/>:<Copy size={18}/>}
               {copiado?'Mensaje copiado':'Copiar mensaje para solicitar cita'}
             </button>
             {copiado && <p role="status" className="nutria-agenda-muted mt-2 text-xs">Envía el mensaje por WhatsApp o tu canal habitual de contacto con el consultorio.</p>}
           </div>}
           {error && <p role="alert" className="nutria-agenda-error rounded-xl border p-3 text-sm">{error}</p>}
         </div>}
      </section>
      <footer className="flex items-start gap-2 px-4 pb-8 text-xs text-[#4d705b] dark:text-[#b3d4bf]">
        <ShieldCheck size={18} className="shrink-0"/>
        <p>Esta agenda no publica nombres de pacientes, expedientes ni detalles de consultas existentes. La disponibilidad puede cambiar hasta que el consultorio confirme tu cita.</p>
      </footer>
    </div>
  </main>
}
