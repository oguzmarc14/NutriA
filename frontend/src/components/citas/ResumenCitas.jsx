import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, CalendarDays, CalendarX, Clock3, Search } from 'lucide-react'
import client from '../../api/client'
import './agenda.css'

const estados={programada:'Programada',confirmada:'Confirmada',completada:'Completada',cancelada:'Cancelada'}
const tabs=[
  {id:'proximas',label:'Próximas',icon:Clock3},
  {id:'todas',label:'Todas las citas',icon:CalendarDays},
  {id:'historial',label:'Historial',icon:CalendarCheck},
]
export default function ResumenCitas({revision=0,onAbrir}) {
  const [data,setData]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [tab,setTab]=useState('proximas')
  const [busqueda,setBusqueda]=useState('')
  const [estado,setEstado]=useState('todos')
  useEffect(()=>{
    const controller=new AbortController()
    const ahora=Date.now()
    const desde=new Date(ahora-120*86400000).toISOString()
    const hasta=new Date(ahora+180*86400000).toISOString()
    setLoading(true)
    client.get('/citas',{params:{desde,hasta},signal:controller.signal}).then(({data})=>{
      if(!controller.signal.aborted){setData(Array.isArray(data)?data:[]);setError('')}
    }).catch(err=>{
      if(!controller.signal.aborted)setError(err.response?.data?.message||'No se pudo cargar el resumen de citas.')
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[revision])
  const now=Date.now()
  const proximas=useMemo(()=>data.filter(c=>new Date(c.inicio).getTime()>now &&
    ['programada','confirmada'].includes(c.estado)),[data,now])
  const historial=useMemo(()=>data.filter(c=>new Date(c.inicio).getTime()<=now||
    ['completada','cancelada'].includes(c.estado)),[data,now])
  const visibles=useMemo(()=>{
    let arr=tab==='proximas'?proximas:tab==='historial'?historial:data
    arr=arr.filter(c=>(estado==='todos'||c.estado===estado)&&
      (!busqueda.trim()||String(c.patient?.name||'').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))))
    return [...arr].sort((a,b)=>tab==='historial'?new Date(b.inicio)-new Date(a.inicio):new Date(a.inicio)-new Date(b.inicio))
  },[data,tab,proximas,historial,estado,busqueda])
  const formatear=iso=>new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))
  return <section className="nutria-agenda-panel rounded-[25px] border p-4 sm:p-6" aria-label="Resumen de citas">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-black">Mis citas</h2><p className="text-xs opacity-75">Resumen de los últimos 120 y próximos 180 días</p></div>
      <span className="nutria-agenda-pill rounded-full px-3 py-1 text-xs font-bold">{data.length} registradas en el periodo</span>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2" role="tablist" aria-label="Tipo de cita">
      {tabs.map(item=>{
        const Icon=item.icon
        return <button key={item.id} type="button" role="tab" aria-selected={tab===item.id}
          className="nutria-agenda-tab flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-center text-xs font-bold"
          onClick={()=>setTab(item.id)}>
          <Icon size={18}/><span>{item.label}</span>
          <span className="text-sm font-black">{item.id==='proximas'?proximas.length:item.id==='historial'?historial.length:data.length}</span>
        </button>
      })}
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
      <label className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/>
        <input type="search" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar paciente..." aria-label="Buscar cita por paciente"
          className="nutria-agenda-input min-h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm"/>
      </label>
      <select aria-label="Filtrar por estado" value={estado} onChange={e=>setEstado(e.target.value)} className="nutria-agenda-input min-h-11 rounded-xl border px-3 text-sm">
        <option value="todos">Todos los estados</option>
        {Object.entries(estados).map(([v,l])=><option value={v} key={v}>{l}</option>)}
      </select>
    </div>
    {error && <p role="alert" className="nutria-agenda-error mt-3 rounded-xl border p-3 text-sm">{error}</p>}
    {loading ? <p role="status" className="mt-4 text-sm opacity-70">Cargando citas...</p>:
      !visibles.length ? <div className="nutria-agenda-day mt-3 rounded-xl border p-5 text-center">
        <CalendarX className="mx-auto mb-2 opacity-50" size={24}/>
        <p className="text-sm font-bold">No hay citas en esta categoría.</p>
      </div>:
      <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {visibles.map(c=><article className="nutria-agenda-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3" key={c._id}>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-extrabold">{c.patient?.name||'Paciente'}</p>
            <p className="mt-1 text-xs opacity-80">{formatear(c.inicio)}</p>
            <p className="mt-1 text-[11px] font-bold opacity-70">{estados[c.estado]||c.estado} · {c.tipo==='primera'?'Primera consulta':c.tipo==='seguimiento'?'Seguimiento':'Otra consulta'}</p>
          </div>
          <button type="button" onClick={()=>onAbrir(c)} className="nutria-agenda-secondary inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-xs font-extrabold">
            Ver o editar
          </button>
        </article>)}
      </div>}
    <p className="mt-3 text-[11px] opacity-65">El resumen muestra hasta 500 citas por periodo. Usa el calendario de abajo para navegar por fechas específicas.</p>
  </section>
}
