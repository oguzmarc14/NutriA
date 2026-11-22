import { Modal } from 'react-native'
import { Page, Button } from '@/shared/ui/primitives'
import { InlineFoodSearch } from './InlineFoodSearch'
import type { CatalogFood } from './models'
export function CatalogPicker({ onChoose, onClose }: { onChoose: (food: CatalogFood) => void; onClose: () => void }) {
  return <Modal animationType="slide" onRequestClose={onClose}><Page title="Catálogo de alimentos">
    <Button selected={false} label="Cerrar" onPress={onClose} />
    <InlineFoodSearch disabled={false} onChoose={onChoose} />
  </Page></Modal>
}
