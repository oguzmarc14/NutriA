import { Text, TextInput, View } from 'react-native'
import { styles } from './primitives'

export function FormField({ label, value, onChange, numeric, multiline, disabled }: {
  label: string; value: string; onChange: (value: string) => void
  numeric?: boolean; multiline?: boolean; disabled?: boolean
}) {
  return <View style={{ gap: 6 }}>
    <Text style={styles.body}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
      editable={!disabled} keyboardType={numeric ? 'decimal-pad' : 'default'}
      multiline={multiline} style={styles.input} autoCorrect={false} />
  </View>
}
