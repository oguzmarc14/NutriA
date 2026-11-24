import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { MercadoPagoSettings } from '@/features/clinic/MercadoPagoSettings'
import { AgendaPaymentSettings } from '@/features/clinic/AgendaPaymentSettings'
import { Page, styles } from '@/shared/ui/primitives'

export default function PaymentSettingsScreen() {
  const { session } = useAuth()
  if (session?.user.role !== 'nutritionist') return null

  return <Page bottomInset>
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={styles.title}>Formas de pago</Text>
      <Text style={styles.body}>Elige cómo podrán pagar los pacientes desde tu agenda pública.</Text>
    </View>
    <MercadoPagoSettings />
    <AgendaPaymentSettings />
  </Page>
}
