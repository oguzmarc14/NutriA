import { LoaderCircle, Trash2, X } from 'lucide-react'
import useModalAccesible from '../../hooks/useModalAccesible'

function ModalEliminarPaciente({ paciente, eliminando, error, onCancelar, onConfirmar }) {
  const { modalRef, volverRef } = useModalAccesible({
    abierto: Boolean(paciente),
    onVolver: onCancelar,
    bloqueado: eliminando,
  })
  if (!paciente) return null

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-eliminar-paciente" aria-describedby="detalle-eliminar-paciente">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 size={22} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-eliminar-paciente" className="text-xl font-extrabold text-[#173f34]">Eliminar paciente</h2>
            <p id="detalle-eliminar-paciente" className="mt-2 text-sm leading-6 text-slate-600">
              Se eliminarán definitivamente la cuenta de <strong>{paciente.name}</strong>, su expediente, mediciones, cálculos nutricionales, dietas, seguimientos, citas y reportes de pago. También se retirarán sus citas vinculadas a Google Calendar. <strong>Esta acción no se puede deshacer.</strong>
            </p>
          </div>
          <button type="button" onClick={onCancelar} disabled={eliminando} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={volverRef} type="button" onClick={onCancelar} disabled={eliminando} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirmar} disabled={eliminando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {eliminando ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}
            {eliminando ? 'Eliminando...' : 'Sí, eliminar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarPaciente
