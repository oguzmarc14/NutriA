import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, Download, History, X } from 'lucide-react'
import client from '../api/client'
import { exportarPlanPDF } from '../utils/exportarPlanPDF'
import CardPlanPaciente from '../components/paciente/CardPlanPaciente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

import CalendarioDietas from '../components/paciente/CalendarioDietas'
import { fechaActualDispositivo } from '../utils/vistasAgenda'
import { dietaParaFecha, fechaDietaLegible, inicioDieta, ordenarDietas, proximasDietas } from '../utils/calendarioDietas'

const sinPlanes = []

function MiPlanPage() {
  const { perfil, loading, error, recargar, guardarRegistroLocal } = usePerfilPaciente()
  const planes = perfil?.planes || sinPlanes
  const hoy = fechaActualDispositivo()
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaActualDispositivo)
  const [planElegido, setPlanElegido] = useState(null)
  const [errorExportacion, setErrorExportacion] = useState('')
  const [aceptando,setAceptando] = useState(false)
  const [errorAceptacion,setErrorAceptacion] = useState('')
  const [confirmarPlan,setConfirmarPlan] = useState(null)

  const planesOrdenados = useMemo(() => ordenarDietas(planes), [planes])
  const planVigente = dietaParaFecha(planesOrdenados, fechaSeleccionada)
  const planDelDia = planesOrdenados.find(plan => plan._id === planElegido) || planVigente
  const futuras = proximasDietas(planesOrdenados, hoy)
  const historial = planesOrdenados.filter(plan => inicioDieta(plan) <= hoy)
  const tienePlanes = planesOrdenados.length > 0
  const seguimientoDisponible = fechaSeleccionada <= hoy && planDelDia?._id === planVigente?._id
  function elegirFecha(fecha) {
    setFechaSeleccionada(fecha)
    setPlanElegido(null)
  }
  function elegirPlan(plan) {
    setFechaSeleccionada(inicioDieta(plan))
    setPlanElegido(plan._id)
  }

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
  async function guardarPDF() {
    if (!planDelDia) return
    try {
      await exportarPlanPDF(planDelDia, perfil?.paciente, {
        cargarClinica: async () => (await client.get('/mi-perfil/planes/' + encodeURIComponent(planDelDia._id) + '/marca', { timeout: 5000 })).data.clinica,
      })
    }
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
      </div>
      {perfil && <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <CalendarioDietas planes={planesOrdenados} hoy={hoy} fecha={fechaSeleccionada} onFecha={elegirFecha}/>
        <section aria-labelledby="proximas-dietas" className="min-w-0 rounded-3xl border border-[#c9ddd3] bg-white/85 p-4 sm:p-5">
          <h2 id="proximas-dietas" className="flex items-center gap-2 font-extrabold text-[#173f34]"><Clock3 size={18}/>Próximas dietas</h2>
          {futuras.length ? <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {futuras.map(plan => <li key={plan._id}>
              <button type="button" onClick={() => elegirPlan(plan)}
                aria-pressed={planDelDia?._id === plan._id}
                className="w-full rounded-xl border border-[#d6e7dc] bg-[#f2f8f4] px-3 py-2.5 text-left hover:bg-[#e6f2e8] aria-pressed:border-[#4d816f]">
                <span className="block text-xs font-bold text-[#426f58]">{fechaDietaLegible(inicioDieta(plan))}</span>
                <span className="mt-1 block break-words text-sm font-bold text-[#173f34]">{plan.nombre}</span>
              </button>
            </li>)}
          </ul> : <p className="mt-3 text-sm text-slate-600">No hay nuevos planes programados.</p>}
        </section>
      </div>}
      {!!historial.length && <details className="mb-5 overflow-hidden rounded-2xl border border-[#c9ddd3] bg-white/80">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-extrabold text-[#246b55]">
          <History size={17}/>Historial de dietas ({historial.length})
        </summary>
        <div className="max-h-64 space-y-1 overflow-y-auto border-t border-[#e0ebe3] p-2">
          {historial.map(plan => <button key={plan._id} type="button"
            onClick={event => {
              elegirPlan(plan)
              event.currentTarget.closest('details').open = false
            }}
            className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-[#edf5ef]">
            <span className="font-bold text-[#173f34]">{plan.nombre}</span>
            <span className="text-xs font-semibold text-[#648073]">{fechaDietaLegible(inicioDieta(plan))}</span>
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
      <EstadoCargaPaciente loading={loading} error={error} vacio={false}>
        {planDelDia
          ? <div id="menu-del-dia" className="scroll-mt-20 space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-[#cfe2d5] bg-[#edf6ee] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#416d52]">
                  <Clock3 size={16} className="shrink-0"/>Menú del {fechaDietaLegible(fechaSeleccionada)} · Inicio del plan: {fechaDietaLegible(inicioDieta(planDelDia))}
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
              {!seguimientoDisponible && <p className="text-sm text-[#48685c]">{fechaSeleccionada > hoy
                ? 'Puedes consultar este menú por adelantado. El seguimiento estará disponible el día correspondiente.'
                : 'Esta dieta fue reemplazada para la fecha seleccionada. Puedes consultar el menú y tus registros anteriores.'}</p>}
              <CardPlanPaciente key={planDelDia._id + ':' + fechaSeleccionada} fecha={fechaSeleccionada} plan={planDelDia}
                seguimientoDisponible={seguimientoDisponible}
                estadoPlan={fechaSeleccionada > hoy ? 'Próximo menú' : planDelDia._id !== planVigente?._id || fechaSeleccionada < hoy ? 'Menú del historial' : 'Menú de hoy'}
                seguimientos={perfil?.seguimientosComida || []} onSeguimientoGuardado={guardarRegistroLocal}/>
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
