import { useRef, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { openBrowserAsync } from 'expo-web-browser'
import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, styles } from '@/shared/ui/primitives'

type Slot = { hora: string; inicio: string }
type Agenda = { profesional: string; dias: { fecha: string; espacios: Slot[] }[] }
type Price = { tipo: 'primera' | 'seguimiento'; montoCentavos: number }
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' })

export default function ReserveAppointment() {
  const { clinic } = useLocalSearchParams<{ clinic: string }>()
  const { session } = useAuth()
  const id = typeof clinic === 'string' && /^[a-f0-9]{24}$/i.test(clinic) ? clinic : null
  const price = useResource<Price>(id ? '/agenda-cobros/tarifa/' + id : null)
  const agenda = useResource<Agenda>(id ? '/agenda-publica/' + id : null)
  const [day, setDay] = useState('')
  const [selected, setSelected] = useState<Slot>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const available = agenda.data?.dias.filter(item => item.espacios.length) || []
  const current = available.find(item => item.fecha === day) || available[0]

  async function pay() {
    if (!session || !id || !selected || !price.data || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const result = await request<{ reserva: string }>('/agenda-cobros/reservar', {
        token: session.token, body: { nutritionist: id, inicio: selected.inicio, montoCentavos: price.data.montoCentavos },
      })
      await openBrowserAsync('https://nutri-a-six.vercel.app/pagar-cita#' + encodeURIComponent(result.reserva), { toolbarColor: '#edf5ee' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir el formulario de pago.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <Page bottomInset>
    <ListState {...price} />
    <ListState {...agenda} empty={!available.length && agenda.data ? 'No hay espacios disponibles.' : undefined} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {price.data && !!current && <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{agenda.data?.profesional}</Text>
      <Text style={styles.body}>{price.data.tipo === 'primera' ? 'Primera visita' : 'Seguimiento'} · {money.format(price.data.montoCentavos / 100)} MXN</Text>
      <Text style={styles.body}>Al continuar, apartamos el horario durante 15 minutos para que puedas pagar.</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>Elige un día</Text>
      {available.map(item => <Button key={item.fecha} label={date.format(new Date(item.fecha + 'T12:00:00Z'))}
        selected={current.fecha === item.fecha} disabled={busy} onPress={() => { setDay(item.fecha); setSelected(undefined) }} />)}
      <Text accessibilityRole="header" style={styles.cardTitle}>Horarios del día</Text>
      <View style={styles.row}>{current.espacios.map(slot => <Button key={slot.inicio} label={slot.hora}
        disabled={busy} selected={selected?.inicio === slot.inicio} onPress={() => setSelected(slot)} />)}</View>
      <Button label={busy ? 'Abriendo pago…' : 'Pagar y reservar'} disabled={busy || !selected} onPress={() => void pay()} />
    </View>}
  </Page>
}
