import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import './estilosPaciente.css'
import useModalAccesible from '../../hooks/useModalAccesible'

/**
 * Aviso de éxito al elegir un paciente para trabajar.
 * Se muestra después de activar el contexto y al aceptar abre su expediente.
 * No utiliza alert() nativo ni agrega dependencias externas.
 */
function AlertaTrabajoPaciente({ paciente, onAceptar, onCerrar }) {
  const { modalRef, volverRef } = useModalAccesible({
    abierto: Boolean(paciente),
    onVolver: onCerrar,
  })

  if (!paciente) return null

  return createPortal(
    <div className="nutria-trabajo-overlay fixed inset-0 z-[120] grid place-items-center p-4" role="presentation">
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="nutria-trabajo-titulo"
        aria-describedby="nutria-trabajo-descripcion"
        className="nutria-trabajo-alert w-full max-w-md rounded-[26px] border px-5 py-8 text-center shadow-2xl sm:px-8 sm:py-9"
      >
        <div className="nutria-trabajo-check mx-auto grid h-[104px] w-[104px] place-items-center rounded-full border-[4px]" aria-hidden="true">
          <Check size={60} strokeWidth={2.6} />
        </div>
        <h2 id="nutria-trabajo-titulo" className="nutria-trabajo-title mt-6 text-[28px] font-extrabold tracking-tight sm:text-[32px]">
          ¡Listo!
        </h2>
        <p id="nutria-trabajo-descripcion" className="nutria-trabajo-description mt-3 text-base leading-7">
          Estás trabajando con{' '}
          <strong className="nutria-trabajo-nombre block break-words font-extrabold">
            {paciente.name}
          </strong>
        </p>
        <div className="mt-7 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row">
          <button ref={volverRef} type="button" onClick={onCerrar}
            className="inline-flex min-h-11 min-w-[148px] items-center justify-center rounded-xl border border-[#8bb9a1] px-6 py-3 text-base font-bold transition focus-visible:outline-2">
            Volver a pacientes
          </button>
          <button id="nutria-trabajo-ok" type="button" onClick={onAceptar}
            className="nutria-trabajo-button inline-flex min-h-11 min-w-[148px] items-center justify-center rounded-xl px-7 py-3 text-base font-bold transition focus-visible:outline-2">
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default AlertaTrabajoPaciente
