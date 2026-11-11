import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarPlus2, CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import client from '../api/client'
import SelectorDisponibilidad from '../components/citas/SelectorDisponibilidad'
import '../components/citas/agenda.css'

const TIPOS=[['primera','Primera consulta'],['seguimiento','Seguimiento'],['otra','Otra consulta']]
export default function CitasCrearPage(){
  const navigate=useNavigate()
  const location=useLocation()
  const [data,setData]=useState(null)
  const [pacientes,setPacientes]=useState([])
  const [seleccion,setSeleccion]=useState(null)
  const [paciente,setPaciente]=useState('')
  const [tipo,setTipo]=useState('seguimiento')
  const [notas,setNotas]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [ok,setOk]=useState('')
  const [reload,setReload]=useState(0)
  useEffect(()=>{
    let active=true
    setLoading(true);setError('')
    Promise.allSettled([
      client.get('/horario/disponibilidad',{params:{dias:21}}),
      client.get('/pacientes'),
    ]).then(([available,people])=>{
      if(!active)return
      if(available.status==='fulfilled'){
        setData(available.value.data)
        const desired=location.state?.inicio
        if(desired){
          const dia=available.value.data.dias.find(x=>x.espacios.some(e=>e.inicio===desired))
          const match=dia?.espacios.find(e=>e.inicio===desired)
          if(match)setSeleccion({...match,fecha:dia.fecha})
        }
      }else{
        setData(null)
        setError(available.reason.response?.data?.message||'No fue posible consultar horarios disponibles.')
      }
      if(people.status==='fulfilled'){
        const body=people.value.data
        setPacientes(Array.isArray(body)?body:body.pacientes||body.data||[])
      }else if(available.status==='fulfilled'){
        setError('No pudimos cargar los pacientes. Actualiza e inténtalo nuevamente.')
      }
    }).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[reload,location.state])

  async function registrar(event){
    event.preventDefault();setError('');setOk('')
    if(!paciente||!seleccion){setError('Selecciona un paciente y un horario libre.');return}
    setSaving(true)
    try{
      const res=await client.post('/citas',{
        patient:paciente,inicio:seleccion.inicio,zonaHoraria:data.zonaHoraria,
        tipo,estado:'programada',notas,
      })
      setOk('Cita registrada correctamente.' + (res.data.calendarSynced===false?' Google Calendar no confirmó la sincronización.':''))
      setSeleccion(null);setNotas('');setReload(n=>n+1)
    }catch(e){
      setError(e.response?.data?.message||'No se pudo registrar la consulta. Actualiza la disponibilidad y elige otro horario.')
    }finally{setSaving(false)}
  }
  return <main className="mx-auto max-w-[1240px] space-y-5 p-4 pb-16 md:p-8">
    <header className="rounded-[27px] bg-linear-to-r from-[#194735] to-[#2b7553] p-6 text-white sm:p-8">
      <Link to="/citas" className="inline-flex min-h-9 items-center gap-2 text-sm font-bold text-[#dbf4e1]"><ArrowLeft size={17}/>Volver a ver citas</Link>
      <div className="mt-3 flex items-center gap-3"><CalendarPlus2 size={30}/><h1 className="text-2xl font-black sm:text-3xl">Crear cita</h1></div>
      <p className="mt-2 text-sm text-[#d1eada]">Elige un paciente y uno de los espacios disponibles de tu consultorio.</p>
      <button type="button" onClick={()=>setReload(n=>n+1)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/30 px-3 text-xs font-bold hover:bg-white/15">
        <RefreshCw size={15}/>Actualizar espacios
      </button>
    </header>
    {error && <div role="alert" className="nutria-agenda-error rounded-xl border p-4 text-sm font-semibold">{error}</div>}
    {ok && <div role="status" className="nutria-agenda-success flex items-center gap-2 rounded-xl p-4 text-sm font-bold"><CheckCircle2 size={18}/>{ok}</div>}
    {loading?<p role="status" className="nutria-agenda-muted text-sm">Consultando horarios y pacientes...</p>:
      !data?<div className="nutria-agenda-panel rounded-[24px] border p-6">
        <h2 className="text-xl font-extrabold">Primero configura los horarios de consulta</h2>
        <p className="mt-2 text-sm opacity-80">Para no mostrar horarios que no trabajas, necesitas definir cuándo ofreces consultas desde Ver citas.</p>
        <Link to="/citas" state={{abrirConfiguracion:true}} className="nutria-agenda-primary mt-4 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold">Ir a configuración</Link>
      </div>:
      <form onSubmit={registrar} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="nutria-agenda-panel rounded-[24px] border p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">1. Selecciona fecha y hora</h2>
          <SelectorDisponibilidad dias={data.dias} seleccion={seleccion} onSelect={setSeleccion} zonaHoraria={data.zonaHoraria}/>
        </section>
        <section className="nutria-agenda-panel rounded-[24px] border p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><ClipboardList size={19}/>2. Datos de la cita</h2>
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-bold">Paciente
              <select required value={paciente} onChange={e=>setPaciente(e.target.value)} className="nutria-agenda-input min-h-11 min-w-0 rounded-xl border p-3 text-sm">
                <option value="">Selecciona un paciente</option>
                {pacientes.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">Tipo de consulta
              <select value={tipo} onChange={e=>setTipo(e.target.value)} className="nutria-agenda-input min-h-11 rounded-xl border p-3 text-sm">
                {TIPOS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">Notas privadas (opcional)
              <textarea rows={3} maxLength={500} value={notas} onChange={e=>setNotas(e.target.value)} className="nutria-agenda-input rounded-xl border p-3 text-sm" placeholder="Detalles administrativos de esta consulta"/>
            </label>
            <div className="nutria-agenda-day rounded-xl border p-3 text-sm">
              {seleccion ? <p><strong>{seleccion.fecha}</strong> a las <strong>{seleccion.hora}</strong><span className="block mt-1 text-xs opacity-70">{data.zonaHoraria} · 60 minutos</span></p>
                : <p className="opacity-70">Elige primero un horario disponible.</p>}
            </div>
            <button type="submit" disabled={saving||!seleccion||!paciente} className="nutria-agenda-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black disabled:opacity-50">
              <CalendarPlus2 size={18}/>{saving?'Registrando cita…':'Confirmar y registrar cita'}
            </button>
            {ok && <button type="button" onClick={()=>navigate('/citas')} className="nutria-agenda-text min-h-10 text-sm font-bold underline">Ver citas registradas</button>}
          </div>
        </section>
      </form>
    }
  </main>
}
