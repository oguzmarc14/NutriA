import { ArrowRight, Utensils } from 'lucide-react'

function CardPlanActualPaciente({ plan, onVerPlan }) {
  return (
    <article className="rounded-3xl border border-[#eadfc8] bg-[#fffaf0] p-6 shadow-[0_12px_35px_rgba(94,76,48,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">Planes alimenticios</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#173f34]">Ingresa para ver tus planes alimenticios</h2>
        </div>
        <Utensils className="text-[#9a7446]" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#eadfc8] pt-4">
        <span className="text-sm font-bold text-[#7b684d]">{plan?.comidas?.length || 0} comidas</span>
        <button type="button" onClick={onVerPlan} className="inline-flex cursor-pointer items-center gap-2 text-sm font-extrabold text-[#26735f]">
          Ver plan <ArrowRight size={17} />
        </button>
      </div>
    </article>
  )
}

export default CardPlanActualPaciente
