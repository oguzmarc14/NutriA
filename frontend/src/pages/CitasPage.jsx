import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RefreshCw, X } from 'lucide-react'
import client from '../api/client'

const EMPTY = { patient: '', inicio: '', fin: '', tipo: 'seguimiento', estado: 'programada', notas: '' }
const NO_APPOINTMENTS = []
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEKDAYS = [...DAYS.slice(1), DAYS[0]]
const VIEWS = [['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día'], ['lista', 'Lista']]
const TYPES = { primera: 'Primera consulta', seguimiento: 'Seguimiento', otra: 'Otra consulta' }
const STATES = {
  programada: { label: 'Programada', dot: 'bg-[#b77a2a]', color: 'border-[#e6ce9f] border-l-[#b77a2a] bg-[#fcf0d9] text-[#694717]' },
  confirmada: { label: 'Confirmada', dot: 'bg-[#35785a]', color: 'border-[#bbdaca] border-l-[#35785a] bg-[#ddf0e4] text-[#205641]' },
  completada: { label: 'Completada', dot: 'bg-[#6b779c]', color: 'border-[#cbd2e6] border-l-[#6b779c] bg-[#e8ecf7] text-[#3e4e77]' },
  cancelada: { label: 'Cancelada', dot: 'bg-[#ac6266]', color: 'border-[#e6c3c3] border-l-[#ac6266] bg-[#f7e5e5] text-[#773d43]' },
}
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246b55]'
const CONTROL = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#ccded0] bg-[#f9fcf7] px-3 text-xs font-bold text-[#246b55] transition hover:bg-[#e5f0e6] disabled:opacity-55 ${FOCUS}`
const PANEL = 'rounded-[1.75rem] border border-[#d3e2d6] bg-[#f8fbf6] shadow-[0_12px_32px_rgba(32,78,64,.07)]'
const pad = n => String(n).padStart(2, '0')
const localInput = date => { const d = new Date(date); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const dayKey = date => { const d = new Date(date); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d }
const startWeek = date => addDays(new Date(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate()), -(new Date(date).getDay()+6)%7)
const formatMonth = d => new Intl.DateTimeFormat('es-MX', { month:'long', year:'numeric' }).format(d)
const formatTime = d => new Intl.DateTimeFormat('es-MX', { hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date(d))
const dateTitle = d => new Intl.DateTimeFormat('es-MX', { weekday:'long', day:'numeric', month:'long' }).format(d)

const shortDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const weekTitle = (start, end) => shortDate.formatRange(start, end)

function MiniCalendar({ focus, today, onSelect }) {
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1)
  const begin = startWeek(first)
  const monthLength = new Date(focus.getFullYear(), focus.getMonth() + 1, 0).getDate()
  const length = Math.ceil(((first.getDay() + 6) % 7 + monthLength) / 7) * 7
  return (
    <section className={`${PANEL} min-w-0 p-4`}>
      <h2 className="text-sm font-extrabold first-letter:uppercase">{formatMonth(focus)}</h2>
      <p className="mt-1 mb-3 text-xs text-[#526d5d]">Ir a un día</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map(d => <span key={d} className="text-[10px] font-bold text-[#526d5d]">{d}</span>)}
        {Array.from({ length }, (_, i) => {
          const date = addDays(begin, i)
          const key = dayKey(date)
          const selected = key === dayKey(focus)
          return (
            <button key={key} type="button" aria-label={dateTitle(date)}
              aria-current={key === today ? 'date' : undefined} aria-pressed={selected}
              onClick={() => onSelect(date)}
              className={`min-h-9 rounded-lg text-xs font-bold ${FOCUS} ${selected ? 'bg-[#246b55] text-white' : 'hover:bg-[#e6f0e6]'} ${key === today && !selected ? 'bg-[#e1efe2]' : ''} ${date.getMonth() !== focus.getMonth() ? 'text-[#526d5d]' : ''}`}>
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function CitasPage() {
  const [view, setView] = useState('semana')
  const [focus, setFocus] = useState(new Date())
  const [result, setResult] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const [pacientes, setPacientes] = useState([])
  const [connected, setConnected] = useState(false)
  const [reload, setReload] = useState(0)
  const [patientError, setPatientError] = useState('')
  const [calendarBusy, setCalendarBusy] = useState(false)
  const dialogRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('calendar') === 'error'
    ? 'No se pudo autorizar Google Calendar. Revisa la configuración OAuth.'
    : '')
  const [notice, setNotice] = useState(() => new URLSearchParams(window.location.search).get('calendar') === 'connected'
    ? 'Google Calendar conectado correctamente'
    : '')
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

  const from = range.begin.toISOString()
  const to = range.end.toISOString()

  const requestKey = `${from}/${to}/${reload}`
  const loading = result?.key !== requestKey
  const loadError = loading ? '' : result.error
  const citas = loading ? NO_APPOINTMENTS : result.appointments

  useEffect(() => {
    const controller = new AbortController()
    client.get('/citas', { params: { desde: from, hasta: to }, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, appointments: Array.isArray(data) ? data : [], error: '' })
        }
      })
      .catch(e => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            appointments: [],
            error: e.response?.data?.message || 'No se pudo cargar la agenda',
          })
        }
      })
    return () => controller.abort()
  }, [from, to, requestKey])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    client.get('/pacientes', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) {
        setPacientes(Array.isArray(data) ? data : data?.pacientes || data?.data || [])
        setPatientError('')
      }
    }).catch(e => {
      if (!controller.signal.aborted) setPatientError(e.response?.data?.message || 'No se pudo cargar la lista de pacientes')
    })
    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    if (modal && !dialogRef.current.open) dialogRef.current.showModal()
    if (!modal && dialogRef.current.open) dialogRef.current.close()
  }, [modal])

  function load() {
    setReload(value => value + 1)
  }

  useEffect(() => {
    client.get('/calendar/status').then(({data})=>setConnected(Boolean(data.connected))).catch(()=>{})
    const params = new URLSearchParams(window.location.search)
    if (params.has('calendar')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('calendar')
      window.history.replaceState(window.history.state, '', url)
    }
  }, [])

  const filtered = useMemo(()=>citas.filter(c=>filter==='todas'||c.estado===filter),[citas,filter])
  const byDay = useMemo(()=> {
    const map = {}
    filtered.forEach(c=> { const key=dayKey(c.inicio); (map[key] ||= []).push(c) })
    return map
  },[filtered])
  const today = dayKey(now)

  function openNew(date = new Date(), hour) {
    const start = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour ?? 9,0)
    const now = new Date()
    if (hour === undefined && dayKey(start) === dayKey(now) && start < now) {
      start.setHours(now.getHours() + 1)
      if (dayKey(start) !== dayKey(date)) start.setTime(now.getTime())
    }
    const end = new Date(start.getTime()+60*60000)
    setForm({...EMPTY,inicio:localInput(start),fin:localInput(end)})
    setEditing('');setError('');setModal(true)
  }
  function openEdit(c) {
    setForm({patient:c.patient?._id||c.patient||'',inicio:localInput(c.inicio),fin:localInput(c.fin),tipo:c.tipo,estado:c.estado,notas:c.notas||''})
    setEditing(c._id);setError('');setModal(true)
  }
  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function updateStart(inicio) {
    setForm(current => {
      const start = Date.parse(inicio)
      const needsEnd = Number.isFinite(start) && (!current.fin || Date.parse(current.fin) <= start)
      return { ...current, inicio, fin: needsEnd ? localInput(new Date(start + 3600000)) : current.fin }
    })
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
      load()
    } catch(e) {setError(e.response?.data?.message||'No se pudo guardar la cita')}
    finally {setSaving(false)}
  }
  async function moveAppointment(c, date, hour) {
    if (saving || c.estado === 'cancelada') return
    const oldStart=new Date(c.inicio),oldEnd=new Date(c.fin)
    const start=new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour??oldStart.getHours(),hour===undefined?oldStart.getMinutes():0)
    const end=new Date(start.getTime()+(oldEnd-oldStart))
    if (start.getTime()===oldStart.getTime()) return
    if (!window.confirm(`¿Reprogramar la cita de ${c.patient?.name||'este paciente'} al ${dateTitle(start)} a las ${formatTime(start)}?`)) return
    setSaving(true);setError('')
    try {
      const response=await persist({patient:c.patient?._id||c.patient,inicio:localInput(start),fin:localInput(end),tipo:c.tipo,estado:c.estado,notas:c.notas||''},c._id)
      setNotice('Cita reprogramada'+(connected&&!response.data.calendarSynced?' · No se sincronizó con Google Calendar':''))
      load()
    } catch(e){setError(e.response?.data?.message||'No se pudo reprogramar la cita')}
    finally{setSaving(false);setDragging('')}
  }
  async function connect() {
    setCalendarBusy(true)
    try {const {data}=await client.get('/calendar/connect');window.location.assign(data.url)}
    catch(e){setError(e.response?.data?.message||'No se pudo conectar Google Calendar');setCalendarBusy(false)}
  }
  async function disconnect() {
    if(!window.confirm('¿Desconectar Google Calendar? Las citas permanecerán en NutriA.'))return
    setCalendarBusy(true)
    try {await client.delete('/calendar/disconnect');setConnected(false);setNotice('Google Calendar desconectado')}
    catch(e){setError(e.response?.data?.message||'No se pudo desconectar')}
    finally {setCalendarBusy(false)}
  }
  function navigate(direction) {
    if (view === 'mes') {
      setFocus(new Date(focus.getFullYear(), focus.getMonth() + direction, 1))
    } else {
      setFocus(addDays(focus, direction * (view === 'dia' ? 1 : 7)))
    }
  }

  const upcoming = filtered.filter(c => Date.parse(c.inicio) > now.getTime() && !['cancelada', 'completada'].includes(c.estado))
  const focusKey = dayKey(focus)
  const visibleDays = range.days.filter(d => byDay[dayKey(d)]?.length)
  const period = view === 'mes' ? formatMonth(focus) : view === 'dia' ? dateTitle(focus) : weekTitle(range.begin, addDays(range.end, -1))
  const hours = Array.from({ length: 13 }, (_, i) => i + 7)

  function showDay(date) {
    setFocus(date)
    setView('dia')
  }

  function dropTarget(date, hour) {
    return {
      onDragOver: event => {
        if (!dragging || saving) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      },
      onDrop: event => {
        event.preventDefault()
        if (!dragging || saving) return
        const id = event.dataTransfer.getData('text/plain')
        const appointment = citas.find(c => c._id === id)
        setDragging('')
        if (appointment) moveAppointment(appointment, date, hour)
      },
    }
  }

  function eventCard(c, compact = false, draggable = true) {
    const patient = c.patient?.name || 'Paciente'
    const type = TYPES[c.tipo] || 'Consulta'
    const status = STATES[c.estado] || STATES.programada
    const time = formatTime(c.inicio)
    return (
      <button key={c._id} type="button"
        aria-label={`Editar cita de ${patient}, ${dateTitle(new Date(c.inicio))}, ${time}, ${status.label}`}
        draggable={draggable && !saving && c.estado !== 'cancelada'}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', c._id)
          setDragging(c._id)
        }}
        onDragEnd={() => setDragging('')}
        onClick={() => openEdit(c)}
        className={`block w-full min-w-0 rounded-xl border border-l-[3px] px-2.5 text-left shadow-sm transition hover:shadow-md ${FOCUS} ${status.color} ${compact ? 'py-1.5' : 'py-3'} ${dragging === c._id ? 'opacity-50' : ''}`}>
        <span className="block text-[11px] font-bold tabular-nums">
          {time}{!compact && ` – ${formatTime(c.fin)}`}
        </span>
        <span className={`block font-extrabold ${compact ? 'truncate text-xs' : 'break-words text-sm'}`}>{patient}</span>
        {!compact && (
          <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
            <span>{type}</span>
            <span className="rounded-full bg-white/55 px-1.5 py-0.5">{status.label}</span>
          </span>
        )}
      </button>
    )
  }

  function dayCards(date, mobile = false) {
    const key = dayKey(date)
    const events = byDay[key] || []
    return (
      <div key={key} {...dropTarget(date)}
        className={`flex min-w-0 flex-col gap-2 rounded-2xl border p-2 ${mobile ? 'min-h-36' : 'min-h-64'} ${key === today ? 'border-[#a3c6af] bg-[#e7f2e8]' : 'border-[#dce7dd] bg-[#f1f6ef]'} ${dragging ? 'hover:border-[#246b55] hover:bg-[#dfefe3]' : ''}`}>
        <button type="button" onClick={() => showDay(date)}
          aria-label={`Abrir ${dateTitle(date)}`} aria-current={key === today ? 'date' : undefined}
          className={`flex min-h-11 items-center justify-between gap-1 rounded-xl px-1.5 text-xs font-bold text-[#416458] hover:bg-white/70 ${FOCUS}`}>
          <span className="first-letter:uppercase">{mobile ? dateTitle(date) : DAYS[date.getDay()]}</span>
          <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm ${key === today ? 'bg-[#246b55] text-white' : 'bg-white/75 text-[#173f34]'}`}>{date.getDate()}</span>
        </button>
        {events.map(c => eventCard(c))}
        {!events.length && <p className="px-1 py-3 text-xs text-[#526d5d]">Sin citas</p>}
        <button type="button" onClick={() => openNew(date)} aria-label={`Nueva cita el ${dateTitle(date)}`}
          className={`mt-auto grid min-h-10 place-items-center rounded-xl border border-dashed border-[#adc5b6] text-[#246b55] hover:bg-white ${FOCUS}`}>
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>
    )
  }

  function dayTimeline() {
    const events = byDay[focusKey] || []
    const times = [...new Set([...hours, ...events.map(c => new Date(c.inicio).getHours())])].sort((a, b) => a - b)
    return (
      <div className="relative space-y-1 px-3 pb-5 sm:px-6">
        {times.map(hour => {
          const booked = events.filter(c => new Date(c.inicio).getHours() === hour)
          const label = `${pad(hour)}:00`
          return (
            <div key={hour} {...dropTarget(focus, hour)}
              className={`grid min-h-12 grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-3 rounded-2xl p-1 sm:grid-cols-[4rem_minmax(0,1fr)] ${dragging ? 'hover:bg-[#dfefe3]' : ''}`}>
              <span className="pt-3 text-xs font-bold tabular-nums text-[#526d5d]">{label}</span>
              <div className="min-w-0 space-y-2 border-l-2 border-[#d2e3d6] pl-3">
                {booked.map(c => eventCard(c))}
                {!booked.length && (
                  <button type="button" onClick={() => openNew(focus, hour)}
                    aria-label={`Nueva cita a las ${label}`}
                    className={`flex min-h-10 w-full items-center gap-2 rounded-xl border border-dashed border-[#c2d6c8] px-3 text-left text-xs font-semibold text-[#416458] hover:bg-[#e6f1e7] ${FOCUS}`}>
                    <Plus size={14} aria-hidden="true" /> {dragging ? `Soltar a las ${label}` : 'Agregar cita'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const inputClass = `w-full min-w-0 rounded-xl border border-[#cadfd1] bg-[#f8fbf7] px-3 py-3 text-sm text-[#173f34] ${FOCUS}`

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-6 pb-16 text-[#173f34] sm:px-5 md:px-8 md:py-8">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-linear-to-br from-[#173f34] via-[#205343] to-[#246b55] p-5 text-[#f1f8ee] shadow-[0_16px_36px_rgba(23,63,52,.19)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-36 -z-10 size-96 rounded-full border-[32px] border-white/5 ring-[30px] ring-white/5" />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-[#d0e9d3] uppercase">
              <CalendarDays size={16} aria-hidden="true" /> NutriA · Consultorio
            </p>
            <h1 className="text-3xl leading-tight font-black tracking-tight sm:text-4xl">Agenda de citas</h1>
            <p className="mt-2 text-sm text-[#d9eddd]">Organiza tus consultas y haz espacio para tu próxima cita.</p>
          </div>
          <button type="button" onClick={() => openNew(focus)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#dcefcf] px-5 py-3 text-sm font-extrabold text-[#173f34] shadow-sm hover:bg-[#eef8e8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto">
            <Plus size={18} aria-hidden="true" /> Nueva cita
          </button>
        </div>
      </header>

      {error && !modal && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loadError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{loadError}</p>}
      {notice && <p role="status" className="rounded-xl bg-[#e4f2e7] p-3 text-sm text-[#205d48]">{notice}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_15rem] 2xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-label="Calendario de citas" aria-busy={loading} className={`${PANEL} min-w-0`}>
          <div className="space-y-4 px-4 pt-5 pb-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-widest text-[#526d5d] uppercase">Calendario</p>
                <h2 className="mt-1 text-xl font-black tracking-tight first-letter:uppercase sm:text-2xl">{period}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5" aria-label="Navegación del calendario">
                <button type="button" aria-label="Periodo anterior" onClick={() => navigate(-1)} className={CONTROL}><ChevronLeft size={17} aria-hidden="true" /></button>
                <button type="button" onClick={() => setFocus(new Date())} className={CONTROL}>Hoy</button>
                <button type="button" aria-label="Periodo siguiente" onClick={() => navigate(1)} className={CONTROL}><ChevronRight size={17} aria-hidden="true" /></button>
                <button type="button" aria-label="Actualizar agenda" onClick={load} disabled={loading} className={CONTROL}>
                  <RefreshCw size={16} aria-hidden="true" className={loading ? 'motion-safe:animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div role="group" aria-label="Vista del calendario" className="grid w-full grid-cols-4 rounded-xl bg-[#e6efe6] p-1 sm:flex sm:w-auto">
                {VIEWS.map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}
                    className={`min-h-10 rounded-lg px-2.5 text-xs font-bold sm:px-4 ${FOCUS} ${view === value ? 'bg-[#246b55] text-white shadow-sm' : 'text-[#416458] hover:bg-white/80'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <select aria-label="Filtrar por estado" value={filter} onChange={e => setFilter(e.target.value)} className={CONTROL}>
                <option value="todas">Todos los estados</option>
                {Object.entries(STATES).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}
              </select>
            </div>
            {loading && <p role="status" className="text-xs font-semibold text-[#526d5d]">Cargando citas…</p>}
            {!loading && !loadError && !visibleDays.length && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e7f1e6] px-4 py-3 text-sm">
                <p className="font-semibold">{filter === 'todas' ? 'No hay citas en este periodo.' : 'No hay citas con este estado.'}</p>
                <button type="button" onClick={filter === 'todas' ? () => openNew(focus) : () => setFilter('todas')} className={CONTROL}>
                  {filter === 'todas' ? 'Agendar cita' : 'Ver todos los estados'}
                </button>
              </div>
            )}
          </div>

          {view === 'semana' && (
            <div className="px-3 pb-5 sm:px-4">
              <div className="hidden grid-cols-7 gap-1.5 xl:grid">{range.days.map(d => dayCards(d))}</div>
              <div className="space-y-3 xl:hidden">
                <div role="group" aria-label="Día de la semana" className="grid grid-cols-7 gap-1">
                  {range.days.map(d => (
                    <button key={dayKey(d)} type="button" onClick={() => setFocus(d)}
                      aria-label={dateTitle(d)} aria-current={dayKey(d) === today ? 'date' : undefined} aria-pressed={dayKey(d) === focusKey}
                      className={`min-h-12 rounded-xl px-0.5 py-1 text-xs font-bold ${FOCUS} ${dayKey(d) === focusKey ? 'bg-[#246b55] text-white' : 'bg-[#e8f1e7] text-[#315d4d] hover:bg-[#dcecdf]'}`}>
                      <span className="block">{DAYS[d.getDay()]}</span><span className="block text-base">{d.getDate()}</span>
                    </button>
                  ))}
                </div>
                {dayCards(focus, true)}
              </div>
            </div>
          )}

          {view === 'dia' && dayTimeline()}

          {view === 'mes' && (
            <div className="px-2 pb-5 sm:px-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {WEEKDAYS.map(d => <div key={d} className="py-1 text-center text-xs font-bold text-[#526d5d]">{d}</div>)}
                {range.days.map(d => {
                  const key = dayKey(d)
                  const events = byDay[key] || []
                  return (
                    <div key={key} {...dropTarget(d)}
                      className={`min-h-12 min-w-0 rounded-xl border p-0.5 sm:min-h-24 sm:p-1.5 ${key === today ? 'border-[#a3c6af] bg-[#e3f0e4]' : 'border-[#e0e9de] bg-[#f1f6ef]'} ${d.getMonth() !== focus.getMonth() ? 'text-[#526d5d]' : ''} ${dragging ? 'hover:border-[#246b55] hover:bg-[#dfefe3]' : ''}`}>
                      <button type="button" onClick={() => showDay(d)}
                        aria-label={`Abrir ${dateTitle(d)}, ${events.length} citas`} aria-current={key === today ? 'date' : undefined}
                        className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-bold hover:bg-white/80 sm:flex-row sm:justify-between sm:px-1 ${FOCUS}`}>
                        <span className={`grid size-6 place-items-center rounded-full ${key === today ? 'bg-[#246b55] text-white' : ''}`}>{d.getDate()}</span>
                        {!!events.length && <span aria-hidden="true" className="rounded-full bg-[#dcecdf] px-1.5 text-[10px] text-[#205d48]">{events.length}</span>}
                      </button>
                      <div className="hidden space-y-1.5 lg:block">
                        {events.slice(0, 2).map(c => eventCard(c, true))}
                        {events.length > 2 && <button type="button" onClick={() => showDay(d)} className={`rounded px-1 text-xs font-bold text-[#246b55] hover:underline ${FOCUS}`}>+{events.length - 2} más</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'lista' && visibleDays.length > 0 && (
            <div className="space-y-4 px-4 pb-5 sm:px-6">
              {visibleDays.map(d => (
                <section key={dayKey(d)} {...dropTarget(d)} className={`rounded-2xl bg-[#edf4eb] p-3 sm:p-4 ${dragging ? 'hover:bg-[#dfefe3]' : ''}`}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold first-letter:uppercase">
                    <CalendarDays size={16} aria-hidden="true" /> {dateTitle(d)}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">{byDay[dayKey(d)].map(c => eventCard(c))}</div>
                </section>
              ))}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-[1.75rem] border-t border-[#dce7dd] bg-[#eff5ed] px-4 py-3 sm:px-6">
            {Object.entries(STATES).map(([key, status]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#416458]">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${status.dot}`} />{status.label}
              </span>
            ))}
            <p className="basis-full text-xs text-[#526d5d]">
              Abre una cita para editarla. En escritorio, arrástrala a otro día o a una hora en la vista Día.
            </p>
          </footer>
        </section>

        <aside aria-label="Resumen de agenda" className="grid min-w-0 gap-4 md:grid-cols-3 xl:grid-cols-1">
          <MiniCalendar focus={focus} today={today} onSelect={showDay} />
          <section className={`${PANEL} min-w-0 p-4`}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold"><Clock3 size={17} aria-hidden="true" /> Próximas citas</h2>
            <p className="mt-1 mb-3 text-xs text-[#526d5d]">En el periodo visible</p>
            <div className="space-y-2">{upcoming.slice(0, 3).map(c => (
              <div key={c._id}>
                <p className="mb-1 text-xs font-semibold text-[#526d5d] first-letter:uppercase">{dateTitle(new Date(c.inicio))}</p>
                {eventCard(c, true, false)}
              </div>
            ))}</div>
            {!upcoming.length && <p className="rounded-xl bg-[#eaf2e8] p-3 text-xs text-[#416458]">{loading ? 'Cargando…' : 'Sin próximas citas en esta vista.'}</p>}
          </section>
          <section className={`${PANEL} min-w-0 p-4`}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold"><CalendarDays size={17} aria-hidden="true" /> Google Calendar</h2>
            <p className="mt-1 text-xs font-medium text-[#526d5d]">{connected ? 'Cuenta conectada' : 'Cuenta sin conectar'}</p>
            <button type="button" disabled={calendarBusy} onClick={connected ? disconnect : connect} className={`${CONTROL} mt-3 w-full`}>
              {calendarBusy ? 'Procesando…' : connected ? 'Desconectar' : 'Conectar'}
            </button>
          </section>
        </aside>
      </div>
      <dialog ref={dialogRef} aria-labelledby="appointment-title"
        onCancel={e => { e.preventDefault(); if (!saving) setModal(false) }}
        onClick={e => { if (e.target === e.currentTarget && !saving) setModal(false) }}
        className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-3xl border border-[#cfe0d6] bg-[#f8fbf6] text-[#173f34] shadow-[0_24px_70px_rgba(16,46,36,.2)] backdrop:bg-[#102e24]/60 backdrop:backdrop-blur-[3px]">
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 id="appointment-title" className="text-xl font-extrabold">{editing ? 'Editar cita' : 'Nueva cita'}</h2>
              <p className="text-sm text-[#526d5d]">Completa los detalles de la consulta.</p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => setModal(false)} disabled={saving} className={CONTROL}>
              <X size={19} aria-hidden="true" />
            </button>
          </div>
          {(patientError || error) && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error || patientError}</p>}
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
              Paciente
              <select autoFocus required className={inputClass} value={form.patient} onChange={e => updateField('patient', e.target.value)}>
                <option value="">Selecciona un paciente</option>
                {pacientes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
              Inicio
              <input required type="datetime-local" className={inputClass} value={form.inicio} onChange={e => updateStart(e.target.value)} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
              Fin
              <input required type="datetime-local" className={inputClass} value={form.fin} onChange={e => updateField('fin', e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Tipo
              <select className={inputClass} value={form.tipo} onChange={e => updateField('tipo', e.target.value)}>
                {Object.entries(TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Estado
              <select className={inputClass} value={form.estado} onChange={e => updateField('estado', e.target.value)}>
                {Object.entries(STATES).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
              Notas
              <textarea maxLength={500} rows={2} className={inputClass} value={form.notas} onChange={e => updateField('notas', e.target.value)} placeholder="Opcional" />
            </label>
            <div className="flex flex-wrap justify-end gap-2 pt-2 sm:col-span-2">
              <button type="button" onClick={() => setModal(false)} disabled={saving} className={CONTROL}>Cancelar</button>
              <button type="submit" disabled={saving} className={`rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white hover:bg-[#1d5947] disabled:opacity-50 ${FOCUS}`}>
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar cita'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
