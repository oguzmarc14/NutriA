import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import client from '../api/client'

let sdkPromise
function sdk() {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago)
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.referrerPolicy = 'no-referrer'
    script.onload = () => window.MercadoPago ? resolve(window.MercadoPago) : reject(new Error('Formulario no disponible.'))
    script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar Mercado Pago.')) }
    document.head.appendChild(script)
  }).catch(error => { sdkPromise = null; throw error })
  return sdkPromise
}

const statusLabel = {
  processing: 'Estamos verificando el pago. Puedes volver a consultar el estado.',
  confirmed: 'Tu pago fue aprobado. La cita está confirmada.',
  review: 'Recibimos tu pago. Tu consultorio revisará el horario. Evita realizar otro pago.',
  rejected: 'El pago fue rechazado. Selecciona un horario de nuevo para volver a intentar.',
  expired: 'El tiempo para pagar venció. Vuelve a consultar la agenda.',
}
const safeChallenge = result => result.status === 'processing' && typeof result.challenge?.url === 'string' &&
  /^https:\/\//.test(result.challenge.url) && typeof result.challenge.creq === 'string' ? result.challenge : null
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function BankChallenge({ challenge }) {
  const frame = useId()
  const form = useRef(null)
  const submitted = useRef(false)
  useEffect(() => {
    if (submitted.current || !form.current) return
    submitted.current = true
    form.current.submit()
  }, [])
  return <section className="space-y-2">
    <h2 className="font-bold">Verificación del banco</h2>
    <iframe title="Verificación del banco" name={frame} className="h-[470px] w-full rounded-xl border" referrerPolicy="no-referrer" />
    <form ref={form} action={challenge.url} method="post" target={frame}>
      <input type="hidden" name="creq" value={challenge.creq} />
    </form>
  </section>
}

export default function PagarCitaPage() {
  const { hash } = useLocation()
  const id = hash.slice(1)
  const valid = /^[a-f0-9-]{36}\.[a-zA-Z0-9_-]{43}$/i.test(id)
  const container = 'mp-card-' + useId().replace(/[^a-zA-Z0-9-]/g, '')
  const [booking, setBooking] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [sending, setSending] = useState(false)
  const lock = useRef(false)
  const publicKey = booking?.status === 'reserved' ? booking.publicKey : undefined
  const amount = booking?.montoCentavos

  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    async function load() {
      try {
        const { data } = await client.get('/agenda-cobros/reserva', {
          headers: { 'X-Booking-Token': id }, signal: controller.signal,
        })
        if (controller.signal.aborted) return
        setBooking(data)
        setChallenge(safeChallenge(data))
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.response?.data?.message || 'No se pudo consultar el estado del pago.')
      }
    }
    void load()
    const timer = setInterval(() => void load(), 8000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [valid, id, reload])

  useEffect(() => {
    if (!publicKey || !amount) return
    let active = true
    let widget
    sdk().then(async MercadoPago => {
      if (!active) return
      const mp = new MercadoPago(publicKey, { locale: 'es-MX' })
      widget = await mp.bricks().create('cardPayment', container, {
        initialization: { amount: amount / 100 },
        customization: { paymentMethods: { maxInstallments: 1 } },
        callbacks: {
          onReady: () => { if (active) setError('') },
          onError: () => { if (active) setError('No se pudo mostrar el formulario de tarjeta.') },
          onSubmit: async (data, card) => {
            if (lock.current) return
            lock.current = true
            setSending(true)
            setError('')
            try {
              const { data: result } = await client.post('/agenda-cobros/pagar', {
                token: data.token, payment_method_id: data.payment_method_id,
                installments: Number(data.installments),
                type: card?.paymentTypeId,
              }, { headers: { 'X-Booking-Token': id } })
              setBooking(result)
              setChallenge(safeChallenge(result))
            } catch {
              setError('No recibimos respuesta del pago. Consulta su estado antes de intentar de nuevo.')
              setReload(value => value + 1)
              throw new Error('No se recibió confirmación del pago.')
            } finally { lock.current = false; setSending(false) }
          },
        },
      })
      if (!active) widget.unmount()
    }).catch(() => { if (active) setError('No se pudo abrir el formulario de Mercado Pago.') })
    return () => { active = false; widget?.unmount() }
  }, [publicKey, amount, id, container])

  return <main className="min-h-dvh bg-[#edf5ee] p-4 sm:p-8">
    <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-[#c8ded3] bg-white p-5 text-[#173f34] sm:p-7">
      <h1 className="text-2xl font-black">Pagar consulta</h1>
      {booking && <>
        <p className="text-sm font-bold">{booking.tipo === 'primera' ? 'Primera visita' : 'Seguimiento'} · {money.format(booking.montoCentavos / 100)} MXN</p>
        <p className="text-sm">{new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: booking.zonaHoraria }).format(new Date(booking.inicio))}</p>
      </>}
      {publicKey && <p className="text-xs">Tu tarjeta se procesa de forma segura con Mercado Pago.</p>}
      {publicKey && <div id={container} />}
      {challenge && booking?.status === 'processing' && <BankChallenge challenge={challenge} />}
      {sending && <p role="status">Enviando el pago…</p>}
      {!booking && valid && !error && <p role="status">Cargando tu reserva…</p>}
      {booking && statusLabel[booking.status] && <p role="status" className="rounded-xl bg-[#e9f4ec] p-3">{statusLabel[booking.status]}</p>}
      {(!valid || error) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{valid ? error : 'La reserva no está disponible.'}</p>}
      {booking?.status === 'reserved' && !publicKey && <p>El consultorio no puede recibir este pago en línea.</p>}
      <Link to="/mis-citas" className="inline-flex min-h-11 items-center font-bold underline">Ver mis citas</Link>
    </section>
  </main>
}
