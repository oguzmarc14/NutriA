import { useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { compartirReconocimiento } from '../../utils/compartirReconocimiento.js'

// HU-31: acción explícita del paciente. El navegador decide qué redes/apps
// aparecen. No se envía nada al backend ni a terceros automáticamente.
export default function CompartirReconocimiento({ logro }) {
  const [estado, setEstado] = useState('')
  const [mensajeManual, setMensajeManual] = useState('')
  const [compartiendo, setCompartiendo] = useState(false)
  const textoRef = useRef(null)

  async function manejarCompartir() {
    if (compartiendo) return
    setCompartiendo(true)
    setEstado('')
    setMensajeManual('')
    try {
      const resultado = await compartirReconocimiento(logro, {
        share: typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined,
        writeText: typeof navigator.clipboard?.writeText === 'function'
          ? navigator.clipboard.writeText.bind(navigator.clipboard)
          : undefined,
      })
      if (resultado.estado === 'copiado') {
        setEstado('Texto copiado. Puedes pegarlo en la red social que prefieras.')
      } else if (resultado.estado === 'seleccionado') {
        setEstado('Terminaste de usar el menú para compartir.')
      } else if (resultado.estado === 'manual') {
        setMensajeManual(resultado.mensaje)
        setEstado('Selecciona el texto para compartirlo manualmente.')
      } else if (resultado.estado === 'no-disponible') {
        setEstado('Este reconocimiento todavía no está disponible para compartir.')
      }
      // Cancelar no produce notificaciones de éxito ni efectos secundarios.
    } finally {
      setCompartiendo(false)
    }
  }

  return (
    <div className="mt-3 min-w-0 space-y-2">
      <button
        type="button"
        onClick={manejarCompartir}
        disabled={compartiendo}
        aria-label={'Compartir reconocimiento: ' + logro.titulo}
        className="inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-xl border border-[#a9cfb7] bg-[#e2efe6] px-3.5 py-2 text-xs font-extrabold text-[#246b55] transition hover:border-[#6ca787] hover:bg-[#d1e7d8] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-[#5d9973] dark:bg-[#315b43] dark:text-[#e1f7e9]"
      >
        {estado.startsWith('Texto copiado') ? <Check size={16} aria-hidden="true" /> :
          <Share2 size={16} aria-hidden="true" />}
        {compartiendo ? 'Preparando…' : 'Compartir logro'}
      </button>
      {estado && <p role="status" className="break-words text-xs leading-5 text-[#476d5a] dark:text-[#c0dfc9]">{estado}</p>}
      {mensajeManual && (
        <div className="min-w-0 space-y-2">
          <label className="block text-xs font-bold text-[#315f49] dark:text-[#d8f0e0]">
            Texto para compartir
            <textarea
              ref={textoRef}
              readOnly
              rows={5}
              value={mensajeManual}
              onFocus={event => event.target.select()}
              className="mt-1 block w-full min-w-0 resize-y rounded-xl border border-[#b5d3be] bg-[#f4faf5] p-3 text-xs leading-5 text-[#173f34] dark:border-[#648e70] dark:bg-[#294936] dark:text-[#e1f4e8]"
            />
          </label>
          <button type="button" onClick={() => textoRef.current?.select()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#a9cfb7] px-3 text-xs font-bold text-[#246b55] dark:text-[#d8f0e0]">
            <Copy size={15} aria-hidden="true" /> Seleccionar texto
          </button>
        </div>
      )}
    </div>
  )
}
