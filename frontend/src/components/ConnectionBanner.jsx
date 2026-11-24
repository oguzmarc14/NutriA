import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function ConnectionBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  if (!offline) return null
  return <div role="status" className="relative z-[240] flex items-center justify-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950">
    <WifiOff size={18} className="shrink-0" aria-hidden="true" />
    <span>Sin conexión a internet. Conserva abiertos tus cambios y vuelve a intentar al reconectarte.</span>
  </div>
}
