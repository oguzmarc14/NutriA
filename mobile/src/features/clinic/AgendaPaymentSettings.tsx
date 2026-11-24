import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { Button, styles } from '@/shared/ui/primitives'

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

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Cobros de la agenda</Text>
    <Text style={styles.body}>Estos datos serán públicos en tu agenda. Usa el WhatsApp del consultorio y un Link de pago de tu cuenta de Mercado Pago México.</Text>
    <ListState {...resource} />
    {form && <>
      <FormField label="WhatsApp con código de país y solo dígitos" value={form.whatsapp}
        disabled={busy} onChange={whatsapp => setDraft({ ...form, whatsapp })} />
      <FormField label="Link de pago de Mercado Pago" value={form.enlaceMercadoPago}
        disabled={busy} onChange={enlaceMercadoPago => setDraft({ ...form, enlaceMercadoPago })} />
      <Button label={busy ? 'Guardando…' : 'Guardar cobros'} disabled={!draft || busy} onPress={() => void save()} />
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {saved && !draft && <Text accessibilityLiveRegion="polite" style={styles.body}>Configuración de cobros guardada.</Text>}
  </View>
}
