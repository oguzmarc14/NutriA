import { useRef, useState } from 'react'
import { PanResponder, View } from 'react-native'
import { colors } from './primitives'
export function RangeBar({ label, value, min = 0, max, step = 1, disabled, onChange }: {
  label: string; value: number; min?: number; max: number; step?: number; disabled?: boolean; onChange: (value: number) => void
}) {
  const [width, setWidth] = useState(1)
  const latest = useRef({ value, min, max, step, disabled, onChange, width })
  latest.current = { value, min, max, step, disabled, onChange, width }
  const start = useRef(0)
  function update(x: number) {
    const p = latest.current
    if (p.disabled || p.max <= p.min) return
    const raw = p.min + Math.max(0, Math.min(1, x / p.width)) * (p.max - p.min)
    p.onChange(Math.max(p.min, Math.min(p.max, Math.round(raw / p.step) * p.step)))
  }
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onMoveShouldSetPanResponder: () => !latest.current.disabled,
    onPanResponderGrant: e => { start.current = e.nativeEvent.locationX; update(start.current) },
    onPanResponderMove: (_, gesture) => update(start.current + gesture.dx),
    onPanResponderTerminationRequest: () => false,
  })).current
  const percent = Number.isFinite(value) && max > min ? Math.max(0, Math.min(100, (value - min) / (max - min) * 100)) : 0
  const current = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min
  return <View accessible accessibilityRole="adjustable" accessibilityLabel={label}
    accessibilityState={{ disabled }} accessibilityValue={{ min, max, now: current }}
    aria-valuemin={min} aria-valuemax={max} aria-valuenow={current}
    accessibilityActions={[{ name: 'increment', label: 'Aumentar' }, { name: 'decrement', label: 'Disminuir' }]}
    onAccessibilityAction={e => { if (!disabled) onChange(Math.max(min, Math.min(max, (Number.isFinite(value) ? value : min) + (e.nativeEvent.actionName === 'increment' ? step : -step)))) }}
    onLayout={e => setWidth(Math.max(1, e.nativeEvent.layout.width))}
    style={{ height: 44, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }} {...responder.panHandlers}>
    <View pointerEvents="none" style={{ height: 6, backgroundColor: '#dce9e1', borderRadius: 4 }}>
      <View style={{ width: `${percent}%`, height: 6, backgroundColor: colors.green, borderRadius: 4 }} />
      <View style={{ position: 'absolute', left: `${percent}%`, marginLeft: -10, top: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green, borderWidth: 2, borderColor: 'white' }} />
    </View>
  </View>
}
