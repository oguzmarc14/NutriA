import { confirmarAccion } from '../utils/alertasAccion'
import { useEffect, useState } from 'react'
import client from '../api/client'

export default function CommunityModeracionPage() {
  const [pendientes, setPendientes] = useState([])
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')
  async function cargar() {
    try { const { data } = await client.get('/community/moderacion/pendientes'); setPendientes(data); setError('') }
    catch (e) { setError(e.response?.data?.message || 'No se pudo cargar la moderación') }
  }
  useEffect(() => { cargar() }, [])
  async function moderar(receta, aprobar) {
    const motivo = aprobar ? '' : window.prompt('Motivo del rechazo (obligatorio):')
    if (!aprobar && !motivo?.trim()) return
    setOcupado(receta._id)
    if (!(await confirmarAccion(aprobar ? '¿Aprobar esta receta?' : '¿Rechazar esta receta?'))) return
    try { await client.patch('/community/' + receta._id + '/moderar', { aprobar, motivo }); await cargar() }
    catch (e) { setError(e.response?.data?.message || 'No se pudo moderar la receta') }
    finally { setOcupado('') }
  }
  return <main className="mx-auto max-w-5xl space-y-5 p-5 md:p-8">
    <h1 className="text-2xl font-extrabold text-emerald-900">Moderación de NutriA Community</h1>
    <p className="text-sm text-slate-600">Revisa ingredientes, cantidades e instrucciones antes de aprobar. Aprobar no constituye certificación clínica.</p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {pendientes.map(r => <article key={r._id} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{r.titulo}</h2>
      <p className="text-sm text-slate-500">Por {r.autor?.name || 'Nutriólogo'} · {r.porciones} porciones</p>
      <p className="text-sm">{r.descripcion}</p>
      <h3 className="font-semibold">Ingredientes</h3>
      <ul className="list-inside list-disc text-sm">{r.ingredientes?.map((i,n) => <li key={n}>{i.cantidad} {i.unidad} de {i.nombre}</li>)}</ul>
      <h3 className="font-semibold">Preparación</h3>
      <ol className="list-inside list-decimal text-sm">{r.instrucciones?.map((p,n) => <li key={n}>{p}</li>)}</ol>
      <div className="flex gap-2"><button disabled={ocupado === r._id} onClick={() => moderar(r,true)} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Aprobar</button><button disabled={ocupado === r._id} onClick={() => moderar(r,false)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Rechazar</button></div>
    </article>)}
    {!pendientes.length && !error && <p className="rounded-2xl bg-white p-6 text-sm text-slate-600">No hay recetas pendientes.</p>}
  </main>
}
