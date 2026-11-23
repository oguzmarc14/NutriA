import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState, type ReactNode } from 'react'
import { Alert, Animated, Pressable, ScrollView, Text, View, type GestureResponderEvent } from 'react-native'
import { dietColors as c, dietStyles as s, DietAction, DietIconButton } from './dietUI'
import { planTotals, type DraftMeal } from './models'
export function mealIcon(name: string): keyof typeof Ionicons.glyphMap {
  const value = name.toLocaleLowerCase()
  return value.includes('desayuno') ? 'sunny-outline' : value.includes('cena') ? 'moon-outline' : value.includes('colación') ? 'nutrition-outline' : 'restaurant-outline'
}
const cardWidth = 176
const cardGap = 10

function DraggableMeal({ children, disabled, selected, label, remove, canMoveBack, canMoveForward, onSelect, onDrop, onDragging }: {
  children: ReactNode; disabled: boolean; selected: boolean; label: string; remove: ReactNode;
  canMoveBack: boolean; canMoveForward: boolean; onSelect: () => void;
  onDrop: (slots: number) => void; onDragging: (dragging: boolean) => void
}) {
  const x = useRef(new Animated.Value(0)).current
  const drag = useRef<{ start: number; delta: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const movable = canMoveBack || canMoveForward
  function start(event: GestureResponderEvent) {
    drag.current = { start: event.nativeEvent.pageX, delta: 0 }
    setDragging(true)
    onDragging(true)
  }
  function move(event: GestureResponderEvent) {
    if (!drag.current) return
    drag.current.delta = event.nativeEvent.pageX - drag.current.start
    x.setValue(drag.current.delta)
  }
  function finish(commit: boolean) {
    if (!drag.current) return
    const slots = Math.sign(drag.current.delta) * Math.round(Math.abs(drag.current.delta) / (cardWidth + cardGap))
    drag.current = null
    x.setValue(0)
    setDragging(false)
    onDragging(false)
    if (commit && slots) onDrop(slots)
  }
  return <Animated.View style={{ width: cardWidth, zIndex: dragging ? 10 : 0, elevation: dragging ? 8 : 0,
    borderRadius: 18, borderWidth: 1, borderColor: selected || dragging ? c.green : c.border,
    backgroundColor: selected || dragging ? c.selected : '#fff', transform: [{ translateX: x }] }}>
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} accessibilityLabel={label}
      accessibilityHint={movable ? 'Mantén presionado para reordenar' : undefined}
      accessibilityActions={[
        ...(canMoveBack ? [{ name: 'moveBack', label: 'Mover antes' }] : []),
        ...(canMoveForward ? [{ name: 'moveForward', label: 'Mover después' }] : []),
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (disabled) return
        if (nativeEvent.actionName === 'moveBack') onDrop(-1)
        if (nativeEvent.actionName === 'moveForward') onDrop(1)
      }}
      disabled={disabled} onPress={onSelect} onLongPress={movable ? start : undefined} delayLongPress={350}
      onTouchMove={move} onTouchEnd={() => finish(true)} onTouchCancel={() => finish(false)}
      style={{ minHeight: 112, padding: 11, gap: 7 }}>
      {children}
    </Pressable>
    <View style={{ position: 'absolute', top: 2, right: 2 }}>{remove}</View>
  </Animated.View>
}
export function MealNavigator({ meals, active, disabled, onSelect, onAdd, onReorder, onRemove }: {
  meals: DraftMeal[]; active: string; disabled: boolean; onSelect: (key: string) => void; onAdd: () => void; onReorder: (from: number, to: number) => void; onRemove: (key: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const allCalories = planTotals(meals).kcal
  return <View style={{ gap: 10 }}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={s.title}>Comidas</Text>
      <DietAction label="Agregar" icon="add" disabled={disabled} onPress={onAdd} /></View>
    <Text style={s.caption}>Toca una comida para editarla. Mantén presionado y arrastra para moverla.</Text>
    <Text style={[s.caption, { color: c.green, fontWeight: '700' }]}>
      Total del plan: {allCalories.toFixed(1)} kcal · Porcentaje real por comida según sus porciones
    </Text>
    <ScrollView horizontal scrollEnabled={!dragging} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: cardGap, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">
      {meals.map((meal, index) => { const totals = planTotals([meal]), selected = meal.key === active
        return <DraggableMeal key={meal.key} disabled={disabled} selected={selected}
          label={`${meal.nombre || 'Comida'}, ${meal.hora || 'sin hora'}, ${totals.kcal.toFixed(0)} kilocalorías`}
          canMoveBack={index > 0} canMoveForward={index < meals.length - 1}
          onSelect={() => onSelect(meal.key)} onDragging={setDragging}
          onDrop={slots => onReorder(index, Math.max(0, Math.min(meals.length - 1, index + slots)))}
          remove={<DietIconButton icon="trash-outline" label={'Eliminar ' + (meal.nombre || 'comida')} disabled={disabled} danger
            onPress={() => Alert.alert('Eliminar comida',
              meal._id ? 'Al guardar se eliminará esta comida y sus posibles registros de seguimiento.' : '¿Eliminar esta comida del borrador?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => onRemove(meal.key) },
              ])} />}>
            <View style={[s.row, { paddingRight: 36, minHeight: 28 }]}>
              <Ionicons name={mealIcon(meal.nombre)} size={16} color={c.green} />
              <Text numberOfLines={2} style={[s.label, { flex: 1 }]}>{meal.nombre || 'Sin nombre'}</Text>
            </View>
            <Text style={s.caption} numberOfLines={1}>{meal.preparaciones?.find(p => p.nombre)?.nombre || meal.platillo || 'Platillo sin nombre'}</Text>
            <View style={[s.row, { gap: 4 }]}><Ionicons name="time-outline" size={12} color={c.muted} /><Text style={s.caption}>{meal.hora || 'Sin hora'}</Text></View>
            <Text style={{ color: '#87683f', fontSize: 12, fontWeight: '700' }}>
              {totals.kcal.toFixed(0)} kcal · {allCalories > 0 ? (100 * totals.kcal / allCalories).toFixed(1) : '0'}% del plan
            </Text>
            <Text style={s.caption}>{meal.alimentos.length} alimentos</Text>
        </DraggableMeal>
      })}
    </ScrollView>
  </View>
}
