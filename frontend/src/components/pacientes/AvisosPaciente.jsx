import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, ClipboardList, X, ArrowRight } from 'lucide-react'
import './estilosPaciente.css'

export default function AvisosPaciente({ paciente, avisos = [], onCerrar, onAccion }) {
  const cerrarRef = useRef(null)

  useEffect(() => {
    if (!paciente) return undefined
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()

    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
      if (event.key === 'Tab') {
        const dialog = document.getElementById('nutria-aviso-dialog')
        const focusables = dialog?.querySelectorAll('button:not(:disabled)') || []
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', handleKey)
    }
  }, [paciente, onCerrar])

  if (!paciente) return null

  const acciones = { editar: 'Editar datos', expediente: 'Abrir expediente', plan: 'Preparar plan', mediciones: 'Ver mediciones' }

  return createPortal(
    <div className="nutria-aviso-overlay fixed inset-0 z-[120] grid place-items-center p-3 sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}>
      <section id="nutria-aviso-dialog" role="dialog" aria-modal="true"
        aria-labelledby="nutria-aviso-titulo" aria-describedby="nutria-aviso-descripcion"
        className="nutria-aviso-dialog flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border shadow-2xl">
        <header className="flex items-start gap-3 border-b border-current/10 px-5 py-5">
          <span className="nutria-aviso-symbol grid h-11 w-11 shrink-0 place-items-center rounded-xl"><Bell size={22}/></span>
          <div className="min-w-0 flex-1">
            <h2 id="nutria-aviso-titulo" className="text-xl font-extrabold">Avisos de seguimiento</h2>
            <p className="mt-1 break-words text-sm font-semibold">{paciente.name}</p>
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar}
            aria-label="Cerrar avisos" className="nutria-aviso-close grid h-9 w-9 shrink-0 place-items-center rounded-xl"><X size={18}/></button>
        </header>
        <div className="overflow-y-auto p-5">
          <p id="nutria-aviso-descripcion" className="mb-4 text-sm leading-6 opacity-80">
            Estos avisos te ayudan a organizar la atención. No indican que el paciente haya hecho algo mal y no se envían automáticamente.
          </p>
          <div className="space-y-3">
            {avisos.length ? avisos.map((aviso) => (
              <article key={aviso.id} className="nutria-aviso-item rounded-2xl border p-4">
                <div className="flex items-start gap-3">
                  <ClipboardList size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{aviso.categoria}</p>
                    <h3 className="mt-1 font-extrabold">{aviso.titulo}</h3>
                    <p className="mt-1 text-sm leading-5 opacity-80">{aviso.detalle}</p>
                    {aviso.accion && (
                      <button type="button" onClick={() => onAccion(aviso)}
                        className="nutria-aviso-action mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold">
                        {acciones[aviso.accion] || 'Revisar'}<ArrowRight size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )) : (
              <p className="nutria-aviso-item rounded-xl border p-5 text-sm">
                No hay avisos por revisar en este momento.
              </p>
            )}
          </div>
        </div>
        <footer className="flex justify-end border-t border-current/10 px-5 py-4">
          <button type="button" onClick={onCerrar} className="nutria-aviso-action min-h-10 rounded-xl px-5 text-sm font-bold">Cerrar</button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
