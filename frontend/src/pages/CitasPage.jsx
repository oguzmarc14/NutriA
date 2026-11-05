import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RefreshCw, X } from 'lucide-react'
import client from '../api/client'

const EMPTY = { patient: '', inicio: '', fin: '', tipo: 'seguimiento', estado: 'programada', notas: '' }
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const COLORS = { programada: 'bg-amber-100 border-amber-400 text-amber-900', confirmada: 'bg-emerald-100 border-emerald-500 text-emerald-900', completada: 'bg-slate-100 border-slate-400 text-slate-700', cancelada: 'bg-rose-100 border-rose-400 text-rose-800' }
const pad = n => String(n).padStart(2, '0')
const localInput = date => { const d = new Date(date); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const dayKey = date => { const d = new Date(date); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d }
const startWeek = date => addDays(new Date(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate()), -(new Date(date).getDay()+6)%7)
const formatMonth = d => new Intl.DateTimeFormat('es-MX', { month:'long', year:'numeric' }).format(d)
const formatTime = d => new Intl.DateTimeFormat('es-MX', { hour:'2-digit', minute:'2-digit' }).format(new Date(d))
const dateTitle = d => new Intl.DateTimeFormat('es-MX', { weekday:'long', day:'numeric', month:'long' }).format(d)

export default function CitasPage() {
  const [view, setView] = useState('semana')
  const [focus, setFocus] = useState(new Date())
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('todas')
  const [dragging, setDragging] = useState('')

  const range = useMemo(() => {
    if (view === 'mes') {
      const first = new Date(focus.getFullYear(), focus.getMonth(), 1)
      const begin = startWeek(first)
      return { begin, end: addDays(begin, 42), days: Array.from({length:42}, (_,i)=>addDays(begin,i)) }
    }
    if (view === 'dia') {
      const begin = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate())
      return { begin, end: addDays(begin,1), days:[begin] }
    }
    const begin = startWeek(focus)
    return { begin, end: addDays(begin,7), days:Array.from({length:7}, (_,i)=>addDays(begin,i)) }
  }, [focus, view])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a,b] = await Promise.all([
        client.get('/citas', {params:{desde:range.begin.toISOString(), hasta:range.end.toISOString()}}),
        client.get('/pacientes')
      ])
      setCitas(Array.isArray(a.data) ? a.data : [])
      setPacientes(Array.isArray(b.data) ? b.data : b.data.pacientes || b.data.data || [])
      setError('')
    } catch(e) { setError(e.response?.data?.message || 'No se pudo cargar la agenda') }
    finally { setLoading(false) }
  }, [range.begin.getTime(), range.end.getTime()])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    client.get('/calendar/status').then(({data})=>setConnected(Boolean(data.connected))).catch(()=>{})
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') setNotice('Google Calendar conectado correctamente')
    if (params.get('calendar') === 'error') setError('No se pudo autorizar Google Calendar. Revisa la configuración OAuth.')
    if (params.has('calendar')) window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const filtered = useMemo(()=>citas.filter(c=>filter==='todas'||c.estado===filter),[citas,filter])
  const byDay = useMemo(()=> {
    const map = {}
    filtered.forEach(c=> { const key=dayKey(c.inicio); (map[key] ||= []).push(c) })
    return map
  },[filtered])
  const today = dayKey(new Date())
  const todayCount = citas.filter(c=>dayKey(c.inicio)===today && c.estado!=='cancelada').length
  const upcoming = citas.filter(c=>new Date(c.inicio)>new Date() && !['cancelada','completada'].includes(c.estado)).length

  function openNew(date = new Date(), hour = 9) {
    const start = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,0)
    if (start < new Date()) start.setDate(start.getDate()+1)
    const end = new Date(start.getTime()+60*60000)
    setForm({...EMPTY,inicio:localInput(start),fin:localInput(end)})
    setEditing('');setError('');setModal(true)
  }
  function openEdit(c) {
    setForm({patient:c.patient?._id||c.patient,inicio:localInput(c.inicio),fin:localInput(c.fin),tipo:c.tipo,estado:c.estado,notas:c.notas||''})
    setEditing(c._id);setError('');setModal(true)
  }
  async function persist(payload, id) {
    const data={...payload,inicio:new Date(payload.inicio).toISOString(),fin:new Date(payload.fin).toISOString(),zonaHoraria:Intl.DateTimeFormat().resolvedOptions().timeZone}
    return id ? client.put('/citas/'+id,data) : client.post('/citas',data)
  }
  async function save(e) {
    e.preventDefault()
    if (new Date(form.fin)<=new Date(form.inicio)) {setError('La hora final debe ser posterior al inicio');return}
    setSaving(true);setError('')
    try {
      const response=await persist(form,editing)
      setModal(false);setNotice((editing?'Cita actualizada':'Cita registrada')+(connected&&!response.data.calendarSynced?' · No se sincronizó con Google Calendar':''))
      await load()
    } catch(e) {setError(e.response?.data?.message||'No se pudo guardar la cita')}
    finally {setSaving(false)}
  }
  async function moveAppointment(c, date, hour) {
    if (c.estado==='cancelada') return
    const oldStart=new Date(c.inicio),oldEnd=new Date(c.fin)
    const start=new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour??oldStart.getHours(),hour===undefined?oldStart.getMinutes():0)
    const end=new Date(start.getTime()+(oldEnd-oldStart))
    if (start.getTime()===oldStart.getTime()) return
    if (!window.confirm(`¿Reprogramar la cita de ${c.patient?.name||'este paciente'} al ${dateTitle(start)} a las ${formatTime(start)}?`)) return
    setSaving(true);setError('')
    try {
      const response=await persist({patient:c.patient?._id||c.patient,inicio:localInput(start),fin:localInput(end),tipo:c.tipo,estado:c.estado,notas:c.notas||''},c._id)
      setNotice('Cita reprogramada'+(connected&&!response.data.calendarSynced?' · No se sincronizó con Google Calendar':''))
      await load()
    } catch(e){setError(e.response?.data?.message||'No se pudo reprogramar la cita')}
    finally{setSaving(false);setDragging('')}
  }
  async function connect() {
    setLoading(true)
    try {const {data}=await client.get('/calendar/connect');window.location.assign(data.url)}
    catch(e){setError(e.response?.data?.message||'No se pudo conectar Google Calendar');setLoading(false)}
  }
  async function disconnect() {
    if(!window.confirm('¿Desconectar Google Calendar? Las citas permanecerán en NutriA.'))return
    try {await client.delete('/calendar/disconnect');setConnected(false);setNotice('Google Calendar desconectado')}
    catch(e){setError(e.response?.data?.message||'No se pudo desconectar')}
  }
  function navigate(direction) {
    const d=new Date(focus)
    if(view==='mes') d.setMonth(d.getMonth()+direction)
    else d.setDate(d.getDate()+direction*(view==='dia'?1:7))
    setFocus(d)
  }
  const eventCard=(c,compact=false)=><button key={c._id} type="button" draggable={!saving&&c.estado!=='cancelada'}
    onDragStart={e=>{e.dataTransfer.setData('text/plain',c._id);setDragging(c._id)}}
    onDragEnd={()=>setDragging('')} onClick={e=>{e.stopPropagation();openEdit(c)}}
    className={`w-full min-w-0 rounded-lg border-l-4 px-2 py-1.5 text-left text-xs transition hover:brightness-95 ${COLORS[c.estado]||COLORS.programada} ${dragging===c._id?'opacity-50':''}`}>
    <span className="block truncate font-semibold">{formatTime(c.inicio)} · {c.patient?.name||'Paciente'}</span>
    {!compact&&<span className="block truncate opacity-75">{c.tipo==='primera'?'Primera consulta':c.tipo==='seguimiento'?'Seguimiento':'Consulta'} · {c.estado}</span>}
  </button>
  const hours=Array.from({length:13},(_,i)=>i+7)
  const inputClass='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500'
  return <main className="mx-auto max-w-7xl space-y-5 p-3 pb-16 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold text-emerald-950">Agenda de citas</h1><p className="text-sm text-slate-500">Organiza tus consultas directamente en el calendario.</p></div>
      <button onClick={()=>openNew(focus)} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={17}/> Nueva cita</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Citas de hoy</p><p className="text-2xl font-bold text-emerald-900">{todayCount}</p></div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Próximas en esta vista</p><p className="text-2xl font-bold text-emerald-900">{upcoming}</p></div>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-4"><div><p className="text-sm font-semibold">Google Calendar</p><p className={`text-xs ${connected?'text-emerald-700':'text-slate-500'}`}>{connected?'Conectado':'Sin conectar'}</p></div><button onClick={connected?disconnect:connect} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800">{connected?'Desconectar':'Conectar'}</button></div>
    </div>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-center gap-2"><button aria-label="Anterior" onClick={()=>navigate(-1)} className="rounded-lg border p-2"><ChevronLeft size={17}/></button><button aria-label="Siguiente" onClick={()=>navigate(1)} className="rounded-lg border p-2"><ChevronRight size={17}/></button><button onClick={()=>setFocus(new Date())} className="rounded-lg border px-3 py-2 text-xs font-semibold">Hoy</button><h2 className="ml-2 text-base font-bold capitalize text-slate-800">{formatMonth(focus)}</h2></div>
        <div className="flex flex-wrap gap-2"><select aria-label="Filtrar citas" className="rounded-lg border px-2 py-2 text-xs" value={filter} onChange={e=>setFilter(e.target.value)}>{['todas','programada','confirmada','completada','cancelada'].map(s=><option key={s} value={s}>{s==='todas'?'Todos los estados':s}</option>)}</select><div className="flex rounded-lg bg-slate-100 p-1">{[['mes','Mes'],['semana','Semana'],['dia','Día'],['lista','Lista']].map(([v,label])=><button key={v} onClick={()=>setView(v)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view===v?'bg-white text-emerald-800 shadow':'text-slate-600'}`}>{label}</button>)}</div><button aria-label="Actualizar" onClick={load} className="rounded-lg border p-2"><RefreshCw size={16} className={loading?'animate-spin':''}/></button></div>
      </div>
      {view==='mes'?<div className="grid grid-cols-7">
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div key={d} className="border-b bg-slate-50 py-2 text-center text-xs font-bold text-slate-500">{d}</div>)}
        {range.days.map(d=><div key={dayKey(d)} onClick={()=>openNew(d)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const c=citas.find(c=>c._id===e.dataTransfer.getData('text/plain'));if(c)moveAppointment(c,d)}} className={`min-h-24 cursor-pointer space-y-1 overflow-hidden border-b border-r p-1.5 hover:bg-emerald-50/40 sm:min-h-32 ${d.getMonth()!==focus.getMonth()?'bg-slate-50/60':''}`}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${dayKey(d)===today?'bg-emerald-700 text-white':'text-slate-700'}`}>{d.getDate()}</span>{(byDay[dayKey(d)]||[]).slice(0,3).map(c=>eventCard(c,true))}{(byDay[dayKey(d)]||[]).length>3&&<p className="text-xs text-slate-500">+{byDay[dayKey(d)].length-3} más</p>}</div>)}
      </div>:view==='lista'?<div className="space-y-3 p-4">{range.days.map(d=><div key={dayKey(d)}><h3 className="mb-2 text-sm font-bold capitalize text-slate-700">{dateTitle(d)}</h3><div className="space-y-2">{(byDay[dayKey(d)]||[]).map(c=>eventCard(c))}{!byDay[dayKey(d)]?.length&&<p className="text-xs text-slate-400">Sin citas</p>}</div></div>)}</div>:<div className="overflow-x-auto"><div className={view==='semana'?'min-w-[760px]':'min-w-[280px]'}>
        <div className="grid border-b bg-slate-50" style={{gridTemplateColumns:`60px repeat(${range.days.length}, minmax(0, 1fr))`}}><div/><>{range.days.map(d=><button key={dayKey(d)} onClick={()=>{setFocus(d);setView('dia')}} className={`py-3 text-center text-xs font-bold ${dayKey(d)===today?'text-emerald-700':'text-slate-600'}`}>{DAYS[d.getDay()]} {d.getDate()}</button>)}</></div>
        {hours.map(h=><div key={h} className="grid" style={{gridTemplateColumns:`60px repeat(${range.days.length}, minmax(0, 1fr))`}}><div className="border-r border-b px-2 py-3 text-xs text-slate-400">{pad(h)}:00</div>{range.days.map(d=><div key={dayKey(d)} onClick={()=>openNew(d,h)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const c=citas.find(c=>c._id===e.dataTransfer.getData('text/plain'));if(c)moveAppointment(c,d,h)}} className="min-h-16 cursor-pointer space-y-1 border-r border-b p-1 hover:bg-emerald-50/50">{(byDay[dayKey(d)]||[]).filter(c=>new Date(c.inicio).getHours()===h).map(c=>eventCard(c))}</div>)}</div>)}
      </div></div>}
      {!filtered.length&&<p className="p-4 text-center text-sm text-slate-400">No hay citas en el periodo seleccionado. Haz clic en un horario para crear una.</p>}
      <p className="border-t p-3 text-xs text-slate-400">Selecciona un horario para agregar una cita. Arrastra una cita para reprogramarla (se solicitará confirmación).</p>
    </section>
    {modal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setModal(false)}}><div role="dialog" aria-modal="true" aria-label={editing?'Editar cita':'Nueva cita'} className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-emerald-950">{editing?'Editar cita':'Nueva cita'}</h2><p className="text-xs text-slate-500">Completa los detalles de la consulta.</p></div><button aria-label="Cerrar" onClick={()=>setModal(false)} disabled={saving} className="rounded-lg p-2 hover:bg-slate-100"><X size={20}/></button></div>
      {error&&<p role="alert" className="mb-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-800">{error}</p>}
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold text-slate-700">Paciente<select required className={inputClass} value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))}><option value="">Selecciona un paciente</option>{pacientes.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Inicio<input required type="datetime-local" className={inputClass} value={form.inicio} onChange={e=>{const start=e.target.value;setForm(f=>({...f,inicio:start,fin:(!f.fin||new Date(f.fin)<=new Date(start))?localInput(new Date(new Date(start).getTime()+3600000)):f.fin}))}}/></label>
        <label className="text-sm font-semibold text-slate-700">Fin<input required type="datetime-local" className={inputClass} value={form.fin} onChange={e=>setForm(f=>({...f,fin:e.target.value}))}/></label>
        <label className="text-sm font-semibold text-slate-700">Tipo<select className={inputClass} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="primera">Primera consulta</option><option value="seguimiento">Seguimiento</option><option value="otra">Otra</option></select></label>
        <label className="text-sm font-semibold text-slate-700">Estado<select className={inputClass} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}><option value="programada">Programada</option><option value="confirmada">Confirmada</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select></label>
        <label className="sm:col-span-2 text-sm font-semibold text-slate-700">Notas<input maxLength={500} className={inputClass} value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} placeholder="Opcional"/></label>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setModal(false)} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?'Guardando…':editing?'Guardar cambios':'Registrar cita'}</button></div>
      </form>
    </div></div>}
  </main>
}
