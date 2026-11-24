import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Button, colors, Page, styles } from '@/shared/ui/primitives'

type Slot = { hora: string; inicio: string }
type Agenda = { profesional: string; dias: { fecha: string; espacios: Slot[] }[] }
type Price = { tipo: 'primera' | 'seguimiento'; montoCentavos: number }
const checkoutOrigin = 'https://nutri-a-six.vercel.app'
const checkoutPath = '/pagar-cita'
const reservationPattern = /^[a-f0-9-]{36}\.[a-zA-Z0-9_-]{43}$/i
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' })

export default function ReserveAppointment() {
  const router = useRouter()
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
  const [reservation, setReservation] = useState('')
  const [checkoutError, setCheckoutError] = useState(false)
  const [retry, setRetry] = useState(0)
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
      if (!reservationPattern.test(result.reserva)) throw new Error('La reserva no está disponible.')
      setReservation(result.reserva)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir el formulario de pago.') }
    finally { lock.current = false; setBusy(false) }
  }

  if (reservation) {
    const checkoutUrl = checkoutOrigin + checkoutPath + '?app=android#' + reservation
    return <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      {checkoutError ? <View style={checkoutStyles.center}>
        <Text accessibilityRole="alert" style={styles.error}>No se pudo cargar el pago. Reintenta para consultar esta misma reserva.</Text>
        <Button label="Recargar pago" onPress={() => { setCheckoutError(false); setRetry(value => value + 1) }} />
      </View> : <WebView
        key={retry}
        source={{ uri: checkoutUrl }}
        style={checkoutStyles.web}
        originWhitelist={['*']}
        mixedContentMode="never"
        allowFileAccess={false}
        javaScriptCanOpenWindowsAutomatically={false}
        onOpenWindow={() => {}}
        onShouldStartLoadWithRequest={({ url, isTopFrame }) => {
          if (url === checkoutUrl) return true
          if (isTopFrame === false) return url.startsWith('https://') || url === 'about:blank'
          // Android does not report the frame for this callback.
          return isTopFrame === undefined && url.startsWith('https://secure-fields.mercadopago.com/')
        }}
        onError={() => setCheckoutError(true)}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === checkoutUrl || nativeEvent.url === checkoutOrigin + checkoutPath + '?app=android') setCheckoutError(true)
        }}
        startInLoadingState
        renderLoading={() => <View style={checkoutStyles.loading}>
          <ActivityIndicator color={colors.green} accessibilityLabel="Cargando formulario de pago" />
        </View>}
      />}
      <View style={checkoutStyles.footer}>
        <Button label="Ver mis citas" selected={false} onPress={() => router.dismissTo('/mis-citas')} />
      </View>
    </SafeAreaView>
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

const checkoutStyles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#edf5ee' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', backgroundColor: '#edf5ee' },
  center: { flex: 1, justifyContent: 'center', padding: 18, gap: 12 },
  footer: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
})
