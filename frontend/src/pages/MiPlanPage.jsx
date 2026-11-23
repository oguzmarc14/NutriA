import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, Download, History, X } from 'lucide-react'
import client from '../api/client'
import { exportarPlanPDF } from '../utils/exportarPlanPDF'
import CardPlanPaciente from '../components/paciente/CardPlanPaciente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function hoyLocal() {
  const hoy = new Date()
  const diferencia = hoy.getTimezoneOffset() * 60000
  return new Date(hoy.getTime() - diferencia).toISOString().slice(0, 10)
}
const fechaInicio = plan => (plan.fechaInicio || plan.createdAt || '').slice(0, 10)
const fechaLegible = valor => {
  if (!valor) return 'Sin fecha'
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(anio, mes - 1, dia))
}

function MiPlanPage() {
  const { perfil, loading, error, recargar } = usePerfilPaciente()
  const planes = perfil?.planes || []
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyLocal)
  const [errorExportacion, setErrorExportacion] = useState('')
  const [aceptando,setAceptando] = useState(false)
  const [errorAceptacion,setErrorAceptacion] = useState('')
  const [confirmarPlan,setConfirmarPlan] = useState(null)

  // fechaInicio define desde qué día se puede consultar cada plan.
  // No exigimos igualdad exacta: de otro modo la dieta desaparecía al día siguiente.
  const planesOrdenados = useMemo(() =>
    [...planes].sort((a, b) =>
      fechaInicio(b).localeCompare(fechaInicio(a)) ||
      (b.createdAt || '').localeCompare(a.createdAt || '')
    ), [planes])
  const planDelDia = planesOrdenados.find(plan => fechaInicio(plan) && fechaInicio(plan) <= fechaSeleccionada)
  const tienePlanes = planesOrdenados.length > 0

  async function aceptarPlan() {
    if (!confirmarPlan || aceptando) return
    setAceptando(true);setErrorAceptacion('')
    try {
      await client.patch('/mi-perfil/planes/' + confirmarPlan._id + '/aceptar')
      setConfirmarPlan(null)
      await recargar()
    } catch(error) {setErrorAceptacion(error.response?.data?.message||'No se pudo confirmar la dieta.')}
    finally {setAceptando(false)}
  }
  function guardarPDF() {
    if (!planDelDia) return
    try { exportarPlanPDF(planDelDia, perfil?.paciente) }
    catch (err) { setErrorExportacion(err.message || 'No se pudo generar la dieta para imprimir.') }
  }

  return (
    <section className="mx-auto min-w-0 max-w-[1480px] overflow-x-hidden p-4 sm:p-5 md:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi alimentación</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mi plan alimenticio</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">Consulta la dieta correspondiente al día y registra el cumplimiento de cada comida.</p>
        </div>
        <label className="block w-full max-w-56 min-w-0">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#48685c]"><CalendarDays size={17}/>Fecha del menú</span>
          <input type="date" value={fechaSeleccionada} onChange={event => setFechaSeleccionada(event.target.value)}
            className="block min-w-0 w-full rounded-xl border border-[#c9ddd3] bg-white px-3 py-2 text-sm font-bold text-[#173f34] outline-none focus:border-[#4d816f]"/>
        </label>
      </div>
      {tienePlanes && <details className="mb-5 overflow-hidden rounded-2xl border border-[#c9ddd3] bg-white/80">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-extrabold text-[#246b55]">
          <History size={17}/>Historial de dietas ({planesOrdenados.length})
        </summary>
        <div className="max-h-64 space-y-1 overflow-y-auto border-t border-[#e0ebe3] p-2">
          {planesOrdenados.map(plan => <button key={plan._id} type="button"
            onClick={event => {
              setFechaSeleccionada(fechaInicio(plan))
              event.currentTarget.closest('details').open = false
            }}
            className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-[#edf5ef]">
            <span className="font-bold text-[#173f34]">{plan.nombre}</span>
            <span className="text-xs font-semibold text-[#648073]">{fechaLegible(fechaInicio(plan))}</span>
          </button>)}
        </div>
      </details>}
      {errorExportacion && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#173f34]/60 p-4" role="presentation">
        <div role="alertdialog" aria-modal="true" aria-labelledby="error-pdf-paciente" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-3 flex items-center gap-2 text-[#9f4f29]"><X size={22}/><h2 id="error-pdf-paciente" className="text-lg font-extrabold">No se pudo abrir el PDF</h2></div>
          <p className="text-sm text-[#5e7468]">{errorExportacion}</p>
          <button type="button" autoFocus onClick={() => setErrorExportacion('')} className="mt-5 w-full rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white">Entendido</button>
        </div>
      </div>}
      {confirmarPlan&&<div role="presentation" className="fixed inset-0 z-[160] grid place-items-center bg-black/60 p-4">
        <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-aceptacion" className="w-full max-w-md rounded-2xl bg-white p-6">
          <h2 id="titulo-aceptacion" className="text-xl font-extrabold text-[#173f34]">¿Confirmar que recibiste tu dieta?</h2>
          <p className="mt-2 text-sm text-[#536e61]">Avisaremos al nutriólogo que recibiste este plan. La confirmación no evalúa tu alimentación ni tus resultados.</p>
          {!!errorAceptacion&&<p role="alert" className="text-red-700">{errorAceptacion}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={aceptando} onClick={()=>setConfirmarPlan(null)}
              className="min-h-11 flex-1 rounded-xl border px-4">Cancelar</button>
            <button type="button" disabled={aceptando} onClick={()=>void aceptarPlan()}
              className="min-h-11 flex-1 rounded-xl bg-[#246b55] px-4 font-bold text-white">
              {aceptando?'Confirmando…':'Confirmar recepción'}
            </button>
          </div>
        </div>
      </div>}
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && !tienePlanes}>
        {planDelDia
          ? <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-[#cfe2d5] bg-[#edf6ee] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#416d52]">
                  <Clock3 size={16} className="shrink-0"/>Dieta aplicable desde el {fechaLegible(fechaInicio(planDelDia))}. Las horas de cada comida aparecen debajo.
                </p>
                <button type="button" onClick={guardarPDF} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#1c5a45]">
                  <Download size={17}/>Guardar / imprimir PDF
                </button>
              </div>
              {planDelDia.aceptacionPaciente?.estado === 'aceptada' ?
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  Dieta recibida y confirmada. Tu nutriólogo puede ver la confirmación.
                </p> :
                <div className="rounded-2xl border border-[#c9ddd3] bg-white p-4">
                  <p className="text-sm text-[#476857]">Confirmar recepción no implica haber completado la dieta.</p>
                  <button type="button" onClick={() => setConfirmarPlan(planDelDia)}
                    className="mt-3 min-h-11 rounded-xl bg-[#246b55] px-4 py-2 text-sm font-bold text-white">
                    Confirmar que recibí la dieta
                  </button>
                  {!!errorAceptacion&&<p role="alert" className="mt-2 text-sm text-red-700">{errorAceptacion}</p>}
                </div>}
              <CardPlanPaciente key={planDelDia._id} fecha={fechaSeleccionada} plan={planDelDia}
                seguimientos={perfil?.seguimientosComida || []} onSeguimientoGuardado={recargar}/>
            </div>
          : <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-10 text-center">
              <CalendarDays className="mx-auto mb-3 text-[#4d816f]" size={32}/>
              <p className="font-extrabold text-[#173f34]">{tienePlanes ? 'No hay una dieta asignada para esta fecha' : 'Todavía no tienes una dieta asignada'}</p>
              <p className="mt-1 text-sm text-slate-500">{tienePlanes ? 'Selecciona una fecha posterior al inicio de tu primer plan o elige una dieta del historial.' : 'Tu nutriólogo podrá asignarte un plan alimenticio.'}</p>
            </div>}
      </EstadoCargaPaciente>
    </section>
  )
}

export default MiPlanPage
