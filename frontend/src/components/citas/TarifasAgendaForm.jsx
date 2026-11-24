import { useEffect, useRef, useState } from 'react'
import client from '../../api/client'

const fields = [['primeraCentavos', 'Primera visita'], ['seguimientoCentavos', 'Seguimiento']]
const display = cents => cents > 0 ? (cents / 100).toFixed(2) : ''
function parseAmount(value) {
  if (!value.trim()) return 0
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(value.trim())) return Number.NaN
  return Math.round(Number(value.trim().replace(',', '.')) * 100)
}

export default function TarifasAgendaForm() {
  const [config, setConfig] = useState(null)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const lock = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    client.get('/agenda-cobros/configuracion', { signal: controller.signal }).then(({ data }) => {
      setConfig(data)
      setValues(Object.fromEntries(fields.map(([key]) => [key, display(data[key])])))
    }).catch(() => { if (!controller.signal.aborted) setError('No se pudo cargar la configuración de pagos.') })
    return () => controller.abort()
  }, [])

  async function run(action) {
    if (lock.current) return
    lock.current = true
    setBusy(true); setError(''); setMessage('')
    try { await action() }
    catch (cause) { setError(cause.response?.data?.message || cause.message || 'No se pudo actualizar el pago.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <form onSubmit={event => {
    event.preventDefault()
    if (!config) return
    void run(async () => {
      const payload = Object.fromEntries(fields.map(([key]) => [key, parseAmount(values[key] || '')]))
      if (Object.values(payload).some(amount => !Number.isInteger(amount) || amount < 0 || amount > 10000000))
        throw new Error('Ingresa montos válidos en MXN, con hasta dos decimales.')
      await client.put('/agenda-cobros/configuracion', payload)
      setMessage('Tarifas guardadas.')
    })
  }} className="mt-6 space-y-4 rounded-3xl border border-[#d4e5d9] bg-white p-5 text-[#173f34]">
    <h2 className="text-lg font-extrabold">Pago automático con tarjeta</h2>
    {config && <>
      <p className="text-sm">{config.conectado ? 'Cuenta de Mercado Pago vinculada.' : 'Vincula tu cuenta de Mercado Pago para recibir tus cobros.'}</p>
      <button type="button" disabled={busy || !config.habilitado}
        className="min-h-11 rounded-xl border border-[#83b49c] px-4 font-bold disabled:opacity-50"
        onClick={() => void run(async () => {
          const { data } = await client.get('/agenda-cobros/conectar')
          window.location.assign(data.url)
        })}>{config.conectado ? 'Renovar conexión' : 'Conectar Mercado Pago'}</button>
      {!config.habilitado && <p className="text-sm">NutriA aún no tiene activada la conexión con Mercado Pago.</p>}
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, label]) => <label key={key} className="grid gap-1 text-sm font-bold">{label} (MXN)
          <input inputMode="decimal" value={values[key] || ''} onChange={event => setValues({ ...values, [key]: event.target.value })}
            className="rounded-xl border border-[#cadfd1] p-3 font-normal" />
        </label>)}
      </fieldset>
      <p className="text-xs">Una tarifa vacía desactiva el cobro en línea para ese tipo de cita.</p>
      <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white disabled:opacity-50">Guardar tarifas</button>
    </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>
}
