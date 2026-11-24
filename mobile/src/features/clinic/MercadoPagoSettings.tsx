import { useRef, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { FormField } from '@/shared/ui/FormField'
import { ListState } from '@/shared/ui/ListState'
import { Button, styles } from '@/shared/ui/primitives'

type Config = { habilitado: boolean; conectado: boolean; primeraCentavos: number; seguimientoCentavos: number }
const display = (amount: number) => amount > 0 ? (amount / 100).toFixed(2) : ''
function toCents(value: string) {
  const text = value.trim()
  if (!text) return 0
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(text)) return Number.NaN
  return Math.round(Number(text.replace(',', '.')) * 100)
}

export function MercadoPagoSettings() {
  const { session } = useAuth()
  const config = useResource<Config>('/agenda-cobros/configuracion')
  const [amounts, setAmounts] = useState<{ first: string; follow: string }>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const lock = useRef(false)
  const first = amounts?.first ?? display(config.data?.primeraCentavos || 0)
  const follow = amounts?.follow ?? display(config.data?.seguimientoCentavos || 0)

  async function run(connect: boolean) {
    if (!session || lock.current) return
    lock.current = true
    setBusy(true); setError(''); setMessage('')
    try {
      if (connect) {
        const { url } = await request<{ url: string }>('/agenda-cobros/conectar', { token: session.token })
        await Linking.openURL(url)
        setMessage('Cuando autorices la cuenta, vuelve a NutriA y comprueba la conexión.')
      } else {
        const primeraCentavos = toCents(first), seguimientoCentavos = toCents(follow)
        if ([primeraCentavos, seguimientoCentavos].some(n => !Number.isInteger(n) || n > 10000000))
          throw new Error('Ingresa importes válidos en MXN, con hasta dos decimales.')
        await request('/agenda-cobros/configuracion', { method: 'PUT', token: session.token, body: { primeraCentavos, seguimientoCentavos } })
        setAmounts(undefined)
        config.reload()
        setMessage('Tarifas guardadas.')
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el cobro.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Pago automático con tarjeta</Text>
    <ListState {...config} />
    {config.data && <>
      <Text style={styles.body}>{config.data.conectado ? 'Cuenta de Mercado Pago vinculada.' : 'Vincula tu propia cuenta de Mercado Pago para recibir los cobros.'}</Text>
      <Button label={config.data.conectado ? 'Renovar conexión' : 'Conectar Mercado Pago'}
        disabled={busy || !config.data.habilitado} onPress={() => void run(true)} />
      {!config.data.habilitado && <Text style={styles.body}>NutriA aún no tiene activada la conexión con Mercado Pago.</Text>}
      <Button label="Comprobar conexión" selected={false} disabled={busy} onPress={config.reload} />
      <FormField label="Primera visita (MXN)" numeric value={first} disabled={busy}
        onChange={value => setAmounts({ first: value, follow })} />
      <FormField label="Seguimiento (MXN)" numeric value={follow} disabled={busy}
        onChange={value => setAmounts({ first, follow: value })} />
      <Text style={styles.body}>Deja la tarifa vacía para desactivar el pago en línea para ese tipo de cita.</Text>
      <Button label={busy ? 'Guardando…' : 'Guardar tarifas'} disabled={busy || !amounts} onPress={() => void run(false)} />
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>
}
