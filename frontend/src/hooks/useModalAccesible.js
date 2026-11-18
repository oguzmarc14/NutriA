import { useEffect, useRef } from 'react'

// Conserva una salida accesible en modales: Escape, ciclo de Tab,
// foco inicial, retorno del foco y bloqueo de scroll.
const selectorDeFoco = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function useModalAccesible({ abierto = true, onVolver, bloqueado = false }) {
  const modalRef = useRef(null)
  const volverRef = useRef(null)
  const onVolverActual = useRef(onVolver)
  const bloqueadoActual = useRef(bloqueado)
  onVolverActual.current = onVolver
  bloqueadoActual.current = bloqueado

  useEffect(() => {
    if (!abierto) return undefined
    const focoAnterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const controles = () => [...(modalRef.current?.querySelectorAll(selectorDeFoco) || [])]
      .filter(elemento => elemento.getAttribute('aria-hidden') !== 'true')
    const primero = volverRef.current || controles()[0]
    primero?.focus?.()

    function manejarTeclado(event) {
      if (event.key === 'Escape') {
        if (!bloqueadoActual.current) {
          event.preventDefault()
          event.stopPropagation()
          onVolverActual.current?.()
        }
        return
      }
      if (event.key !== 'Tab') return
      const elementos = controles()
      if (!elementos.length) {
        event.preventDefault()
        modalRef.current?.focus?.()
        return
      }
      const primero = elementos[0]
      const ultimo = elementos[elementos.length - 1]
      if (!modalRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        primero.focus()
      } else if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', manejarTeclado)
    return () => {
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus?.()
    }
  }, [abierto])

  return { modalRef, volverRef }
}
