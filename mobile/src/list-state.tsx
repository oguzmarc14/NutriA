import { ActivityIndicator, Text } from 'react-native'
import { Button, styles } from './ui'

export function ListState({ loading, error, empty, reload }: {
  loading: boolean
  error?: string
  empty?: string
  reload: () => void
}) {
  if (loading) return <ActivityIndicator accessibilityLabel="Cargando" />
  return (
    <>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
        : empty && <Text style={styles.body}>{empty}</Text>}
      <Button label={error ? 'Reintentar' : 'Actualizar'} selected={false} onPress={reload} />
    </>
  )
}
