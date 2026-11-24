import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Button, colors, Page, styles } from '@/shared/ui/primitives'

type Slot = { hora: string; inicio: string }
type Agenda = { profesional: string; zonaHoraria: string; dias: { fecha: string; espacios: Slot[] }[] }
type Price = { tipo: 'primera' | 'seguimiento'; montoCentavos: number }
const checkoutOrigin = 'https://nutri-a-six.vercel.app'
const checkoutPath = '/pagar-cita'
const reservationPattern = /^[a-f0-9-]{36}\.[a-zA-Z0-9_-]{43}$/i
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const asDay = (value: string) => new Date(value + 'T12:00:00Z')

export default function ReserveAppointment() {
  const router = useRouter()
  const { clinic } = useLocalSearchParams<{ clinic: string }>()
  const { session } = useAuth()
  const id = typeof clinic === 'string' && /^[a-f0-9]{24}$/i.test(clinic) ? clinic : null
  const price = useResource<Price>(id ? '/agenda-cobros/tarifa/' + id : null)
  const agenda = useResource<Agenda>(id ? '/agenda-publica/' + id + '?dias=21' : null)
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
  const selectedSlot = current?.espacios.find(slot => slot.inicio === selected?.inicio)
  const time = (slot: Slot) => new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: agenda.data?.zonaHoraria,
  }).format(new Date(slot.inicio))

  async function pay() {
    if (!session || !id || !selectedSlot || !price.data || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const result = await request<{ reserva: string }>('/agenda-cobros/reservar', {
        token: session.token, body: { nutritionist: id, inicio: selectedSlot.inicio, montoCentavos: price.data.montoCentavos },
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

  return <View style={styles.safe}>
    <Page>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Horarios disponibles</Text>
        {agenda.data && <Text style={styles.body}>{agenda.data.profesional} · Consulta de 60 min</Text>}
      </View>
      <ListState {...price} />
      <ListState {...agenda} empty={!available.length && agenda.data ? 'No hay horarios libres en los próximos 21 días.' : undefined} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {current && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Elige una fecha</Text>
        <Text style={styles.body}>Desliza para ver más fechas disponibles.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={checkoutStyles.dateRail}>
            {available.map(item => {
              const active = current.fecha === item.fecha
              return <Pressable key={item.fecha} accessibilityRole="button"
                accessibilityLabel={date.format(asDay(item.fecha)) + ', ' + item.espacios.length + ' horarios libres'}
                accessibilityState={{ selected: active, disabled: busy }} disabled={busy}
                onPress={() => { setDay(item.fecha); setSelected(undefined) }}
                style={[checkoutStyles.dateChip, active && checkoutStyles.dateActive]}>
                <Text style={[checkoutStyles.dateLabel, active && checkoutStyles.dateActiveLabel]}>{shortDate.format(asDay(item.fecha))}</Text>
                <Text style={[styles.body, active && checkoutStyles.dateActiveLabel]}>{item.espacios.length} libres</Text>
              </Pressable>
            })}
          </View>
        </ScrollView>
      </View>}
      {current && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Horas libres</Text>
        <Text style={styles.body}>{date.format(asDay(current.fecha))} · Hora del consultorio</Text>
        <View style={styles.row}>{current.espacios.map(slot => <Button key={slot.inicio} label={time(slot)}
          disabled={busy} selected={selectedSlot?.inicio === slot.inicio} onPress={() => setSelected(slot)} />)}</View>
      </View>}
    </Page>
    {price.data && current && <SafeAreaView edges={['bottom', 'left', 'right']} style={checkoutStyles.summary}>
      <View style={checkoutStyles.footer}>
        <Text style={styles.cardTitle}>{price.data.tipo === 'primera' ? 'Primera visita' : 'Seguimiento'} · {money.format(price.data.montoCentavos / 100)} MXN</Text>
        <Text style={styles.body}>{selectedSlot ? shortDate.format(asDay(current.fecha)) + ' · ' + time(selectedSlot) : 'Selecciona una hora para continuar.'}</Text>
        {selectedSlot && <Text style={styles.body}>Tu horario se aparta 15 minutos para pagar.</Text>}
        <Button label={busy ? 'Abriendo pago…' : 'Continuar al pago'} disabled={busy || !selectedSlot} onPress={() => void pay()} />
      </View>
    </SafeAreaView>}
  </View>
}

const checkoutStyles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#edf5ee' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', backgroundColor: '#edf5ee' },
  center: { flex: 1, justifyContent: 'center', padding: 18, gap: 12 },
  dateRail: { flexDirection: 'row', gap: 8, paddingBottom: 6 },
  dateChip: { minWidth: 104, padding: 10, gap: 4, alignItems: 'center', borderRadius: 13, borderColor: colors.border, borderWidth: 1 },
  dateActive: { backgroundColor: colors.green, borderColor: colors.green },
  dateLabel: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  dateActiveLabel: { color: colors.white },
  summary: { backgroundColor: colors.white },
  footer: { gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
})
