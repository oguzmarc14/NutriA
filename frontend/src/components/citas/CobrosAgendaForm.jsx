import { useEffect, useRef, useState } from 'react'
import client from '../../api/client'

export default function CobrosAgendaForm() {
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const lock = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    client.get('/clinica/cobros', { signal: controller.signal }).then(({ data }) => setForm(data.cobros))
      .catch(() => { if (!controller.signal.aborted) setError('No se pudieron cargar los cobros. Recarga la página.') })
    return () => controller.abort()
  }, [])

  async function guardar(event) {
    event.preventDefault()
    if (!form || lock.current) return
    lock.current = true
    setBusy(true)
    setSaved(false)
    setError('')
    try {
      const { data } = await client.put('/clinica/cobros', form)
      setForm(data.cobros)
      setSaved(true)
    } catch (cause) {
      setError(cause.response?.data?.message || 'No se pudieron guardar los cobros.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return <form onSubmit={guardar} className="mt-6 space-y-4 rounded-3xl border border-[#d4e5d9] bg-white p-5">
    <h2 className="text-lg font-extrabold text-[#173f34]">Cobros de la agenda</h2>
    <p className="text-sm text-[#526d5d]">El WhatsApp del consultorio y el Link de pago se mostrarán en tu agenda pública. Crea el enlace desde tu propia cuenta de Mercado Pago.</p>
    {form && <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      {[['whatsapp', 'WhatsApp público', 'tel', 15], ['enlaceMercadoPago', 'Link de pago de Mercado Pago', 'url', 500]].map(([key, label, type, maxLength]) =>
        <label key={key} className="grid gap-1 text-sm font-bold text-[#173f34]">{label}
          <input type={type} maxLength={maxLength} value={form[key]} placeholder={key === 'whatsapp' ? '525512345678' : 'https://mpago.la/…'}
            onChange={event => { setSaved(false); setForm({ ...form, [key]: event.target.value }) }}
            className="rounded-xl border border-[#cadfd1] p-3 font-normal" />
        </label>)}
    </fieldset>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {saved && <p role="status" className="text-sm text-[#246b55]">Configuración guardada.</p>}
    <button type="submit" disabled={!form || busy} className="min-h-11 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar cobros'}</button>
  </form>
}
