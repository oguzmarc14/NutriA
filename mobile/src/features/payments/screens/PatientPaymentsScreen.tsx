import { router } from 'expo-router'
import { Text } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { ListState } from '@/shared/ui/ListState'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { PaymentList } from '../PaymentList'
import type { PaymentData } from '../models'
export default function PatientPaymentsScreen() {
  const resource = useResource<PaymentData>('/pagos/mios')
  return <Page bottomInset>
    <Text style={styles.title}>Mis pagos</Text>
    <Text style={styles.body}>Reporta un pago que ya realizaste y consulta si tu nutrióloga confirmó su recepción. Reportarlo aquí no realiza cargos ni transferencias.</Text>
    <Button label="Reportar un pago" onPress={() => router.push('/reportar-pago')} />
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {resource.data && <PaymentList payments={resource.data.pagos} />}
  </Page>
}
