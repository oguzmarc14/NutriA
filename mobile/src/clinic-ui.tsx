import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, styles } from './ui'

export function Shortcut({ title, detail, icon, primary, onPress }: {
  title: string
  detail?: string
  icon: keyof typeof Ionicons.glyphMap
  primary?: boolean
  onPress: () => void
}) {
  const foreground = primary ? colors.white : colors.ink
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={detail}
      onPress={onPress} style={({ pressed }) => [
        shortcut.card, primary && shortcut.primary, pressed && styles.pressed,
      ]}>
      <View style={[shortcut.icon, primary && shortcut.primaryIcon]}>
        <Ionicons name={icon} size={23} color={primary ? colors.white : colors.green} />
      </View>
      <View style={shortcut.copy}>
        <Text style={[styles.cardTitle, { color: foreground }]}>{title}</Text>
        {!!detail && <Text style={[styles.body, primary && shortcut.primaryDetail]}>{detail}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={foreground} />
    </Pressable>
  )
}

const shortcut = StyleSheet.create({
  card: {
    minHeight: 66, borderRadius: 16, padding: 13, flexDirection: 'row',
    alignItems: 'center', gap: 12, backgroundColor: colors.white,
  },
  primary: { backgroundColor: colors.green },
  icon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.background,
  },
  primaryIcon: { backgroundColor: '#2c765a' },
  primaryDetail: { color: '#e5f3eb' },
  copy: { flex: 1, gap: 3 },
})
