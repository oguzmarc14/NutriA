import { useEffect, useMemo, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

export default function RecetasDietasPanel() {
  const [abierto, setAbierto] = useState(false)
  const [recetas, setRecetas] = useState([])
  const [mias, setMias] = useState([])
  const [error, setError] = useState('')
  const [buscar, setBuscar] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)
  useEffect(() => {
    if (!abierto) return
    let vigente = true
    Promise.all([client.get('/community'), client.get('/community/mias')])
      .then(([a,b]) => { if (vigente) { setRecetas(a.data); setMias(b.data); setError('') } })
      .catch(() => { if (vigente) setError('No se pudieron cargar las recetas') })
    return () => { vigente = false }
  }, [abierto])
  const opciones = useMemo(() => [...mias, ...recetas.filter(r => !mias.some(m => m._id === r._id))]
    .filter(r => r.titulo.toLowerCase().includes(buscar.toLowerCase())), [mias, recetas, buscar])
  return <div className="my-4 rounded-2xl border border-emerald-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="flex items-center gap-2 font-bold text-emerald-900"><BookOpen size={18}/> Biblioteca de recetas y platillos</h3><p className="text-xs text-slate-500">Consulta ingredientes y preparaciones sin salir de Dietas.</p></div>
      <button type="button" onClick={() => setAbierto(v => !v)} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">{abierto ? 'Cerrar biblioteca' : 'Ver recetas'}</button>
    </div>
    {abierto && <div className="mt-4 space-y-3">
      <input aria-label="Buscar receta" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar platillo o receta" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
        {opciones.map(r => <button type="button" key={r._id} onClick={() => setSeleccionada(r)} className="rounded-xl border border-emerald-100 p-3 text-left hover:bg-emerald-50"><strong className="block text-sm text-emerald-900">{r.titulo}</strong><span className="text-xs text-slate-500">{r.porciones} porciones · {r.ingredientes?.length} ingredientes</span></button>)}
      </div>
      {!opciones.length && !error && <p className="text-sm text-slate-500">No hay recetas que coincidan.</p>}
      <Link className="inline-block text-sm font-bold text-emerald-700 underline" to="/community">Crear o compartir recetas en NutriA Community</Link>
      {seleccionada && <div className="rounded-xl bg-emerald-50 p-4">
        <div className="flex items-start justify-between gap-2"><h4 className="font-bold">{seleccionada.titulo}</h4><button type="button" aria-label="Cerrar detalle" onClick={() => setSeleccionada(null)}><X size={18}/></button></div>
        <p className="mt-2 text-xs text-slate-600">Ingredientes para {seleccionada.porciones} porciones:</p>
        <ul className="mt-2 list-inside list-disc text-sm">{seleccionada.ingredientes?.map((i,n) => <li key={n}>{i.cantidad} {i.unidad} de {i.nombre}</li>)}</ul>
        <p className="mt-3 text-xs font-bold">Preparación</p><ol className="list-inside list-decimal text-sm">{seleccionada.instrucciones?.map((paso,n) => <li key={n}>{paso}</li>)}</ol>
        <p className="mt-3 text-xs text-amber-800">Vista de consulta. La inserción automática al plan requerirá vincular cada ingrediente con el catálogo y verificar sus valores nutricionales.</p>
      </div>}
    </div>}
  </div>
}
