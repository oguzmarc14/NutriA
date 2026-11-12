import { useEffect } from 'react'

export function useCerrarAlSalir(ref, cerrar) {
  useEffect(() => {
    function fuera(event) {
      if (!ref.current?.contains(event.target)) cerrar()
    }
    function teclado(event) {
      if (event.key === 'Escape') cerrar()
    }
    document.addEventListener('pointerdown', fuera, true)
    document.addEventListener('focusin', fuera)
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('pointerdown', fuera, true)
      document.removeEventListener('focusin', fuera)
      document.removeEventListener('keydown', teclado)
    }
  }, [ref, cerrar])
}
