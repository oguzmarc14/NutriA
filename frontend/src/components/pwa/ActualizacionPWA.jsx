import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function ActualizacionPWA() {
  const [disponible, setDisponible] = useState(false)
  useEffect(() => {
    const actualizar = () => setDisponible(true)
    window.addEventListener('nutria:pwa-update', actualizar)
    const mensaje = (evento) => {
      if (evento.data?.type === 'NUTRIA_PWA_ACTUALIZADA' &&
          navigator.serviceWorker.controller) actualizar()
    }
    navigator.serviceWorker?.addEventListener('message', mensaje)
    return () => {
      window.removeEventListener('nutria:pwa-update', actualizar)
      navigator.serviceWorker?.removeEventListener('message', mensaje)
    }
  }, [])
  if (!disponible) return null
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[210] mx-auto max-w-lg rounded-2xl border border-[#8fc4a2] bg-[#e6f4e9] p-3 text-[#1b583c] shadow-[0_14px_40px_rgba(14,51,32,.26)] md:bottom-5">
      <div className="flex items-center gap-3">
        <RefreshCw size={20} className="shrink-0"/>
        <p className="min-w-0 flex-1 text-xs font-bold">NutriA tiene una versión nueva con los apartados actualizados.</p>
        <button type="button" onClick={() => window.location.reload()}
          className="min-h-10 rounded-xl bg-[#287554] px-3 text-xs font-black text-white">Actualizar</button>
        <button type="button" aria-label="Más tarde" onClick={() => setDisponible(false)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"><X size={18}/></button>
      </div>
    </div>
  )
}
