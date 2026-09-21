import { ArrowRight, CheckCircle2, X } from 'lucide-react'

function ModalMedicionGuardada({ mensaje, onCerrar, onContinuar }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-medicion-guardada">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={24} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-medicion-guardada" className="text-xl font-extrabold text-[#173f34]">Medidas agregadas correctamente</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{mensaje}</p>
            <p className="mt-2 text-sm font-semibold text-[#246b55]">¿Quieres ir a registrar las comidas del paciente?</p>
          </div>
          <button type="button" onClick={onCerrar} className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCerrar} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Permanecer aqui</button>
          <button type="button" onClick={onContinuar} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#1d5947]">Aceptar e ir a comidas<ArrowRight size={17} /></button>
        </div>
      </div>
    </div>
  )
}

export default ModalMedicionGuardada
