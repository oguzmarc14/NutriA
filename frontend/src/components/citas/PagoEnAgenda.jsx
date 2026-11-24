import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import client from '../../api/client'

const dinero = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function PagoEnAgenda({ nutritionistId, horario }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tarifa, setTarifa] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const lock = useRef(false)

  useEffect(() => {
    if (user?.role !== 'patient') return
    const controller = new AbortController()
    setTarifa(null)
    client.get('/agenda-cobros/tarifa/' + encodeURIComponent(nutritionistId), { signal: controller.signal })
      .then(({ data }) => setTarifa(data))
      .catch(() => {})
    return () => controller.abort()
  }, [nutritionistId, user?.role])

  async function reservar() {
    if (!tarifa || !horario || lock.current) return
    lock.current = true
    setOcupado(true)
    setError('')
    try {
      const { data } = await client.post('/agenda-cobros/reservar', {
        nutritionist: nutritionistId, inicio: horario.inicio, montoCentavos: tarifa.montoCentavos,
      })
      navigate('/pagar-cita#' + data.reserva)
    } catch (cause) {
      setError(cause.response?.data?.message || 'No se pudo apartar este horario.')
    } finally {
      lock.current = false
      setOcupado(false)
    }
  }

  if (!user) return <p className="mt-3 text-sm">Para reservar con tarjeta, <Link to="/login" className="font-bold underline">inicia sesión como paciente</Link> y vuelve a esta agenda.</p>
  if (!tarifa) return null
  return <div className="mt-4 space-y-2 rounded-xl border border-current/20 p-4">
    <p className="text-sm font-bold">{tarifa.tipo === 'primera' ? 'Primera visita' : 'Seguimiento'} · {dinero.format(tarifa.montoCentavos / 100)} MXN</p>
    <p className="text-xs">Apartaremos el horario durante 15 minutos mientras realizas el pago.</p>
    <button type="button" disabled={ocupado} className="nutria-agenda-primary min-h-11 rounded-xl px-4 text-sm font-bold"
      onClick={() => void reservar()}>{ocupado ? 'Apartando…' : 'Pagar y reservar'}</button>
    {error && <p role="alert" className="text-sm">{error}</p>}
  </div>
}
