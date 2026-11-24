import { showNotice } from '@/shared/ui/NoticeDialog'
import { useNavigation, usePreventRemove } from '@react-navigation/native'

export function useUnsavedChanges(dirty: boolean, busy: boolean, blockedReason?: string) {
  const navigation = useNavigation()
  usePreventRemove(dirty || busy || !!blockedReason, ({ data }) => {
    if (busy) { showNotice('Guardando', 'Espera a que termine el guardado.'); return }
    if (blockedReason) { showNotice('Revisa la distribución', blockedReason); return }
    showNotice('Cambios sin guardar', 'Si sales ahora se perderán los cambios de esta pantalla.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Salir sin guardar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ])
  })
}
