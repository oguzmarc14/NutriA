import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CalendarX2, X } from 'lucide-react'
import { formatearCitaPaciente } from '../../utils/fechasMisCitas'

export default function ModalCancelarCitaPaciente({ cita, zonaHoraria, guardando, error, onCancelar, onCerrar }) {
  const cerrarRef = useRef(null)
  const origenRef = useRef(null)
  useEffect(() => {
    if (!cita) return undefined
    origenRef.current = document.activeElement
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!guardando) onCerrar()
        return
      }
      if (event.key !== 'Tab') return
      const controles = [...(document.getElementById('confirmar-cancelacion-paciente')?.querySelectorAll('button:not(:disabled)') || [])]
      if (!controles.length) return
      if (event.shiftKey && document.activeElement === controles[0]) {
        event.preventDefault()
        controles.at(-1).focus()
      } else if (!event.shiftKey && document.activeElement === controles.at(-1)) {
        event.preventDefault()
        controles[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = anterior
      document.removeEventListener('keydown', onKey)
      origenRef.current?.focus?.()
    }
  }, [cita, guardando, onCerrar])
  if (!cita) return null
  return createPortal(
    <div className="nutria-mis-citas-overlay fixed inset-0 z-[230] grid place-items-center p-3 sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget && !guardando) onCerrar() }}>
      <section id="confirmar-cancelacion-paciente" role="alertdialog" aria-modal="true"
        aria-labelledby="cancelar-mi-cita-titulo" aria-describedby="cancelar-mi-cita-detalle"
        className="nutria-mis-citas-dialog w-full max-w-md min-w-0 rounded-[26px] border p-5 text-center shadow-2xl sm:p-7">
        <button ref={cerrarRef} type="button" onClick={onCerrar} disabled={guardando}
          aria-label="Cerrar confirmación" className="nutria-mis-citas-accion ml-auto grid size-10 place-items-center rounded-xl border disabled:opacity-50">
          <X size={18}/>
        </button>
        <span className="nutria-mis-citas-dialog-icon mx-auto mt-1 grid size-16 place-items-center rounded-2xl">
          <CalendarX2 size={29}/>
        </span>
        <h2 id="cancelar-mi-cita-titulo" className="mt-4 break-words text-xl font-black">¿Cancelar esta cita?</h2>
        <p id="cancelar-mi-cita-detalle" className="mt-3 break-words text-sm leading-6 opacity-85">
          {formatearCitaPaciente(cita.inicio, zonaHoraria)}. La cita dejará de aparecer entre las próximas,
          pero seguirá registrada como cancelada en tu historial.
        </p>
        {error && <p role="alert" className="nutria-mis-citas-error mt-3 rounded-xl border p-3 text-sm">{error}</p>}
        <div className="mt-6 nutria-acciones">
          <button type="button" onClick={onCerrar} disabled={guardando}
            className="nutria-mis-citas-accion inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Conservar cita</button>
          <button type="button" onClick={onCancelar} disabled={guardando}
            className="nutria-mis-citas-confirmar inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold disabled:opacity-50">
            {guardando ? 'Cancelando…' : 'Sí, cancelar cita'}
          </button>
        </div>
      </section>
    </div>, document.body
  )
}
