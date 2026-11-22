import Ionicons from '@expo/vector-icons/Ionicons'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
export const dietColors = { ink: '#173f34', green: '#246b55', muted: '#527166', border: '#cbded2', soft: '#f3f9f5', selected: '#e5f2e9', danger: '#b74747' }
export const dietStyles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: dietColors.border, borderRadius: 24, overflow: 'hidden', elevation: 2, shadowColor: '#173f34', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  body: { padding: 16, gap: 20 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f7fbf8', borderBottomWidth: 1, borderColor: '#e0ece4' },
  title: { color: dietColors.ink, fontSize: 16, fontWeight: '800' },
  label: { color: dietColors.ink, fontSize: 13, fontWeight: '700' },
  caption: { color: dietColors.muted, fontSize: 12, lineHeight: 18 },
  eyebrow: { color: dietColors.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: dietColors.border, borderRadius: 13, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: dietColors.ink },
  inset: { backgroundColor: dietColors.soft, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: dietColors.border, gap: 12 },
  iconTile: { width: 42, height: 42, backgroundColor: '#e0f0e6', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
})
export function DietIconButton({ icon, label, onPress, disabled, danger, outlined }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean; danger?: boolean; outlined?: boolean
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [dietStyles.iconButton, outlined && { borderWidth: 1, borderColor: dietColors.border, backgroundColor: '#ffffff' }, { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 }]}>
    <Ionicons name={icon} size={19} color={danger ? dietColors.danger : dietColors.green} />
  </Pressable>
}
export function DietAction({ label, icon, onPress, disabled }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ minHeight: 44, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#b7d6c2', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
    {icon && <Ionicons name={icon} size={17} color={dietColors.green} />}<Text style={{ color: dietColors.green, fontSize: 13, fontWeight: '600' }}>{label}</Text>
  </Pressable>
}
export function DietField({ label, value, onChange, disabled, placeholder, multiline }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string; multiline?: boolean
}) {
  return <View style={{ gap: 7 }}><Text style={dietStyles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
    editable={!disabled} placeholder={placeholder} placeholderTextColor={dietColors.muted} style={dietStyles.input} multiline={multiline} /></View>
}
export function DietDisclosure({ label, open, onPress, children, disabled }: { label: string; open: boolean; onPress: () => void; children: ReactNode; disabled?: boolean }) {
  return <View style={{ gap: open ? 12 : 0 }}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={onPress}
    style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}>
    <Text style={{ flex: 1, color: dietColors.green, fontSize: 13, fontWeight: '600' }}>{label}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={dietColors.green} />
  </Pressable>{open && children}</View>
}
