import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'

export default function AlertasAccion() {
  const dialog = useRef(null)
  const pending = useRef(null)
  const cancelButton = useRef(null)
  const { theme } = useTheme()
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState(null)
  const timer = useRef(null)
  const noticeRef = useRef(null)
  const { key } = useLocation()

  function settle(accepted) {
    const request = pending.current
    if (!request) return
    pending.current = null
    if (dialog.current?.open) dialog.current.close()
    setConfirmation(null)
    request.resolve(accepted)
  }

  useEffect(() => {
    function ask(event) {
      event.preventDefault()
      if (pending.current) {
        event.detail.resolve(false)
        return
      }
      pending.current = event.detail
      setConfirmation(event.detail)
    }
    function announce(event) {
      clearTimeout(timer.current)
      setNotice({ text: event.detail })
      timer.current = setTimeout(() => setNotice(null), 5500)
    }
    window.addEventListener('nutria:confirmar', ask)
    window.addEventListener('nutria:resultado', announce)
    return () => {
      window.removeEventListener('nutria:confirmar', ask)
      window.removeEventListener('nutria:resultado', announce)
      clearTimeout(timer.current)
      pending.current?.resolve(false)
      pending.current = null
    }
  }, [])

  useEffect(() => { settle(false) }, [key])
  useEffect(() => {
    if (confirmation && !dialog.current.open) {
      dialog.current.showModal()
      cancelButton.current?.focus()
    }
  }, [confirmation])
  useEffect(() => {
    if (notice) noticeRef.current?.showPopover?.()
  }, [notice])

  return (
    <>
      <dialog ref={dialog} aria-labelledby="accion-titulo"
        aria-describedby={confirmation?.detalle ? 'accion-detalle' : undefined}
        onCancel={event => { event.preventDefault(); settle(false) }}
        onClick={event => { if (event.target === event.currentTarget) settle(false) }}
        className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl bg-transparent p-0 backdrop:bg-black/45">
        <section className={`rounded-2xl border p-5 shadow-xl ${theme === 'dark' ? 'border-[#3d6456] bg-[#19352c] text-[#eef7f1]' : 'border-[#c9ddcf] bg-[#f7fbf8] text-[#173f34]'}`}>
          <h2 id="accion-titulo" className="text-lg font-bold">{confirmation?.titulo}</h2>
          {!!confirmation?.detalle && <p id="accion-detalle" className="mt-2 text-sm leading-6">{confirmation.detalle}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button ref={cancelButton} type="button" onClick={() => settle(false)}
              className="min-h-11 rounded-xl border border-current/20 px-4 text-sm font-semibold">Volver</button>
            <button type="button" onClick={() => settle(true)}
              className={`min-h-11 rounded-xl px-4 text-sm font-bold text-white ${confirmation?.peligro ? 'bg-red-700' : 'bg-[#246b55]'}`}>
              Confirmar
            </button>
          </div>
        </section>
      </dialog>
      {notice && (
        <aside ref={noticeRef} popover={typeof HTMLElement.prototype.showPopover === 'function' ? 'manual' : undefined}
          className="fixed inset-auto right-3 top-3 z-[300] m-0 flex w-[min(24rem,calc(100%-1.5rem))] items-center gap-3 rounded-xl border border-[#b8d3c2] bg-[#eff9f2] p-3 text-[#174833] shadow-lg">
          <CheckCircle2 size={20} aria-hidden="true" className="shrink-0" />
          <span role="status" className="flex-1 text-sm font-semibold">{notice.text}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-black/5"><X size={17} /></button>
        </aside>
      )}
    </>
  )
}
