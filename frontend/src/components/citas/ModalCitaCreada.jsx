import { Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import useModalAccesible from '../../hooks/useModalAccesible'

export default function ModalCitaCreada({ falloCalendario, onAceptar }) {
  const { modalRef, volverRef } = useModalAccesible({ onVolver: onAceptar })

  return createPortal(
    <div className="fixed inset-0 z-[230] grid grid-cols-[minmax(0,24rem)] place-items-center justify-center bg-[#102d26]/55 p-4">
      <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="titulo-cita-creada"
        aria-describedby={falloCalendario ? 'detalle-cita-creada' : undefined}
        className="nutria-agenda-day nutria-agenda-text w-full rounded-3xl border p-6 text-center shadow-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#d9f1e2] text-[#246b55]">
          <Check size={34} strokeWidth={3} aria-hidden="true" className="motion-safe:animate-[spin_550ms_ease-out]" />
        </div>
        <h2 id="titulo-cita-creada" className="mt-4 text-xl font-extrabold">
          Tu cita fue creada exitosamente
        </h2>
        {falloCalendario && <p id="detalle-cita-creada" className="mt-2 text-sm">
          Google Calendar no confirmó la sincronización.
        </p>}
        <button ref={volverRef} type="button" onClick={onAceptar}
          className="nutria-agenda-primary mt-5 min-h-11 w-full rounded-xl px-4 text-sm font-extrabold">
          Aceptar
        </button>
      </section>
    </div>,
    document.body,
  )
}
