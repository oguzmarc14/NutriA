import { useEffect, useState } from 'react'
import client from '../api/client'

const initial = { patient: '', inicio: '', fin: '', tipo: 'seguimiento', estado: 'programada', notas: '' }
const datetime = value => value ? new Date(value).toLocaleString('es-MX') : ''
export default function CitasPage() {
  const [citas, setCitas] = useState([])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [pacientes, setPacientes] = useState([])
  const [form, setForm] = useState(initial)
  const [editando, setEditando] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(false)
  async function cargar() {
    try {
      const [a,b] = await Promise.all([client.get('/citas'), client.get('/pacientes')])
      setCitas(a.data)
      setPacientes(Array.isArray(b.data) ? b.data : b.data.pacientes || b.data.data || [])
    } catch(e) { setError(e.response?.data?.message || 'No se pudo cargar la agenda') }
  }
  useEffect(() => { cargar(); client.get('/calendar/status').then(({data}) => setCalendarConnected(data.connected)).catch(() => {}) }, [])
  async function conectarCalendar() {
    setCalendarLoading(true)
    try { const {data} = await client.get('/calendar/connect'); window.location.assign(data.url) }
    catch(e) { setError(e.response?.data?.message || 'No se pudo iniciar la conexión con Google') ; setCalendarLoading(false) }
  }
  async function desconectarCalendar() {
    setCalendarLoading(true)
    try { await client.delete('/calendar/disconnect'); setCalendarConnected(false); setAviso('Google Calendar desconectado. Las citas siguen guardadas en NutriA.') }
    catch(e) { setError(e.response?.data?.message || 'No se pudo desconectar') }
    finally { setCalendarLoading(false) }
  }
  async function guardar(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    if (!form.patient || !form.inicio || !form.fin) { setError('Completa paciente, inicio y fin'); return }
    setCargando(true)
    try {
      const payload = { ...form, inicio: new Date(form.inicio).toISOString(), fin: new Date(form.fin).toISOString(), zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone }
      const respuesta = editando ? await client.put('/citas/' + editando, payload) : await client.post('/citas', payload)
      const sincronizado = respuesta.data.calendarSynced
      setForm(initial)
      setEditando('')
      setAviso((editando ? 'Cita actualizada' : 'Cita registrada') + (calendarConnected && !sincronizado ? '. No se pudo sincronizar con Google Calendar; la cita sí quedó guardada.' : ''))
      await cargar()
    } catch(e) { setError(e.response?.data?.message || 'No se pudo guardar la cita') }
    finally { setCargando(false) }
  }
  function editar(c) {
    const local = iso => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) }
    setForm({ patient: c.patient?._id || c.patient, inicio: local(c.inicio), fin: local(c.fin), tipo: c.tipo, estado: c.estado, notas: c.notas || '' })
    setEditando(c._id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const field = 'w-full rounded-xl border border-emerald-200 bg-white p-2.5 text-sm'
  return <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <header><h1 className="text-2xl font-extrabold text-emerald-900">Agenda de citas</h1><p className="text-sm text-slate-600">Registra, consulta y reprograma las citas de tus pacientes.</p></header>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-white p-4"><div><p className="font-bold text-emerald-900">Google Calendar</p><p className="text-sm text-slate-600">{calendarConnected ? 'Conectado: las citas nuevas se sincronizan con tu calendario.' : 'Conecta tu calendario para recibir avisos de tus consultas.'}</p></div><button type="button" disabled={calendarLoading} onClick={calendarConnected ? desconectarCalendar : conectarCalendar} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{calendarConnected ? 'Desconectar' : 'Conectar Google Calendar'}</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {aviso && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{aviso}</p>}
    <form onSubmit={guardar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-bold text-emerald-900">{editando ? 'Modificar cita' : 'Nueva cita'}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">Paciente<select required className={field} value={form.patient} onChange={e => setForm(f=>({...f,patient:e.target.value}))}><option value="">Seleccionar paciente</option>{pacientes.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></label>
        <label className="text-sm">Tipo<select className={field} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="primera">Primera consulta</option><option value="seguimiento">Seguimiento</option><option value="otra">Otra</option></select></label>
        <label className="text-sm">Inicio<input required type="datetime-local" className={field} value={form.inicio} onChange={e=>setForm(f=>({...f,inicio:e.target.value}))}/></label>
        <label className="text-sm">Fin<input required type="datetime-local" className={field} value={form.fin} onChange={e=>setForm(f=>({...f,fin:e.target.value}))}/></label>
        <label className="text-sm">Estado<select className={field} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}><option value="programada">Programada</option><option value="confirmada">Confirmada</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select></label>
        <label className="text-sm">Notas<input maxLength={500} className={field} value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/></label>
      </div>
      <div className="flex gap-2"><button disabled={cargando} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{editando ? 'Guardar cambios' : 'Registrar cita'}</button>{editando && <button type="button" className="rounded-xl border px-4" onClick={()=>{setForm(initial);setEditando('')}}>Cancelar edición</button>}</div>
    </form>
    <section className="space-y-3"><h2 className="text-lg font-bold text-emerald-900">Citas registradas</h2>{citas.map(c=><article key={c._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4"><div><p className="font-bold">{c.patient?.name || 'Paciente'}</p><p className="text-sm text-slate-600">{datetime(c.inicio)} – {datetime(c.fin)}</p><p className="text-xs text-slate-500">{c.tipo} · {c.estado}</p></div><button type="button" onClick={()=>editar(c)} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-800">Editar</button></article>)}{!citas.length && <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No hay citas en el periodo consultado.</p>}</section>
  </main>
}
