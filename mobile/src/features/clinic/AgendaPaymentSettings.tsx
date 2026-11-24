import { useRef, useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { Button, colors, styles } from '@/shared/ui/primitives'

type PaymentSettings = { whatsapp: string; enlaceMercadoPago: string }

export function AgendaPaymentSettings() {
  const { session } = useAuth()
  const resource = useResource<{ cobros: PaymentSettings }>('/clinica/cobros')
  const [draft, setDraft] = useState<PaymentSettings | null>(null)
  const [saved, setSaved] = useState<PaymentSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const form = draft || saved || resource.data?.cobros

  async function save() {
    if (!session || !draft || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const data = await request<{ cobros: PaymentSettings }>('/clinica/cobros', {
        token: session.token, method: 'PUT', body: draft,
      })
      setSaved(data.cobros)
      setDraft(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return <View style={{ gap: 14 }}>
    <ListState {...resource} />
    {form && <>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="logo-whatsapp" size={23} color={colors.green} />
          <Text accessibilityRole="header" style={styles.cardTitle}>Efectivo por WhatsApp</Text>
        </View>
        <Text style={styles.body}>El paciente usa este número público para confirmar el horario y acordar el pago.</Text>
        <FormField label="WhatsApp del consultorio, con código de país" value={form.whatsapp}
          disabled={busy} onChange={whatsapp => setDraft({ ...form, whatsapp })} />
      </View>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="card-outline" size={23} color={colors.green} />
          <Text accessibilityRole="header" style={styles.cardTitle}>Pago en línea</Text>
        </View>
        <Text style={styles.body}>Agrega un enlace de tu cuenta de Mercado Pago para cobrar con tarjeta.</Text>
        <FormField label="Link de pago de Mercado Pago" value={form.enlaceMercadoPago}
          disabled={busy} onChange={enlaceMercadoPago => setDraft({ ...form, enlaceMercadoPago })} />
      </View>
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {saved && !draft && <Text accessibilityLiveRegion="polite" style={styles.body}>Configuración de cobros guardada.</Text>}
    {form && <Button label={busy ? 'Guardando…' : 'Guardar configuración de pagos'}
      disabled={!draft || busy} onPress={() => void save()} />}
  </View>
}
