import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, Copy, Trash2, X } from 'lucide-react'
import client from '../../api/client'
import { agruparPreparaciones } from '../../utils/agruparPreparaciones'
import { exportarPlanPDF } from '../../utils/exportarPlanPDF'

const errorMessage = error => error.response?.data?.message || 'No se pudo completar la operación.'
const fmt = date => date && !Number.isNaN(Date.parse(date))
  ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(date))
  : 'Sin fecha'

export default function MisDietasPanel() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState(null)
  const [exportError, setExportError] = useState('')
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    let active = true
    client.get('/community/mis-dietas')
      .then(({ data }) => { if (active) setRows(Array.isArray(data) ? data : []) })
      .catch(cause => { if (active) setError(errorMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => rows.filter(item =>
    item.nombre.toLocaleLowerCase('es-MX').includes(search.trim().toLocaleLowerCase('es-MX'))), [rows, search])

  async function openDiet(item) {
    if (busy) return
    setBusy(true); setError('')
    setExportError('')
    try {
      const { data } = await client.get('/community/mis-dietas/' + item._id)
      setOpened(data)
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  async function deleteDiet() {
    if (!toDelete || busy) return
    setBusy(true); setError('')
    try {
      await client.delete('/community/mis-dietas/' + toDelete._id)
      setRows(previous => previous.filter(item => item._id !== toDelete._id))
      setOpened(null)
      setToDelete(null)
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  function reuse(item) {
    // El editor exige elegir un paciente y completar sus requisitos clínicos.
    // No se edita el plan original: se precarga una copia privada.
    navigate('/planes?plantilla=' + encodeURIComponent(item._id))
  }

  return <section aria-labelledby="mis-dietas-title" className="space-y-4">
    <div className="rounded-2xl border border-[#cde0d2] bg-[#f0f7f0] p-4">
      <h2 id="mis-dietas-title" className="flex items-center gap-2 text-xl font-extrabold text-[#173f34]">
        <BookOpen size={23}/> Mis dietas
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#52715e]">
        Plantillas privadas guardadas con nombre y fecha. Puedes reutilizarlas con otros pacientes
        sin modificar el plan original. Revisa las notas para no incluir datos personales.
      </p>
    </div>
    <label className="block text-sm font-semibold text-[#315c49]">
      Buscar en Mis dietas
      <input type="search" value={search} onChange={event => setSearch(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-[#cedfd2] bg-white px-4 outline-none focus:border-emerald-600"
        placeholder="Nombre de dieta…" />
    </label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading && <p className="text-sm text-[#52715e]">Cargando tus dietas privadas…</p>}
    {!loading && !filtered.length && <p className="rounded-xl bg-white p-5 text-sm text-[#52715e]">
      {rows.length ? 'No hay dietas que coincidan con la búsqueda.' :
        'Todavía no tienes dietas guardadas. Guarda una copia después de crear un plan alimenticio.'}
    </p>}
    <div className="grid gap-3 md:grid-cols-2">
      {filtered.map(item => <article key={item._id}
        className="rounded-2xl border border-[#d3e4d9] bg-white p-5 shadow-sm">
        <h3 className="break-words text-lg font-extrabold text-[#173f34]">{item.nombre}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-[#587662]">
          <CalendarDays size={15} /> Guardada {fmt(item.fechaGuardado)}
        </p>
        <p className="mt-1 text-sm text-[#587662]">{item.comidasCount} comidas
          {item.metaEnergiaKcal != null ? ' · ' + item.metaEnergiaKcal + ' kcal objetivo' : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => reuse(item)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246b55] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            <Copy size={16}/> Usar con paciente
          </button>
          <button type="button" disabled={busy} onClick={() => openDiet(item)}
            className="min-h-11 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-800">
            Ver dieta
          </button>
          <button type="button" disabled={busy} onClick={() => setToDelete(item)}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700">
            <Trash2 size={16}/> Eliminar copia
          </button>
        </div>
      </article>)}
    </div>
    {opened && <div role="presentation" className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"
      onClick={() => setOpened(null)}>
      <div role="dialog" aria-modal="true" aria-label="Dieta guardada"
        className="max-h-[85vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
        onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><h3 className="text-xl font-extrabold text-[#173f34]">{opened.nombre}</h3>
            <p className="text-xs text-[#52715e]">Guardada {fmt(opened.fechaGuardado)}</p></div>
          <button type="button" aria-label="Cerrar" onClick={() => setOpened(null)}><X /></button>
        </div>
        {!opened.plan?.comidas?.length && <p className="text-sm text-[#52715e]">Esta dieta no tiene comidas registradas.</p>}
        {(opened.plan?.comidas || []).map((meal, index) => <div key={index} className="rounded-xl bg-[#f0f7f0] p-4">
          <h4 className="font-bold text-[#173f34]">{meal.nombre} {meal.hora ? '· ' + meal.hora : ''}</h4>
          {!!meal.descripcion && <p className="mt-2 text-sm text-[#52715e]">{meal.descripcion}</p>}
          {!meal.alimentos?.length && <p className="mt-2 text-sm text-[#52715e]">Comida sin ingredientes registrados.</p>}
          {agruparPreparaciones(meal).map(group => <div key={group.id} className="mt-3 rounded-xl bg-white p-3">
            <h5 className="text-sm font-bold text-[#246b55]">{group.tipo === 'bebida' ? 'Bebida' : 'Platillo'} · {group.nombre || 'Sin nombre'}</h5>
            <ul className="mt-2 space-y-2 text-sm text-[#315c49]">
              {group.alimentos.map((food, i) => <li key={i}>
                <strong>{food.nombre}</strong> · {food.cantidad} {food.cantidad === 1 ? 'porción' : 'porciones'}
                {food.notas && <p>{food.notas}</p>}
              </li>)}
            </ul>
          </div>)}
        </div>)}
        {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
        {!!opened.plan?.comidas?.length && <button type="button" onClick={() => {
          setExportError('')
          try { exportarPlanPDF({ ...opened.plan, nombre: opened.nombre }, null, { plantilla: true }) }
          catch (cause) { setExportError(cause.message) }
        }} className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800">
          Exportar PDF
        </button>}
        <button type="button" onClick={() => reuse(opened)}
          className="w-full rounded-xl bg-[#246b55] px-4 py-3 text-sm font-bold text-white">Usar esta dieta con paciente</button>
      </div>
    </div>}
    {toDelete && <div role="presentation" className="fixed inset-0 z-[110] grid place-items-center bg-black/60 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="eliminar-copia-title"
        className="w-full max-w-md rounded-3xl bg-white p-6">
        <h3 id="eliminar-copia-title" className="text-xl font-bold text-red-800">Eliminar copia privada</h3>
        <p className="mt-3 text-sm text-[#476354]">
          Se eliminará «{toDelete.nombre}» de Mis dietas, sin modificar el plan de ningún paciente.
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" disabled={busy} onClick={() => setToDelete(null)}
            className="min-h-11 flex-1 rounded-xl border border-[#cee2d2] px-3 text-sm font-bold">Cancelar</button>
          <button type="button" disabled={busy} onClick={() => void deleteDiet()}
            className="min-h-11 flex-1 rounded-xl bg-red-700 px-3 text-sm font-bold text-white">
            {busy ? 'Eliminando…' : 'Eliminar copia'}
          </button>
        </div>
      </div>
    </div>}
  </section>
}
