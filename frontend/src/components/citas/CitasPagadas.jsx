import { useCallback, useEffect, useState } from 'react'
import client from '../../api/client'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = item => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: item.zonaHoraria }).format(new Date(item.inicio))
export default function CitasPagadas() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const { data } = await client.get('/agenda-cobros/revision')
    setData(data)
  }, [])
  useEffect(() => {
    void load().catch(() => {})
    const timer = setInterval(() => { if (!document.hidden) void load().catch(() => {}) }, 30000)
    return () => clearInterval(timer)
  }, [load])
  if (!data || (!data.citas.length && !data.reviews.length)) return null
  return <section className="space-y-3 rounded-2xl border border-[#bcd6c6] bg-white p-4 text-[#173f34]">
    <h2 className="font-extrabold">Citas y pagos por revisar</h2>
    {data.citas.map(cita => <div key={cita._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#eaf5ed] p-3">
      <div><p className="font-bold">{cita.patient?.name || 'Paciente'} · Confirmada</p>
        <p className="text-sm">{date(cita)} · {money.format(cita.montoPagadoCentavos / 100)} MXN</p></div>
      <button type="button" disabled={!!busy} className="min-h-11 rounded-xl bg-[#246b55] px-3 text-sm font-semibold text-white"
        onClick={async () => {
          setBusy(cita._id); setError('')
          try {
            await client.patch('/agenda-cobros/citas/' + cita._id + '/enterado')
            await load()
          } catch { setError('No se pudo actualizar la cita.') }
          finally { setBusy('') }
        }}>{busy === cita._id ? 'Guardando…' : 'Marcar como enterado'}</button>
    </div>)}
    {data.reviews.map(pago => <div key={pago._id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-bold">Pago recibido · Requiere revisión</p>
      <p>{pago.patient?.name || 'Paciente'} · {date(pago)} · {money.format(pago.montoCentavos / 100)} MXN</p>
      <p>{pago.changeReason} Referencia de Mercado Pago: {pago.paymentId}.</p>
    </div>)}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>
}
