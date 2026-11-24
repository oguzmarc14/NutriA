import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, type AlertButton, type AlertOptions } from 'react-native'

type Notice = { title: string; message?: string; buttons?: AlertButton[]; options?: AlertOptions }
let present: ((notice: Notice) => void) | undefined

export function showNotice(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
  if (present) present({ title, message, buttons, options })
  else Alert.alert(title, message, buttons, options)
}

export function NoticeDialog() {
  const [notice, setNotice] = useState<Notice>()
  useEffect(() => {
    present = setNotice
    return () => { present = undefined }
  }, [])
  if (!notice) return null

  function dismiss() {
    if (!notice?.options?.cancelable) return
    setNotice(undefined)
    notice.options.onDismiss?.()
  }

  const buttons = notice.buttons?.length ? notice.buttons : [{ text: 'Aceptar' }] satisfies AlertButton[]
  const destructive = buttons.some(button => button.style === 'destructive')
  return <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
    <View style={s.overlay}>
      <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={dismiss} />
      <View style={s.card} accessibilityViewIsModal>
        <View style={[s.icon, destructive && { backgroundColor: '#fff0df' }]}>
          <Ionicons name={destructive ? 'alert-circle-outline' : 'information-circle-outline'} size={25}
            color={destructive ? '#865321' : '#17654b'} />
        </View>
        <Text accessibilityRole="header" style={s.title}>{notice.title}</Text>
        {!!notice.message && <ScrollView style={{ flexGrow: 0, maxHeight: 235 }}><Text style={s.body}>{notice.message}</Text></ScrollView>}
        <View style={s.actions}>
          {buttons.map((button, index) => {
            const primary = button.style !== 'cancel' && index === buttons.length - 1
            return <Pressable key={index} accessibilityRole="button"
              style={({ pressed }) => [s.button, primary && (button.style === 'destructive' ? s.destructive : s.primary), pressed && { opacity: .78 }]}
              onPress={() => { setNotice(undefined); button.onPress?.() }}>
              <Text style={[s.label, primary && s.primaryLabel]}>{button.text || 'Aceptar'}</Text>
            </Pressable>
          })}
        </View>
      </View>
    </View>
  </Modal>
}

const s = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e2b24a6', padding: 22 },
  card: { width: '100%', maxWidth: 440, maxHeight: '94%', padding: 22, gap: 11, borderRadius: 24, backgroundColor: '#fbfdfb', elevation: 12 },
  icon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#e1f1e7' },
  title: { fontSize: 21, fontWeight: '800', color: '#173f34' },
  body: { color: '#426255', fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  button: { flexGrow: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#e9f2ec' },
  primary: { backgroundColor: '#17654b' },
  destructive: { backgroundColor: '#a13d35' },
  label: { fontSize: 14, fontWeight: '700', color: '#234c3c', textAlign: 'center' },
  primaryLabel: { color: '#fff' },
})
