import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, Download } from 'lucide-react'
import { agruparPreparaciones } from '../../utils/agruparPreparaciones'

function MiniNutrimento({ label, value }) {
  return <div className="rounded-xl bg-[#f7f2e7] px-3 py-2"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-xs font-black text-[#173f34]">{value}</p></div>
}

function CardPlanRegistrado({ plan, formatearFecha, numero, calcularTotales, onEditar, onEliminar, onExportarPDF }) {
  const [abierto, setAbierto] = useState(false)
  const todosAlimentos = plan.comidas?.flatMap((comida) => comida.alimentos || []) || []
  const totales = calcularTotales(todosAlimentos)

  return (
    <article className="min-w-0 rounded-2xl border border-[#eadfc8] bg-white/75 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">{formatearFecha(plan.fechaInicio || plan.createdAt)}</p>
          <h3 className="mt-1 break-words text-lg font-extrabold text-[#173f34]">{plan.nombre}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.objetivo || 'Sin objetivo registrado'}</p>
          <p className={'mt-2 text-xs font-bold ' + (plan.aceptacionPaciente?.estado === 'aceptada' ? 'text-emerald-800' : 'text-amber-800')}>
            {plan.aceptacionPaciente?.estado === 'aceptada' ? '✓ Recepción confirmada por el paciente' : 'Pendiente de confirmación de recepción'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => onExportarPDF?.(plan)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f2eb] text-[#246b55]" aria-label="Exportar dieta a PDF" title="Exportar dieta a PDF"><Download size={16} /></button>
          <button type="button" onClick={() => onEditar(plan)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f2eb] text-[#246b55]" aria-label="Editar plan"><Pencil size={16} /></button>
          <button type="button" onClick={() => onEliminar(plan)} className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500" aria-label="Eliminar plan"><Trash2 size={16} /></button>
          <button type="button" onClick={() => setAbierto((actual) => !actual)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5eddb] text-[#8a6840]" aria-label={abierto ? 'Cerrar detalles del plan' : 'Ver detalles del plan'}>
            {abierto ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </div>
      </div>

      {todosAlimentos.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniNutrimento label="Energía" value={`${numero(totales.kcal, 0)} kcal`} />
        <MiniNutrimento label="Peso conocido" value={`${numero(totales.gramos, 0)} g`} />
        <MiniNutrimento label="Proteína" value={`${numero(totales.proteina)} g`} />
        <MiniNutrimento label="Carbohidratos" value={`${numero(totales.carbohidratos)} g`} />
        <MiniNutrimento label="Grasas" value={`${numero(totales.grasas)} g`} />
      </div>}

      {abierto && <div className="mt-4 space-y-3 border-t border-[#efe5d2] pt-4">
        {plan.comidas?.length > 0 ? plan.comidas.map((comida, index) => (
          <div key={comida._id || `${plan._id}-${index}`} className="rounded-xl bg-[#f7f2e7] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#8a6840]">{comida.nombre}</p>{comida.hora && <p className="mt-1 text-xs font-extrabold text-[#246b55]">Hora: {comida.hora}</p>}
            {(comida.platillo || !(comida.preparaciones || []).length) &&
              <p className="mt-0.5 font-bold text-[#173f34]">{comida.platillo || 'Preparaciones'}</p>}
            {agruparPreparaciones(comida).length ? agruparPreparaciones(comida).map((grupo,index) =>
              <div key={grupo.id || index} className="mt-3 rounded-xl border border-[#dce9df] bg-[#f1f7f2] p-3">
                <p className="mb-2 text-xs font-extrabold text-[#246b55]">
                  {grupo.tipo==='bebida'?'🥤 Bebida':'🍽️ Platillo'}: {grupo.nombre || 'Sin nombre'}
                </p>
                <div className="space-y-2">{grupo.alimentos.map((alimento,alimentoIndex)=>{
                  const cantidad=Number(alimento.cantidad) || 0
                  const kcal=(Number(alimento.nutrimentos?.kcal)||0)*cantidad
                  return <div key={alimento._id || alimentoIndex}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-bold text-[#173f34]">{alimento.nombre}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{numero(cantidad)} porción(es)</p>
                    </div>
                    <p className="shrink-0 text-xs font-black text-[#8a6840]">{numero(kcal,0)} kcal</p>
                  </div>
                })}</div>
              </div>
            ) : <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              Esta comida se guardó sin ingredientes; es necesario editar la dieta.
            </p>}

          </div>
        )) : <p className="text-sm text-slate-500">Sin comidas registradas.</p>}
      </div>}
    </article>
  )
}

export default CardPlanRegistrado
