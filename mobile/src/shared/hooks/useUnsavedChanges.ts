import { useNavigation, usePreventRemove } from '@react-navigation/native'
import { Alert } from 'react-native'

export function useUnsavedChanges(dirty: boolean, busy: boolean, blockedReason?: string) {
  const navigation = useNavigation()
  usePreventRemove(dirty || busy || !!blockedReason, ({ data }) => {
    if (busy) { Alert.alert('Guardando', 'Espera a que termine el guardado.'); return }
    if (blockedReason) { Alert.alert('Revisa la distribución', blockedReason); return }
    Alert.alert('Cambios sin guardar', 'Si sales ahora se perderán los cambios de esta pantalla.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Salir sin guardar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ])
  })
}
