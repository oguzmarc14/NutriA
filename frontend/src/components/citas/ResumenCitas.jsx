import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, CalendarCheck2, CalendarDays, CalendarX2, CheckCircle2,
  Clock3, RotateCcw, Search, SlidersHorizontal,
} from 'lucide-react'
import client from '../../api/client'
import './agenda.css'
import './resumenCitas.css'

const estados={programada:'Programada',confirmada:'Confirmada',completada:'Completada',cancelada:'Cancelada'}
const tabs=[
  {id:'proximas',label:'Próximas',descripcion:'Por realizar',icon:Clock3},
  {id:'todas',label:'Todas las citas',descripcion:'En el periodo',icon:CalendarDays},
  {id:'historial',label:'Historial',descripcion:'Ya pasadas',icon:CalendarCheck2},
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
  const contadores={proximas:proximas.length,todas:data.length,historial:historial.length}
  const visibles=useMemo(()=>{
    let arr=tab==='proximas'?proximas:tab==='historial'?historial:data
    arr=arr.filter(c=>(estado==='todos'||c.estado===estado)&&
      (!busqueda.trim()||String(c.patient?.name||'').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))))
    return [...arr].sort((a,b)=>tab==='historial'?new Date(b.inicio)-new Date(a.inicio):new Date(a.inicio)-new Date(b.inicio))
  },[data,tab,proximas,historial,estado,busqueda])

  const filtrosActivos=Boolean(busqueda.trim()||estado!=='todos')
  const formatear=iso=>new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))
  function limpiarFiltros(){setBusqueda('');setEstado('todos')}
  function mostrarTodas(){setTab('todas');limpiarFiltros()}
  function irAHistorial(){setTab('historial');limpiarFiltros()}

  return <section className="nutria-agenda-panel nutria-resumen-citas min-w-0 rounded-[25px] border p-4 sm:p-6"
    aria-label="Resumen de citas" aria-busy={loading}>
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="nutria-resumen-overline text-[11px] font-extrabold uppercase tracking-wider">Consultas y seguimiento</p>
        <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Mis citas</h2>
        <p className="nutria-resumen-muted mt-1 text-xs leading-5 sm:text-sm">Resumen de los últimos 120 y próximos 180 días</p>
      </div>
      <span className="nutria-resumen-total inline-flex min-h-9 max-w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold">
        <CalendarDays size={16} aria-hidden="true"/>
        <span><strong className="tabular-nums">{data.length}</strong> registradas en el periodo</span>
      </span>
    </div>

    <div className="nutria-resumen-kpis mt-5 grid grid-cols-3 gap-2 sm:gap-3"
      role="tablist" aria-label="Tipo de cita">
      {tabs.map(item=>{
        const Icon=item.icon
        return <button key={item.id} type="button" role="tab" aria-selected={tab===item.id}
          aria-label={item.label+', '+contadores[item.id]+' citas'}
          onClick={()=>setTab(item.id)}
          className="nutria-resumen-kpi group flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition active:scale-[.99] sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-5 sm:text-left">
          <span className="nutria-resumen-kpi-icon grid size-10 shrink-0 place-items-center rounded-xl sm:size-12">
            <Icon size={21} aria-hidden="true"/>
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:items-start">
            <span className="nutria-resumen-kpi-label break-words text-[11px] font-extrabold leading-tight sm:text-sm">{item.label}</span>
            <strong className="nutria-resumen-kpi-num text-2xl font-black tabular-nums leading-none sm:text-3xl">
              {contadores[item.id]}
            </strong>
            <span className="nutria-resumen-kpi-sub hidden text-[11px] font-semibold sm:block">{item.descripcion}</span>
          </span>
        </button>
      })}
    </div>

    <div className="nutria-resumen-controls mt-5 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(180px,auto)] sm:gap-3">
      <label className="nutria-resumen-search relative block min-w-0">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-65" aria-hidden="true"/>
        <input type="search" value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          placeholder="Buscar cita por paciente…" aria-label="Buscar cita por paciente"
          className="nutria-agenda-input min-h-12 w-full min-w-0 rounded-xl border py-2 pl-12 pr-3 text-sm"/>
      </label>
      <label className="nutria-resumen-select relative flex min-w-0 items-center gap-2">
        <SlidersHorizontal size={17} className="shrink-0" aria-hidden="true"/>
        <span className="sr-only">Estado de la cita</span>
        <select aria-label="Filtrar por estado" value={estado} onChange={e=>setEstado(e.target.value)}
          className="nutria-agenda-input min-h-12 w-full min-w-0 rounded-xl border px-3 text-sm font-semibold">
          <option value="todos">Todos los estados</option>
          {Object.entries(estados).map(([v,label])=><option value={v} key={v}>{label}</option>)}
        </select>
      </label>
    </div>

    <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p className="nutria-resumen-muted text-xs">
        {loading?'Actualizando citas…':visibles.length+' de '+contadores[tab]+' citas en '+tabs.find(t=>t.id===tab).label.toLowerCase()}
      </p>
      {filtrosActivos && <button type="button" onClick={limpiarFiltros}
        className="nutria-resumen-reset inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold">
        <RotateCcw size={14} aria-hidden="true"/>Limpiar filtros
      </button>}
    </div>

    {error && <p role="alert" className="nutria-agenda-error mt-3 rounded-xl border p-3 text-sm">{error}</p>}
    {loading ? <div role="status" className="nutria-resumen-empty mt-3 rounded-2xl border px-4 py-8 text-center text-sm">
      Cargando citas…
    </div>:
      !visibles.length ? <div className="nutria-resumen-empty mt-3 flex min-h-44 flex-col items-center justify-center rounded-2xl border px-4 py-7 text-center">
        <span className="nutria-resumen-empty-icon mb-3 grid size-12 place-items-center rounded-2xl">
          <CalendarX2 size={24} aria-hidden="true"/>
        </span>
        <h3 className="text-sm font-black sm:text-base">No hay citas en esta categoría</h3>
        <p className="nutria-resumen-muted mt-2 max-w-sm text-xs leading-5">
          {filtrosActivos?'Prueba con otro paciente o estado para encontrar consultas.':
            tab==='proximas'?'Todavía no tienes próximas consultas en este periodo.':
              'No encontramos consultas para esta selección.'}
        </p>
        {(filtrosActivos || (tab==='proximas' && historial.length>0)) &&
          <button type="button" onClick={filtrosActivos?limpiarFiltros:irAHistorial}
            className="nutria-resumen-cta mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold">
            {filtrosActivos?'Quitar filtros':'Ver historial'}<ArrowUpRight size={16} aria-hidden="true"/>
          </button>}
        {!filtrosActivos && tab==='historial' && data.length>0 &&
          <button type="button" onClick={mostrarTodas}
            className="nutria-resumen-cta mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold">
            Ver todas las citas<ArrowUpRight size={16} aria-hidden="true"/>
          </button>}
      </div>:
      <div className="nutria-resumen-lista mt-3 max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
        {visibles.map(c=><article className="nutria-resumen-cita flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 sm:p-4" key={c._id}>
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="nutria-resumen-cita-icon grid size-10 shrink-0 place-items-center rounded-xl">
              {c.estado==='completada'?<CheckCircle2 size={19}/>:<CalendarDays size={19}/>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-extrabold">{c.patient?.name||'Paciente'}</p>
              <p className="nutria-resumen-muted mt-1 break-words text-xs">{formatear(c.inicio)}</p>
              <p className="nutria-resumen-muted mt-2 break-words text-[11px] font-bold">
                {estados[c.estado]||c.estado} · {c.tipo==='primera'?'Primera consulta':c.tipo==='seguimiento'?'Seguimiento':'Otra consulta'}
              </p>
            </div>
          </div>
          <button type="button" onClick={()=>onAbrir(c)}
            className="nutria-resumen-cta inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold transition active:scale-[.98]">
            Ver<ArrowUpRight size={16} aria-hidden="true"/>
          </button>
        </article>)}
      </div>}
    <p className="nutria-resumen-muted mt-4 text-[11px] leading-5">
      El resumen muestra hasta 500 citas por periodo. Usa el calendario de abajo para navegar por fechas específicas.
    </p>
  </section>
}
