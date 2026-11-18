import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, ArrowRight, ClipboardList, Ruler, RefreshCw, UserRound } from 'lucide-react'

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

const mensajesCalculo = {
  expediente: {
    titulo: 'Falta el expediente clínico',
    detalle: 'Este paciente aún no tiene expediente clínico registrado. Completa su información antes de continuar con el cálculo nutricional.',
  },
  mediciones: {
    titulo: 'Faltan mediciones para continuar',
    detalle: 'Registra peso, estatura, edad y actividad física del paciente antes de continuar con el cálculo nutricional.',
  },
  ambos: {
    titulo: 'Información del paciente incompleta',
    detalle: 'Este paciente aún no tiene expediente clínico ni mediciones completas. Registra ambos datos antes de continuar con el cálculo nutricional.',
  },
  error: {
    titulo: 'No pudimos verificar la información',
    detalle: 'No fue posible consultar el expediente y las mediciones. Revisa tu conexión y vuelve a intentarlo.',
  },
}

export default function ModalRequisitosPlan({ tipo, contexto = 'plan', onExpediente, onMediciones, onReintentar, onElegirPaciente, onCancelar }) {
  const cancelarRef = useRef(null)
  const origenRef = useRef(null)
  const onCancelarRef = useRef(onCancelar)
  onCancelarRef.current = onCancelar

  useEffect(() => {
    if (!tipo) return undefined
    origenRef.current = document.activeElement
    const desbordamientoAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelarRef.current?.focus()
    function teclas(event) {
      if (event.key === 'Escape') { event.preventDefault(); onCancelarRef.current(); return }
      if (event.key !== 'Tab') return
      const controles = [...(document.getElementById('nutria-requisitos-plan-modal')?.querySelectorAll('button:not([disabled])') || [])]
      if (!controles.length) return
      const focoDentro = controles.includes(document.activeElement)
      if (event.shiftKey && (document.activeElement === controles[0] || !focoDentro)) {
        event.preventDefault()
        controles[controles.length - 1].focus()
      } else if (!event.shiftKey && (document.activeElement === controles[controles.length - 1] || !focoDentro)) {
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
  }, [tipo])

  if (!tipo) return null

  const catalogo = contexto === 'calculo' ? mensajesCalculo : mensajes
  const sinPaciente = tipo === 'paciente'
  const mensaje = sinPaciente ? {
    titulo: 'Aún no tienes un paciente elegido',
    detalle: contexto === 'calculo'
      ? 'Elige un paciente para continuar con el cálculo nutricional.'
      : 'Elige un paciente para continuar a Crear dieta.',
  } : catalogo[tipo] || catalogo.error
  const Icono = sinPaciente ? UserRound : tipo === 'expediente' ? ClipboardList : tipo === 'mediciones' ? Ruler : AlertCircle
  return createPortal(
    <div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-[#102d26]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancelar() }}>
      <section id="nutria-requisitos-plan-modal" role="alertdialog" aria-modal="true"
        aria-labelledby="requisitos-plan-titulo" aria-describedby="requisitos-plan-detalle"
        className="w-full max-w-xl min-w-0 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[28px] sm:max-h-[calc(100dvh-2.5rem)] border border-[#c2dcca] bg-[#f6faf6] px-5 py-6 text-center text-[#173f34] shadow-2xl sm:px-8 sm:py-8">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl sm:size-16 bg-[#dfeee5] text-[#287353]" aria-hidden="true">
          <Icono size={31}/>
        </span>
        <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#547d61]">{contexto === 'calculo' ? 'Antes del cálculo nutricional' : 'Antes de crear la dieta'}</p>
        <h2 id="requisitos-plan-titulo" className="mt-2 break-words text-xl font-black leading-tight sm:text-2xl">{mensaje.titulo}</h2>
        <p id="requisitos-plan-detalle" className="mt-3 break-words text-sm leading-6 text-[#547160]">{mensaje.detalle}</p>
        <div className="mt-5 grid grid-flow-row auto-rows-fr grid-cols-1 gap-2.5 border-t border-[#d5e4da] pt-4 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none">
          <button ref={cancelarRef} type="button" onClick={onCancelar}
            className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-[#c2d9cb] bg-white px-3 py-2.5 text-sm font-extrabold text-[#3f6e54] transition hover:bg-[#e7f0ea] focus-visible:outline-2 focus-visible:outline-offset-2">
            Cancelar
          </button>
          {(tipo === 'expediente' || tipo === 'ambos') && (
            <button type="button" onClick={onExpediente}
              className={'inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 '+
                (tipo === 'expediente' ? 'bg-[#246b55] text-white hover:bg-[#1c5745]' : 'border border-[#8ab6a0] bg-[#e3efe7] text-[#246b55] hover:bg-[#d5e9dc]')}>
              Abrir expediente <ArrowRight size={16} className="shrink-0" aria-hidden="true"/>
            </button>
          )}
          {(tipo === 'mediciones' || tipo === 'ambos') && (
            <button type="button" onClick={onMediciones}
              className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#246b55] px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c5745] focus-visible:outline-2 focus-visible:outline-offset-2">
              Ir a mediciones <ArrowRight size={16} className="shrink-0" aria-hidden="true"/>
            </button>
          )}
          {sinPaciente && (
            <button type="button" onClick={onElegirPaciente}
              className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#246b55] px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c5745] focus-visible:outline-2 focus-visible:outline-offset-2">
              Elegir paciente <ArrowRight size={16} className="shrink-0" aria-hidden="true"/>
            </button>
          )}
          {tipo === 'error' && (
            <button type="button" onClick={onReintentar}
              className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#246b55] px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c5745] focus-visible:outline-2 focus-visible:outline-offset-2">
              <RefreshCw size={16} className="shrink-0" aria-hidden="true"/> Reintentar
            </button>
          )}
        </div>
        {!sinPaciente && <p className="mt-4 text-[11px] leading-5 text-[#6f8776]">{contexto === 'calculo'
          ? 'Los cálculos guardados anteriormente no se eliminan ni se modifican.'
          : 'Los planes ya guardados no se eliminan ni se modifican.'}</p>}
      </section>
    </div>,
    document.body,
  )
}
