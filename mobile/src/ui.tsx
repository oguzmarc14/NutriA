import Ionicons from '@expo/vector-icons/Ionicons'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const colors = {
  background: '#f3f7f4',
  ink: '#182d24',
  green: '#176344',
  muted: '#466255',
  white: '#ffffff',
  border: '#d3e0d7',
  error: '#992222',
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { padding: 24, gap: 16, flexGrow: 1 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 16 },
  error: { color: colors.error, fontSize: 16 },
  input: {
    padding: 14, minHeight: 48, fontSize: 16, color: colors.ink,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 12,
  },
  card: { backgroundColor: colors.white, padding: 16, gap: 6, borderRadius: 14 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '600' },
  button: { backgroundColor: colors.green, borderRadius: 12, padding: 13, minHeight: 44 },
  secondary: { backgroundColor: colors.white },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  expandedButton: { flexGrow: 1 },
  pressed: { opacity: 0.7 },
  backButton: {
    marginHorizontal: 8, width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
})

export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={title ? ['top', 'bottom', 'left', 'right'] : ['left', 'right']}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Button({ label, onPress, disabled, selected, expand }: {
  label: string
  onPress: () => void
  disabled?: boolean
  selected?: boolean
  expand?: boolean
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, selected === false && styles.secondary,
        expand && styles.expandedButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, selected === false && { color: colors.green }]}>{label}</Text>
    </Pressable>
  )
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver a Inicio"
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-back" size={23} color={colors.green} />
    </Pressable>
  )
}
