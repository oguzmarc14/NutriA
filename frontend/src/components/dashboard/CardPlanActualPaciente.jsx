import { ArrowRight, Utensils } from 'lucide-react'

function CardPlanActualPaciente({ plan, fecha, registros, proximos, onVerPlan }) {
  const comidas = plan?.comidas || []
  const delDia = new Map(registros
    .filter(item => String(item.plan) === String(plan?._id) && item.fecha === fecha)
    .map(item => [String(item.comida), item.estado]))
  const conteo = { completada: 0, parcial: 0, omitida: 0, pendiente: 0 }
  for (const comida of comidas) {
    const estado = comida._id && delDia.get(String(comida._id))
    conteo[Object.hasOwn(conteo, estado) ? estado : 'pendiente'] += 1
  }
  const indicadores = [
    ['Completas', conteo.completada], ['Por registrar', conteo.pendiente],
    ['Parciales', conteo.parcial], ['Omitidas', conteo.omitida],
  ]

  return (
    <article className="rounded-3xl border border-[#c8dfd0] bg-[#f4faf5] p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-[#173f34]">Mi alimentación de hoy</h2>
          <p className="mt-1 break-words text-sm font-semibold text-[#48685c]">{plan?.nombre || 'Sin dieta vigente'}</p>
          {plan && <p className="mt-1 text-sm text-[#48685c]">{plan.aceptacionPaciente?.estado === 'aceptada'
            ? 'Recepción confirmada' : 'Recepción pendiente de confirmar'}</p>}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dceee2] text-[#246b55]">
          <Utensils size={19} aria-hidden="true" />
        </span>
      </div>
      {!!comidas.length && <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {indicadores.map(([etiqueta, cantidad]) => <div key={etiqueta} className="rounded-xl bg-white p-3">
          <dt className="text-sm text-[#48685c]">{etiqueta}</dt>
          <dd className="mt-1 text-xl font-black tabular-nums text-[#173f34]">{cantidad}</dd>
        </div>)}
      </dl>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d3e5da] pt-4">
        <span className="text-sm text-[#48685c]">{proximos ? proximos + (proximos === 1 ? ' plan próximo' : ' planes próximos') : 'Sin planes próximos'}</span>
        <button type="button" onClick={onVerPlan} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246b55] px-4 text-sm font-extrabold text-white hover:bg-[#1e5b49]">
          Abrir mi plan <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
export default CardPlanActualPaciente
