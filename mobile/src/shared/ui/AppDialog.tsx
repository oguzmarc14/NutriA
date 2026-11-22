import { useIsFocused } from '@react-navigation/native'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Animated, Easing, Modal, ScrollView, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button, colors, styles } from './primitives'
export function AppDialog({ visible, title, message, onClose, children, success }: {
  visible: boolean; title: string; message?: string; onClose: () => void; children?: ReactNode; success?: boolean
}) {
  const focused = useIsFocused()
  const turn = useRef(new Animated.Value(0)).current
  useEffect(() => {
    turn.setValue(0)
    if (visible && success) Animated.timing(turn, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    return () => turn.stopAnimation()
  }, [visible, success, turn])
  return <Modal visible={visible && focused} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: '#173f3477', justifyContent: 'center', padding: 20 }}>
      <View accessibilityViewIsModal style={[styles.card, { maxHeight: '90%', width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24 }]}>
        <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignSelf: 'center', padding: 16, borderRadius: 24, backgroundColor: colors.background }}>
            <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['-360deg', '0deg'] }) }] }}><Ionicons name={success ? 'checkmark-circle-outline' : 'leaf-outline'} size={36} color={colors.green} /></Animated.View></View>
          <Text accessibilityRole="header" style={[styles.cardTitle, { textAlign: 'center', fontSize: 23 }]}>{title}</Text>
          {!!message && <Text style={[styles.body, { textAlign: 'center' }]}>{message}</Text>}
          {children || <Button label="Aceptar" onPress={onClose} />}
        </ScrollView>
      </View>
    </View>
  </Modal>
}
