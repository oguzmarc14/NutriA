import { CalendarDays, Utensils } from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))
}

function CardPlanPaciente({ plan }) {
  return (
    <article className="rounded-3xl border border-[#eadfc8] bg-white/85 p-5 shadow-[0_12px_35px_rgba(94,76,48,0.07)]">
      <div className="flex flex-col gap-2 border-b border-[#efe5d2] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">{plan.activo ? 'Plan actual' : 'Plan anterior'}</p><h2 className="mt-1 text-xl font-extrabold text-[#173f34]">{plan.nombre}</h2><p className="mt-1 text-sm text-slate-500">{plan.objetivo || 'Sin objetivo registrado'}</p></div>
        <span className="flex items-center gap-2 text-xs font-bold text-[#7b684d]"><CalendarDays size={15} />{formatearFecha(plan.fechaInicio || plan.createdAt)}</span>
      </div>

      <div className="mt-5 space-y-4">
        {plan.comidas?.length > 0 ? plan.comidas.map((comida, index) => (
          <section key={comida._id || index} className="rounded-2xl bg-[#f7f2e7] p-4">
            <div className="flex items-center gap-2"><Utensils size={17} className="text-[#8a6840]" /><h3 className="font-extrabold text-[#173f34]">{comida.nombre || `Comida ${index + 1}`}</h3></div>
            {comida.descripcion && <p className="mt-1 text-sm text-slate-500">{comida.descripcion}</p>}
            <div className="mt-3 space-y-2">
              {comida.alimentos?.length > 0 ? comida.alimentos.map((alimento, alimentoIndex) => (
                <div key={alimento._id || alimentoIndex} className="flex items-start justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5">
                  <div><p className="text-sm font-bold text-[#173f34]">{alimento.nombre}</p>{alimento.notas && <p className="mt-0.5 text-xs text-slate-500">{alimento.notas}</p>}</div>
                  <p className="shrink-0 text-xs font-bold text-[#8a6840]">{alimento.cantidad || 1} porcion{Number(alimento.cantidad || 1) !== 1 ? 'es' : ''}</p>
                </div>
              )) : <p className="text-sm text-slate-400">Sin alimentos registrados.</p>}
            </div>
          </section>
        )) : <p className="text-sm text-slate-500">Este plan aun no tiene comidas registradas.</p>}
      </div>
    </article>
  )
}

export default CardPlanPaciente
