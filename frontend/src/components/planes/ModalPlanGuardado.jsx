import { CheckCircle2, X } from 'lucide-react'

function ModalPlanGuardado({ tipo, mensaje, onCerrar }) {
  const editado = tipo === 'editado'
  const titulo = editado
    ? 'Plan actualizado correctamente'
    : 'Plan creado correctamente'

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-plan-guardado"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="titulo-plan-guardado" className="text-xl font-extrabold text-[#173f34]">
              {titulo}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {mensaje}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#1d5947]"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

export default ModalPlanGuardado
