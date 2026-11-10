import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Apple, ArrowRight, CalendarDays, ChevronDown, ChevronUp, Clock3,
  Download, FileText, LoaderCircle, Pencil, Plus, Search, UserRound,
  Utensils, RefreshCw,
} from 'lucide-react'
import client from '../api/client'
import { exportarPlanPDF } from '../utils/exportarPlanPDF'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'

const formatoNumero = (valor, decimales = 1) =>
  Number(valor || 0).toLocaleString('es-MX', { maximumFractionDigits: decimales })

const formatoFecha = fecha => {
  if (!fecha) return 'Sin fecha'
  const valor = new Date(fecha)
  return Number.isNaN(valor.getTime())
    ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(valor)
}
const formatoHora = hora => {
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) return 'Sin horario'
  const [h, m] = hora.split(':').map(Number)
  return String(h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' p. m.' : ' a. m.')
}
function totales(alimentos = []) {
  return alimentos.reduce((total, alimento) => {
    const cantidad = Number(alimento.cantidad) || 0
    for (const nutrimento of ['kcal', 'proteina', 'carbohidratos', 'grasas']) {
      total[nutrimento] += (Number(alimento.nutrimentos?.[nutrimento]) || 0) * cantidad
    }
    return total
  }, { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 })
}

function TarjetaDieta({ plan, paciente, onEditar, onError }) {
  const [abierta, setAbierta] = useState(false)
  const comidas = useMemo(() =>
    [...(plan.comidas || [])].sort((a, b) => (a.hora || '99:99').localeCompare(b.hora || '99:99')),
  [plan.comidas])
  const total = useMemo(() =>
    totales(comidas.flatMap(comida => comida.alimentos || [])), [comidas])
  function exportar() {
    try { exportarPlanPDF(plan, paciente) }
    catch (error) { onError(error.message || 'No fue posible exportar la dieta.') }
  }
  return (
    <article className="overflow-hidden rounded-3xl border border-[#d1e2d7] bg-white shadow-[0_12px_32px_rgba(32,78,64,.06)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf5ed] px-3 py-1 text-xs font-bold text-[#426b55]"><CalendarDays size={13}/>{formatoFecha(plan.fechaInicio || plan.createdAt)}</span>
              <span className={'rounded-full px-3 py-1 text-xs font-bold ' + (plan.activo ? 'bg-[#e1f1e6] text-[#246b55]' : 'bg-[#f0ece7] text-[#746d66]')}>{plan.activo ? 'Activo' : 'Anterior'}</span>
            </div>
            <h3 className="break-words text-xl font-black text-[#173f34]">{plan.nombre || 'Plan sin nombre'}</h3>
            {plan.objetivo && <p className="mt-1 break-words text-sm text-[#647e70]">{plan.objetivo}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportar} title="Exportar a PDF" aria-label="Exportar dieta a PDF" className="grid size-10 place-items-center rounded-xl border border-[#d3e6d8] bg-[#f0f8f2] text-[#246b55] hover:bg-[#e0f0e6]"><Download size={18}/></button>
            <button type="button" onClick={() => onEditar(plan)} title="Editar dieta" aria-label="Editar dieta" className="grid size-10 place-items-center rounded-xl border border-[#d3e6d8] bg-[#f0f8f2] text-[#246b55] hover:bg-[#e0f0e6]"><Pencil size={17}/></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['Energía', formatoNumero(total.kcal, 0) + ' kcal'], ['Proteína', formatoNumero(total.proteina) + ' g'], ['Carbohidratos', formatoNumero(total.carbohidratos) + ' g'], ['Grasas', formatoNumero(total.grasas) + ' g']].map(([etiqueta, valor]) =>
            <div key={etiqueta} className="rounded-xl bg-[#f1f7f2] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#6c8576]">{etiqueta}</p>
              <p className="mt-0.5 text-sm font-extrabold tabular-nums text-[#173f34]">{valor}</p>
            </div>
          )}
        </div>
        <button type="button" aria-expanded={abierta} onClick={() => setAbierta(valor => !valor)}
          className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-[#cde0d4] px-4 py-3 text-left text-sm font-bold text-[#246b55] transition hover:bg-[#f1f8f3]">
          <span className="flex items-center gap-2"><Utensils size={17}/>{abierta ? 'Ocultar dieta' : 'Ver dieta completa'} · {comidas.length} comidas</span>
          {abierta ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
        </button>
      </div>
      {abierta && <div className="border-t border-[#dfebe1] bg-[#f9fcf9] px-4 py-5 sm:px-6">
        {!comidas.length
          ? <p className="rounded-xl border border-dashed border-[#d2e2d6] p-4 text-sm text-[#647e70]">Este plan todavía no tiene comidas registradas.</p>
          : <ol className="space-y-3">
              {comidas.map((comida, indice) => {
                const subtotal = totales(comida.alimentos || [])
                return <li key={comida._id || indice} className="overflow-hidden rounded-2xl border border-[#d6e5da] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eef5ee] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#d8ebe0] px-2 text-xs font-black text-[#246b55]"><Clock3 size={15}/>{formatoHora(comida.hora)}</span>
                      <div className="min-w-0"><p className="text-sm font-extrabold text-[#173f34]">{comida.nombre || 'Comida ' + (indice + 1)}</p>{comida.platillo && <p className="break-words text-xs text-[#617e6d]">{comida.platillo}</p>}</div>
                    </div>
                    <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#246b55]">{formatoNumero(subtotal.kcal, 0)} kcal</span>
                  </div>
                  <div className="space-y-2 p-3 sm:p-4">
                    {(comida.alimentos || []).length ? comida.alimentos.map((alimento, i) =>
                      <div key={alimento._id || i} className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#f7faf7] px-3 py-2">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-[#173f34]">{alimento.nombre}</p>
                          <p className="text-xs text-[#74897c]">{formatoNumero(alimento.cantidad || 0)} porción(es){alimento.porcion?.gramos != null ? ' · ' + formatoNumero(Number(alimento.porcion.gramos) * (Number(alimento.cantidad) || 0), 0) + ' g' : ''}</p>
                        </div>
                        <span className="text-xs font-bold text-[#416c54]">{formatoNumero((Number(alimento.nutrimentos?.kcal) || 0) * (Number(alimento.cantidad) || 0), 0)} kcal</span>
                      </div>
                    ) : <p className="text-sm text-[#74897c]">Sin alimentos individualizados.</p>}
                    {comida.descripcion && <p className="rounded-lg border-l-2 border-[#8cb79b] pl-3 text-xs text-[#647e70]">{comida.descripcion}</p>}
                  </div>
                </li>
              })}
            </ol>}
      </div>}
    </article>
  )
}

export default function ConsultarDietasPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { pacienteTrabajo, iniciarTrabajo } = usePacienteTrabajo()
  const pacienteSolicitado = params.get('paciente') || ''
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState(pacienteSolicitado || pacienteTrabajo?.id || '')
  const [planes, setPlanes] = useState([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [loadingPlanes, setLoadingPlanes] = useState(false)
  const [error, setError] = useState('')
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [busquedaDieta, setBusquedaDieta] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let vigente = true
    client.get('/pacientes').then(({data}) => {
      if (vigente) setPacientes(data.pacientes || [])
    }).catch(err => { if (vigente) setError(err.response?.data?.message || 'No se pudieron cargar los pacientes.') })
      .finally(() => { if (vigente) setLoadingPacientes(false) })
    return () => { vigente = false }
  }, [])

  useEffect(() => {
    if (pacienteSolicitado) setPacienteId(pacienteSolicitado)
  }, [pacienteSolicitado])

  useEffect(() => {
    if (!pacienteId) { setPlanes([]); return }
    let vigente = true
    setLoadingPlanes(true)
    setError('')
    setPlanes([])
    client.get('/planes/' + pacienteId).then(({data}) => {
      if (vigente) setPlanes(data.planes || [])
    }).catch(err => { if (vigente) setError(err.response?.data?.message || 'No se pudieron cargar las dietas.') })
      .finally(() => { if (vigente) setLoadingPlanes(false) })
    return () => { vigente = false }
  }, [pacienteId, revision])

  const paciente = pacientes.find(item => item._id === pacienteId)
  const encontrados = pacientes.filter(item => (item.name || '').toLocaleLowerCase('es-MX').includes(busquedaPaciente.toLocaleLowerCase('es-MX')))
  const dietasFiltradas = useMemo(() => planes.filter(plan => {
    const coincide = (plan.nombre + ' ' + (plan.objetivo || '')).toLocaleLowerCase('es-MX').includes(busquedaDieta.toLocaleLowerCase('es-MX'))
    return coincide && (filtro === 'todos' || (filtro === 'activos' ? plan.activo : !plan.activo))
  }).sort((a,b)=>new Date(b.fechaInicio || b.createdAt).getTime()-new Date(a.fechaInicio || a.createdAt).getTime()), [planes, busquedaDieta, filtro])

  function seleccionarPaciente(item) {
    setPacienteId(item._id)
    setError('')
    setBusquedaDieta('')
    setFiltro('todos')
    iniciarTrabajo(item)
  }
  function irACrear() {
    navigate('/planes' + (pacienteId ? '?paciente=' + encodeURIComponent(pacienteId) : ''))
  }
  function editar(plan) {
    navigate('/planes?paciente=' + encodeURIComponent(pacienteId) + '&editar=' + encodeURIComponent(plan._id))
  }
  return <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="rounded-[2rem] bg-gradient-to-br from-[#173f34] via-[#246b55] to-[#3e8064] p-5 text-white shadow-[0_16px_40px_rgba(22,70,52,.15)] sm:p-8">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-[#d6eddf]"><FileText size={16}/> Expediente nutricional</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Consultar dietas</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#e0f0e6]">Consulta los planes de cada paciente, sus comidas por hora y el desglose nutricional.</p></div>
        <button type="button" onClick={irACrear} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#246b55] hover:bg-[#ecf7ef]"><Plus size={18}/>Crear nueva dieta</button>
      </div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><span>{error}</span><button type="button" onClick={() => setError('')} className="rounded-lg border border-red-200 px-3 py-1.5">Entendido</button></div>}

    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-3xl border border-[#d1e2d7] bg-white p-4 shadow-sm lg:sticky lg:top-20">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-[#173f34]"><UserRound size={18}/> Pacientes</h2>
        <label className="relative block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789484]"/>
          <input type="search" value={busquedaPaciente} onChange={e => setBusquedaPaciente(e.target.value)}
            placeholder="Buscar paciente..." aria-label="Buscar paciente" className="w-full rounded-xl border border-[#d5e4d9] bg-[#f8fbf8] py-2.5 pl-10 pr-3 text-sm text-[#173f34] outline-none focus:border-[#549a73]"/>
        </label>
        <div className="mt-3 max-h-[360px] space-y-1.5 overflow-y-auto lg:max-h-[65vh]">
          {loadingPacientes && <p className="flex items-center gap-2 p-3 text-sm text-[#647e70]"><LoaderCircle size={16} className="animate-spin"/>Cargando pacientes…</p>}
          {!loadingPacientes && !encontrados.length && <p className="p-3 text-sm text-[#647e70]">No se encontraron pacientes.</p>}
          {!loadingPacientes && encontrados.map(item =>
            <button type="button" key={item._id} onClick={() => seleccionarPaciente(item)} aria-pressed={item._id === pacienteId}
              className={'flex min-h-12 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ' + (item._id === pacienteId ? 'bg-[#e3f2e8] font-extrabold text-[#205b42]' : 'text-[#52715e] hover:bg-[#f0f7f1]')}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d8eae0] text-xs font-black text-[#246b55]">{(item.name || 'P').charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate">{item.name || 'Paciente'}</span>
              {item._id === pacienteId && <ArrowRight size={16} className="shrink-0"/>}
            </button>
          )}
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        {!pacienteId ? <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#bdd7c8] bg-white/80 p-7 text-center"><div><UserRound size={40} className="mx-auto mb-3 text-[#679782]"/><h2 className="text-xl font-extrabold text-[#173f34]">Selecciona un paciente</h2><p className="mt-2 text-sm text-[#647e70]">Aquí aparecerán sus dietas asignadas y su historial nutricional.</p></div></div>
        : <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#d1e2d7] bg-white p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5b9272]">Dietas del paciente</p>
              <h2 className="mt-1 break-words text-xl font-extrabold text-[#173f34]">{paciente?.name || 'Paciente seleccionado'}</h2>
              <p className="text-xs text-[#698373]">{planes.length} {planes.length === 1 ? 'plan registrado' : 'planes registrados'} · {planes.filter(plan => plan.activo).length} activos</p>
            </div>
            <button type="button" onClick={() => setRevision(n => n + 1)} disabled={loadingPlanes} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe0d5] px-3 text-sm font-bold text-[#246b55] hover:bg-[#eef6f0] disabled:opacity-60"><RefreshCw size={16} className={loadingPlanes ? 'animate-spin' : ''}/>Actualizar</button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789484]"/>
              <input type="search" value={busquedaDieta} onChange={e => setBusquedaDieta(e.target.value)} placeholder="Buscar por nombre u objetivo..." aria-label="Buscar dietas" className="w-full rounded-xl border border-[#d1e2d7] bg-white py-3 pl-10 pr-3 text-sm text-[#173f34] outline-none focus:border-[#549a73]"/>
            </label>
            <select aria-label="Filtrar planes" value={filtro} onChange={e => setFiltro(e.target.value)} className="min-h-11 rounded-xl border border-[#d1e2d7] bg-white px-4 text-sm font-bold text-[#246b55]"><option value="todos">Todas las dietas</option><option value="activos">Activas</option><option value="anteriores">Anteriores</option></select>
          </div>
          {loadingPlanes ? <div className="rounded-3xl border border-[#d1e2d7] bg-white p-12 text-center text-sm text-[#647e70]"><LoaderCircle size={26} className="mx-auto mb-3 animate-spin text-[#246b55]"/>Cargando dietas…</div>
            : !dietasFiltradas.length ? <div className="rounded-3xl border border-dashed border-[#bdd7c8] bg-white p-8 text-center"><Apple size={34} className="mx-auto mb-3 text-[#6d987d]"/><h3 className="font-extrabold text-[#173f34]">{planes.length ? 'No hay dietas con estos filtros' : 'Este paciente todavía no tiene dietas'}</h3><p className="mt-1 text-sm text-[#647e70]">Puedes crear una dieta nueva en el editor alimenticio.</p><button type="button" onClick={irACrear} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-bold text-white"><Plus size={16}/>Crear dieta</button></div>
            : <div className="space-y-4">{dietasFiltradas.map(plan => <TarjetaDieta key={plan._id} plan={plan} paciente={paciente} onEditar={editar} onError={setError}/>)}</div>}
        </>}
      </section>
    </div>
  </main>
}
