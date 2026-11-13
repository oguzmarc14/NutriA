import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, ArrowRight, ClipboardList, Ruler, RefreshCw, X } from 'lucide-react'

const mensajes = {
  expediente: {
    titulo: 'Falta el expediente clínico',
    detalle: 'Este paciente aún no tiene expediente clínico registrado. Completa su información antes de crear un plan alimenticio.',
  },
  mediciones: {
    titulo: 'Faltan mediciones para continuar',
    detalle: 'Registra peso, estatura, edad y nivel de actividad física del paciente antes de crear su dieta.',
  },
  ambos: {
    titulo: 'Información del paciente incompleta',
    detalle: 'Antes de crear la dieta necesitas registrar el expediente clínico y las mediciones del paciente.',
  },
  error: {
    titulo: 'No pudimos verificar la información',
    detalle: 'No fue posible consultar el expediente y las mediciones. Revisa tu conexión y vuelve a intentarlo.',
  },
}

export default function ModalRequisitosPlan({ tipo, onExpediente, onMediciones, onReintentar, onCancelar }) {
  const cancelarRef = useRef(null)
  const origenRef = useRef(null)

  useEffect(() => {
    if (!tipo) return undefined
    origenRef.current = document.activeElement
    const desbordamientoAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelarRef.current?.focus()
    function teclas(event) {
      if (event.key === 'Escape') { event.preventDefault(); onCancelar(); return }
      if (event.key !== 'Tab') return
      const controles = [...(document.getElementById('nutria-requisitos-plan-modal')?.querySelectorAll('button:not([disabled])') || [])]
      if (!controles.length) return
      if (event.shiftKey && document.activeElement === controles[0]) {
        event.preventDefault()
        controles[controles.length - 1].focus()
      } else if (!event.shiftKey && document.activeElement === controles[controles.length - 1]) {
        event.preventDefault()
        controles[0].focus()
      }
    }
    document.addEventListener('keydown', teclas)
    return () => {
      document.body.style.overflow = desbordamientoAnterior
      document.removeEventListener('keydown', teclas)
      origenRef.current?.focus?.()
    }
  }, [tipo, onCancelar])

  if (!tipo) return null

  const mensaje = mensajes[tipo] || mensajes.error
  const Icono = tipo === 'expediente' ? ClipboardList : tipo === 'mediciones' ? Ruler : AlertCircle
  return createPortal(
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[#102d26]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}>
      <section id="nutria-requisitos-plan-modal" role="alertdialog" aria-modal="true"
        aria-labelledby="requisitos-plan-titulo" aria-describedby="requisitos-plan-detalle"
        className="w-full max-w-[450px] min-w-0 rounded-[28px] border border-[#c2dcca] bg-[#f6faf6] px-5 py-6 text-center text-[#173f34] shadow-2xl sm:px-8 sm:py-8">
        <span className="mx-auto grid size-[76px] place-items-center rounded-3xl bg-[#dfeee5] text-[#287353]" aria-hidden="true">
          <Icono size={37}/>
        </span>
        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#547d61]">Antes de crear la dieta</p>
        <h2 id="requisitos-plan-titulo" className="mt-2 break-words text-xl font-black leading-tight sm:text-2xl">{mensaje.titulo}</h2>
        <p id="requisitos-plan-detalle" className="mt-3 break-words text-sm leading-6 text-[#547160]">{mensaje.detalle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-[#d5e4da] pt-5 sm:gap-3">
          <button ref={cancelarRef} type="button" onClick={onCancelar}
            className="inline-flex min-h-11 min-w-[110px] items-center justify-center rounded-xl border border-[#c2d9cb] bg-white px-4 py-2.5 text-sm font-extrabold text-[#3f6e54] transition hover:bg-[#e7f0ea] focus-visible:outline-2 focus-visible:outline-offset-2">
            Cancelar
          </button>
          {(tipo === 'expediente' || tipo === 'ambos') && (
            <button type="button" onClick={onExpediente}
              className={'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 '+
                (tipo === 'expediente' ? 'bg-[#246b55] text-white hover:bg-[#1c5745]' : 'border border-[#8ab6a0] bg-[#e3efe7] text-[#246b55] hover:bg-[#d5e9dc]')}>
              Abrir expediente <ArrowRight size={16}/>
            </button>
          )}
          {(tipo === 'mediciones' || tipo === 'ambos') && (
            <button type="button" onClick={onMediciones}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c5745] focus-visible:outline-2 focus-visible:outline-offset-2">
              Ir a mediciones <ArrowRight size={16}/>
            </button>
          )}
          {tipo === 'error' && (
            <button type="button" onClick={onReintentar}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c5745] focus-visible:outline-2 focus-visible:outline-offset-2">
              <RefreshCw size={16}/> Reintentar
            </button>
          )}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#6f8776]">Los planes ya guardados no se eliminan ni se modifican.</p>
      </section>
    </div>,
    document.body,
  )
}
