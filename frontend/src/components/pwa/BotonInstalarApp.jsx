import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

function BotonInstalarApp() {
  const [eventoInstalacion, setEventoInstalacion] = useState(null)

  useEffect(() => {
    function prepararInstalacion(event) {
      event.preventDefault()
      setEventoInstalacion(event)
    }

    function limpiarInstalacion() {
      setEventoInstalacion(null)
    }

    window.addEventListener('beforeinstallprompt', prepararInstalacion)
    window.addEventListener('appinstalled', limpiarInstalacion)

    return () => {
      window.removeEventListener('beforeinstallprompt', prepararInstalacion)
      window.removeEventListener('appinstalled', limpiarInstalacion)
    }
  }, [])

  if (!eventoInstalacion) return null

  async function instalar() {
    await eventoInstalacion.prompt()
    await eventoInstalacion.userChoice
    setEventoInstalacion(null)
  }

  return (
    <button
      type="button"
      onClick={instalar}
      className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cfe0d7] bg-white px-2.5 text-xs font-bold text-[#246b55] shadow-sm transition hover:bg-[#edf5f1] sm:px-3"
      aria-label="Instalar NutriA"
    >
      <Download size={16} />
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  )
}

export default BotonInstalarApp
