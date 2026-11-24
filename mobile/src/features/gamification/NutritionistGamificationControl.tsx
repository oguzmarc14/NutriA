import { showNotice } from '@/shared/ui/NoticeDialog'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'

type Preferences = { permitidaPorNutriologo: boolean; participa: boolean; activa: boolean }
export function NutritionistGamificationControl({ patientId }: { patientId: string }) {
  const path = '/gamificacion/paciente/' + patientId
  const resource = useResource<{ preferencias: Preferences }>(path)
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const prefs = resource.data?.preferencias
  function confirm() {
    if (!prefs || busy) return
    showNotice(prefs.permitidaPorNutriologo ? 'Pausar reconocimientos' : 'Permitir reconocimientos',
      'Solo cambia la disponibilidad de la gamificación. El paciente conserva sus registros y decide si participa.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void save(!prefs.permitidaPorNutriologo) },
      ])
  }
  async function save(permitidaPorNutriologo: boolean) {
    if (!session || busy) return
    setBusy(true); setError('')
    try {
      await request(path + '/configuracion', {
        token: session.token, method: 'PATCH', body: { permitidaPorNutriologo },
      })
      resource.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la preferencia.')
    } finally { setBusy(false) }
  }
  return <View style={[styles.card, { borderWidth: 1, borderColor: '#cee1d4', gap: 10 }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="heart-circle-outline" color={colors.green} size={25} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Reconocimientos y bienestar</Text>
    </View>
    <Text style={[styles.body, { fontSize: 14 }]}>
      Permite o pausa este espacio voluntario. No afecta el expediente ni el plan nutricional.
    </Text>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {prefs && <>
      <Text style={styles.body}>{prefs.permitidaPorNutriologo ?
        (prefs.participa ? 'Disponible y activado por el paciente.' : 'Disponible; el paciente aún no lo activó.') :
        'Pausado para este paciente. Su elección sigue guardada.'}</Text>
      <Button disabled={busy} selected={false}
        label={busy ? 'Actualizando…' : prefs.permitidaPorNutriologo ? 'Pausar para este paciente' : 'Volver a permitir'}
        onPress={confirm} />
    </>}
  </View>
}
