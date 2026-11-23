import { CheckCircle2, Download, X, BookOpen } from 'lucide-react'
import { useState } from 'react'
import useModalAccesible from '../../hooks/useModalAccesible'

function ModalPlanGuardado({ tipo, mensaje, onCerrar, onExportarPDF, onGuardarEnMisDietas }) {
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  async function guardarCopia() {
    const value = nombre.trim()
    if (!value || value.length < 3 || value.length > 100) {
      setError('Indica un nombre entre 3 y 100 caracteres.'); return
    }
    setGuardando(true); setError('')
    try { await onGuardarEnMisDietas(value) }
    catch (cause) { setError(cause.response?.data?.message || cause.message || 'No se pudo guardar la dieta.') }
    finally { setGuardando(false) }
  }
  const editado = tipo === 'editado'
  const { modalRef, volverRef } = useModalAccesible({ onVolver: onCerrar })
  return (
    <div ref={modalRef} className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-plan-guardado">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={24} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-plan-guardado" className="text-xl font-extrabold text-[#173f34]">{editado ? 'Plan actualizado correctamente' : 'Plan creado correctamente'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{mensaje}</p>
            {onExportarPDF && <p className="mt-3 text-sm font-medium text-[#246b55]">¿Quieres exportar la dieta a PDF?</p>}
          </div>
          <button ref={volverRef} type="button" onClick={onCerrar} className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </div>
        {onGuardarEnMisDietas && <div className="mt-5 rounded-2xl border border-[#cfe4d7] bg-[#f0f7f1] p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-[#173f34]"><BookOpen size={18} /> ¿Guardar una copia en Mis dietas?</p>
          <p className="mt-1 text-xs text-[#526d5d]">Con nombre y fecha automáticos; tu paciente conserva su plan original.</p>
          <label className="mt-3 block text-sm font-semibold text-[#315842]">Nombre de la dieta
            <input value={nombre} onChange={event => setNombre(event.target.value)}
              disabled={guardando} minLength={3} maxLength={100}
              placeholder="Ej. Menú equilibrado semanal"
              className="mt-1 min-h-11 w-full rounded-xl border border-[#cadfd1] bg-white px-3 outline-none focus:border-emerald-600" />
          </label>
          {!!error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <button type="button" disabled={guardando} onClick={() => void guardarCopia()}
            className="mt-3 min-h-11 w-full rounded-xl bg-[#246b55] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {guardando ? 'Guardando copia…' : 'Guardar en Mis dietas'}
          </button>
        </div>}
        <div className="mt-6 nutria-acciones">
          {onExportarPDF && <button type="button" onClick={onExportarPDF} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#1d5947]"><Download size={18} /> Exportar dieta a PDF</button>}
          <button type="button" onClick={onCerrar} className="w-full cursor-pointer rounded-xl border border-[#cfe0d6] px-4 py-3 text-sm font-bold text-[#246b55] transition hover:bg-emerald-50">{onExportarPDF ? 'Ahora no' : 'Aceptar'}</button>
        </div>
      </div>
    </div>
  )
}
export default ModalPlanGuardado
