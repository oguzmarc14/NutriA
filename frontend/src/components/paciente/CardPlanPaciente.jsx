import { CalendarDays, CheckCircle2, ClipboardCheck, Utensils } from 'lucide-react'
import { useState } from 'react'
import MedidaAlimentoPaciente from './MedidaAlimentoPaciente'
import ModalSeguimientoComida from '../progreso/ModalSeguimientoComida'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))
}

const textoEstado = {
  completada: 'Completada',
  parcial: 'Completada parcialmente',
  omitida: 'No realizada',
}

function CardPlanPaciente({ fecha, onSeguimientoGuardado, plan, seguimientos = [] }) {
  const [comidaActiva, setComidaActiva] = useState(null)

  function encontrarRegistro(comida) {
    return seguimientos.find(
      (item) => String(item.plan) === plan._id && String(item.comida) === comida._id && item.fecha === fecha,
    )
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-[#eadfc8] bg-white/85 p-4 shadow-[0_12px_35px_rgba(94,76,48,0.07)] sm:p-5">
      {comidaActiva && <ModalSeguimientoComida comida={comidaActiva} fecha={fecha} plan={plan} registro={encontrarRegistro(comidaActiva)} onCerrar={() => setComidaActiva(null)} onGuardado={onSeguimientoGuardado} />}
      <div className="flex flex-col gap-2 border-b border-[#efe5d2] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">{plan.activo ? 'Plan actual' : 'Plan anterior'}</p><h2 className="mt-1 break-words text-xl font-extrabold text-[#173f34]">{plan.nombre}</h2><p className="mt-1 break-words text-sm text-slate-500">{plan.objetivo || 'Sin objetivo registrado'}</p></div>
        <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#7b684d]"><CalendarDays size={15} className="shrink-0" /><span className="break-words">{formatearFecha(plan.fechaInicio || plan.createdAt)}</span></span>
      </div>

      <div className="mt-5 space-y-4">
        {plan.comidas?.length > 0 ? plan.comidas.map((comida, index) => {
          const registro = encontrarRegistro(comida)
          return (
          <section key={comida._id || index} className="min-w-0 overflow-hidden rounded-2xl bg-[#f7f2e7] p-3 sm:p-4">
            <div className="flex min-w-0 items-start gap-2"><Utensils size={17} className="mt-0.5 shrink-0 text-[#8a6840]" /><div className="min-w-0"><p className="break-words text-xs font-bold uppercase tracking-wide text-[#8a6840]">{comida.nombre || `Comida ${index + 1}`}</p><h3 className="break-words font-extrabold text-[#173f34]">{comida.platillo || 'Platillo sin nombre'}</h3></div></div>
            <p className="mt-2 text-xs font-bold text-[#6e9484]">{comida.alimentos?.reduce((total, alimento) => total + ((Number(alimento.porcion?.gramos) || 0) * (Number(alimento.cantidad) || 0)), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} g conocidos</p>
            <div className="mt-3 space-y-2">
              {comida.alimentos?.length > 0 ? comida.alimentos.map((alimento, alimentoIndex) => (
                <div key={alimento._id || alimentoIndex} className="flex min-w-0 flex-col gap-1 rounded-xl bg-white/80 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0"><p className="break-words text-sm font-bold text-[#173f34]">{alimento.nombre}</p>{alimento.notas && <p className="mt-0.5 break-words text-xs text-slate-500">{alimento.notas}</p>}</div>
                  <MedidaAlimentoPaciente alimento={alimento} />
                </div>
              )) : <p className="text-sm text-slate-400">Sin alimentos registrados.</p>}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-[#eadfc8] pt-3 sm:flex-row sm:items-center sm:justify-between">
              {registro ? <p className="inline-flex items-center gap-2 text-sm font-extrabold text-[#246b55]"><CheckCircle2 size={17} />{textoEstado[registro.estado]}</p> : <p className="text-sm font-semibold text-slate-400">Aun no has confirmado esta comida.</p>}
              <button type="button" onClick={() => setComidaActiva(comida)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white"><ClipboardCheck size={17} />{registro ? 'Actualizar seguimiento' : 'Registrar seguimiento'}</button>
            </div>
          </section>
        )}) : <p className="text-sm text-slate-500">Este plan aun no tiene comidas registradas.</p>}
      </div>
    </article>
  )
}

export default CardPlanPaciente
