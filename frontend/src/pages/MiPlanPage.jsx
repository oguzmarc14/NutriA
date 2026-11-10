import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, History } from 'lucide-react'
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

  // fechaInicio define desde qué día se puede consultar cada plan.
  // No exigimos igualdad exacta: de otro modo la dieta desaparecía al día siguiente.
  const planesOrdenados = useMemo(() =>
    [...planes].sort((a, b) =>
      fechaInicio(b).localeCompare(fechaInicio(a)) ||
      (b.createdAt || '').localeCompare(a.createdAt || '')
    ), [planes])
  const planDelDia = planesOrdenados.find(plan => fechaInicio(plan) && fechaInicio(plan) <= fechaSeleccionada)
  const tienePlanes = planesOrdenados.length > 0

  return (
    <section className="mx-auto min-w-0 max-w-[1480px] overflow-x-hidden p-4 sm:p-5 md:p-8">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi alimentación</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mi plan alimenticio</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">Consulta la dieta correspondiente al día y registra el cumplimiento de cada comida.</p>
        </div>
        <label className="block min-w-0 w-full overflow-hidden sm:max-w-xs">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#48685c]"><CalendarDays size={17}/>Fecha del menú</span>
          <input type="date" value={fechaSeleccionada} onChange={event => setFechaSeleccionada(event.target.value)}
            className="block min-w-0 w-full rounded-xl border border-[#c9ddd3] bg-white px-3 py-3 font-bold text-[#173f34] outline-none focus:border-[#4d816f]"/>
        </label>
      </div>
      {tienePlanes && <details className="mb-5 overflow-hidden rounded-2xl border border-[#c9ddd3] bg-white/80">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-extrabold text-[#246b55]">
          <History size={17}/>Historial de dietas ({planesOrdenados.length})
        </summary>
        <div className="max-h-64 space-y-1 overflow-y-auto border-t border-[#e0ebe3] p-2">
          {planesOrdenados.map(plan => <button key={plan._id} type="button"
            onClick={() => setFechaSeleccionada(fechaInicio(plan))}
            className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-[#edf5ef]">
            <span className="font-bold text-[#173f34]">{plan.nombre}</span>
            <span className="text-xs font-semibold text-[#648073]">{fechaLegible(fechaInicio(plan))}</span>
          </button>)}
        </div>
      </details>}
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && !tienePlanes}>
        {planDelDia
          ? <div className="space-y-4">
              <p className="flex flex-wrap items-center gap-2 rounded-xl border border-[#cfe2d5] bg-[#edf6ee] px-4 py-3 text-xs font-semibold text-[#416d52]">
                <Clock3 size={16}/>Dieta aplicable desde el {fechaLegible(fechaInicio(planDelDia))}. Las horas de cada comida aparecen debajo.
              </p>
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
