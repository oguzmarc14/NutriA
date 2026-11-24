import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { Button, styles } from '@/shared/ui/primitives'

type Entry = { _id: string; inicio: string; zonaHoraria: string; patient?: { name: string } }
type Paid = Entry & { montoPagadoCentavos: number }
type Review = Entry & { montoCentavos: number; changeReason: string; paymentId: string }
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = (item: Entry) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: item.zonaHoraria }).format(new Date(item.inicio))

export function PaidAppointments() {
  const { session } = useAuth()
  const { data, reload, error } = useResource<{ citas: Paid[]; reviews: Review[] }>('/agenda-cobros/revision')
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const lock = useRef(false)

  async function acknowledge(id: string) {
    if (!session || lock.current) return
    lock.current = true
    setBusy(id); setActionError('')
    try {
      await request('/agenda-cobros/citas/' + id + '/enterado', { method: 'PATCH', token: session.token })
      reload()
    } catch { setActionError('No se pudo marcar esta cita como revisada.') }
    finally { lock.current = false; setBusy('') }
  }

  if (error) return <Button label="Reintentar carga de pagos" selected={false} onPress={reload} />
  if (!data || (!data.citas.length && !data.reviews.length)) return null
  return <>
    <Text accessibilityRole="header" style={styles.cardTitle}>Citas y pagos por revisar</Text>
    {data.citas.map(item => <View key={item._id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.patient?.name || 'Paciente'}</Text>
      <Text style={styles.body}>Confirmada y pagada · {date(item)}</Text>
      <Text style={styles.body}>{money.format(item.montoPagadoCentavos / 100)} MXN</Text>
      <Button label={busy === item._id ? 'Guardando…' : 'Marcar como enterado'} disabled={!!busy}
        onPress={() => void acknowledge(item._id)} />
    </View>)}
    {data.reviews.map(item => <View key={item._id} style={[styles.card, { backgroundColor: '#fff2da' }]}>
      <Text style={styles.cardTitle}>Pago recibido · Requiere revisión</Text>
      <Text style={styles.body}>{item.patient?.name || 'Paciente'} · {date(item)}</Text>
      <Text style={styles.body}>{money.format(item.montoCentavos / 100)} MXN · {item.changeReason}</Text>
      <Text style={styles.body}>Referencia de Mercado Pago: {item.paymentId}</Text>
    </View>)}
    {!!actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
  </>
}
