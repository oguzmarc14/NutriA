import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CalendarClock, ArrowRight } from 'lucide-react'
import './agenda.css'

export default function AvisoConfigurarCitas({ abierto, onIr, onCancelar }) {
  const cancelarRef = useRef(null)
  const anteriorRef = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined
    anteriorRef.current = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelarRef.current?.focus()
    function manejarTeclas(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelar()
      }
      if (event.key === 'Tab') {
        const botones = [...(document.getElementById('nutria-citas-configurar-dialog')?.querySelectorAll('button') || [])]
        if (botones.length < 2) return
        if (event.shiftKey && document.activeElement === botones[0]) {
          event.preventDefault()
          botones[botones.length - 1].focus()
        } else if (!event.shiftKey && document.activeElement === botones[botones.length - 1]) {
          event.preventDefault()
          botones[0].focus()
        }
      }
    }
    document.addEventListener('keydown', manejarTeclas)
    return () => {
      document.removeEventListener('keydown', manejarTeclas)
      document.body.style.overflow = overflowAnterior
      if (anteriorRef.current?.isConnected) anteriorRef.current.focus()
    }
  }, [abierto, onCancelar])

  if (!abierto) return null

  return createPortal(
    <div className="nutria-citas-aviso-overlay fixed inset-0 z-[190] grid place-items-center p-4"
      onMouseDown={event => { if (event.target === event.currentTarget) onCancelar() }}>
      <section id="nutria-citas-configurar-dialog" role="alertdialog" aria-modal="true"
        aria-labelledby="nutria-citas-aviso-titulo" aria-describedby="nutria-citas-aviso-desc"
        className="nutria-citas-aviso w-full max-w-[420px] rounded-[26px] border p-5 text-center shadow-2xl sm:p-7">
        <span className="nutria-citas-aviso-icon mx-auto grid h-20 w-20 place-items-center rounded-full" aria-hidden="true">
          <CalendarClock size={40}/>
        </span>
        <h2 id="nutria-citas-aviso-titulo" className="mt-5 text-xl font-black tracking-tight">
          Configura tus horarios de citas
        </h2>
        <p id="nutria-citas-aviso-desc" className="mt-3 text-sm leading-6 opacity-85">
          Configura los bloques de citas para ver los espacios disponibles.
          Puedes elegir los días y las horas de consulta desde la configuración de tu agenda.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-current/10 pt-5">
          <button ref={cancelarRef} type="button" onClick={onCancelar}
            className="nutria-citas-aviso-cancel min-h-11 rounded-xl border px-3 py-3 text-sm font-extrabold">
            Cancelar
          </button>
          <button type="button" onClick={onIr}
            className="nutria-citas-aviso-go flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-sm font-extrabold">
            Ir a configurar <ArrowRight size={16}/>
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
