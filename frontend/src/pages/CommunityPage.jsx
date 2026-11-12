import { confirmarAccion } from '../utils/alertasAccion'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Search, Send, ShieldCheck, X } from 'lucide-react'
import client from '../api/client'

const empty = { titulo: '', descripcion: '', porciones: 1, ingredientes: [{ nombre: '', cantidad: 1, unidad: 'g' }], instrucciones: [''] }
const message = error => error.response?.data?.message || 'No fue posible completar la operación'

export default function CommunityPage() {
  const [tab, setTab] = useState('explorar')
  const [publicas, setPublicas] = useState([])
  const [mias, setMias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(empty)
  const [crear, setCrear] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)

  async function cargar() {
    setCargando(true)
    try {
      const [a, b] = await Promise.all([client.get('/community'), client.get('/community/mias')])
      setPublicas(a.data)
      setMias(b.data)
      setError('')
    } catch (e) { setError(message(e)) }
    finally { setCargando(false) }
  }
  useEffect(() => { cargar() }, [])
  const recetas = useMemo(() => (tab === 'explorar' ? publicas : mias)
    .filter(r => (r.titulo + ' ' + r.descripcion).toLowerCase().includes(busqueda.toLowerCase())), [tab, publicas, mias, busqueda])

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    if (!(await confirmarAccion('¿Guardar esta receta?'))) return
    try {
      await client.post('/community', {
        ...form,
        porciones: Number(form.porciones),
        ingredientes: form.ingredientes.map(i => ({ ...i, cantidad: Number(i.cantidad) })),
        instrucciones: form.instrucciones.filter(Boolean),
      })
      setForm(empty)
      setCrear(false)
      setTab('mias')
      setAviso('Receta guardada como privada. Puedes enviarla a la comunidad cuando quieras.')
      await cargar()
    } catch (e) { setError(message(e)) }
  }

  async function publicar(id) {
    if (!(await confirmarAccion('¿Enviar la receta a revisión?'))) return
    try {
      const { data } = await client.post('/community/' + id + '/publicar')
      setAviso(data.estado === 'publicada' ? 'Receta publicada en la comunidad.' : 'Receta enviada a revisión.')
      await cargar()
    } catch (e) { setError(message(e)) }
  }

  const field = 'w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500'
  return <section className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-600 p-6 text-white">
      <div className="flex items-center gap-3"><BookOpen /><h1 className="text-2xl font-extrabold">NutriA Community</h1></div>
      <p className="mt-2 text-sm text-emerald-50">Recetas compartidas por profesionales de nutrición. Adáptalas a cada paciente.</p>
      <button type="button" onClick={() => setCrear(!crear)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-800"><Plus size={17}/> Crear receta</button>
    </header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {aviso && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{aviso}</p>}
    {crear && <form onSubmit={guardar} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-bold text-emerald-900">Nueva receta privada</h2><button type="button" aria-label="Cerrar" onClick={() => setCrear(false)}><X/></button></div>
      <input className={field} required minLength={3} maxLength={120} placeholder="Nombre de la receta" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}/>
      <textarea className={field} maxLength={1200} placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}/>
      <label className="block text-sm font-semibold">Porciones <input className={field} type="number" min="1" max="100" required value={form.porciones} onChange={e => setForm(f => ({ ...f, porciones: e.target.value }))}/></label>
      <h3 className="font-bold">Ingredientes</h3>
      {form.ingredientes.map((i, n) => <div key={n} className="grid grid-cols-[1fr_80px_85px] gap-2">
        <input className={field} required placeholder="Ingrediente" value={i.nombre} onChange={e => setForm(f => ({ ...f, ingredientes: f.ingredientes.map((v,j) => j === n ? { ...v, nombre: e.target.value } : v) }))}/>
        <input className={field} type="number" min=".01" step="any" required aria-label="Cantidad" value={i.cantidad} onChange={e => setForm(f => ({ ...f, ingredientes: f.ingredientes.map((v,j) => j === n ? { ...v, cantidad: e.target.value } : v) }))}/>
        <input className={field} required aria-label="Unidad" value={i.unidad} onChange={e => setForm(f => ({ ...f, ingredientes: f.ingredientes.map((v,j) => j === n ? { ...v, unidad: e.target.value } : v) }))}/>
      </div>)}
      <button type="button" className="text-sm font-semibold text-emerald-700" onClick={() => setForm(f => ({ ...f, ingredientes: [...f.ingredientes, { nombre: '', cantidad: 1, unidad: 'g' }] }))}>+ Otro ingrediente</button>
      <h3 className="font-bold">Preparación</h3>
      {form.instrucciones.map((paso,n) => <textarea key={n} className={field} required placeholder={'Paso ' + (n + 1)} value={paso} onChange={e => setForm(f => ({ ...f, instrucciones: f.instrucciones.map((v,j) => j === n ? e.target.value : v) }))}/>)}
      <button type="button" className="text-sm font-semibold text-emerald-700" onClick={() => setForm(f => ({ ...f, instrucciones: [...f.instrucciones, ''] }))}>+ Otro paso</button>
      <div><button type="submit" className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white">Guardar en mis recetas</button></div>
    </form>}
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => setTab('explorar')} className={'rounded-xl px-4 py-2 text-sm font-bold ' + (tab === 'explorar' ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-800')}>Comunidad</button>
      <button type="button" onClick={() => setTab('mias')} className={'rounded-xl px-4 py-2 text-sm font-bold ' + (tab === 'mias' ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-800')}>Mis recetas</button>
      <label className="flex min-w-48 flex-1 items-center gap-2 rounded-xl bg-white px-3"><Search size={17}/><input className="w-full py-3 text-sm outline-none" placeholder="Buscar recetas" value={busqueda} onChange={e => setBusqueda(e.target.value)}/></label>
    </div>
    {cargando && <p className="text-sm text-slate-500">Cargando recetas...</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {recetas.map(r => <article key={r._id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{r.estado === 'publicada' ? 'Publicada' : r.estado === 'pendiente' ? 'En revisión' : r.estado === 'rechazada' ? 'Rechazada' : 'Privada'}</span>{r.origen === 'oficial' && <ShieldCheck className="text-emerald-600" size={18}/>}</div>
        <h2 className="text-lg font-bold text-emerald-950">{r.titulo}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.descripcion || 'Receta de la comunidad'}</p>
        <p className="mt-3 text-xs text-slate-500">{r.porciones} porciones · {r.ingredientes?.length || 0} ingredientes</p>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800" onClick={() => setSeleccionada(r)}>Ver receta</button>
        {tab === 'mias' && ['privada','rechazada'].includes(r.estado) && <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => publicar(r._id)}><Send size={14}/> Compartir</button>}</div>
      </article>)}
    </div>
    {!cargando && !recetas.length && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Todavía no hay recetas en esta sección.</p>}
    {seleccionada && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setSeleccionada(null)}>
      <div role="dialog" aria-modal="true" aria-label="Detalle de receta" className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between"><h2 className="text-xl font-bold">{seleccionada.titulo}</h2><button type="button" aria-label="Cerrar" onClick={() => setSeleccionada(null)}><X/></button></div>
        <p className="my-3 text-sm">{seleccionada.descripcion}</p><h3 className="font-bold">Ingredientes</h3>
        <ul className="my-2 list-inside list-disc text-sm">{seleccionada.ingredientes?.map((i,n) => <li key={n}>{i.cantidad} {i.unidad} de {i.nombre}</li>)}</ul>
        <h3 className="font-bold">Preparación</h3><ol className="my-2 list-inside list-decimal text-sm">{seleccionada.instrucciones?.map((s,n) => <li key={n}>{s}</li>)}</ol>
        <p className="mt-3 text-xs text-slate-500">Los valores nutricionales requieren verificación profesional antes de asignar la receta a un paciente.</p>
      </div>
    </div>}
  </section>
}
