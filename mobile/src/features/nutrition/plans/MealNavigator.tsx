import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState, type ReactNode } from 'react'
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native'
import { dietColors as c, dietStyles as s, DietAction, DietIconButton } from './dietUI'
import { planTotals, type DraftMeal } from './models'
export function mealIcon(name: string): keyof typeof Ionicons.glyphMap {
  const value = name.toLocaleLowerCase()
  return value.includes('desayuno') ? 'sunny-outline' : value.includes('cena') ? 'moon-outline' : value.includes('colación') ? 'nutrition-outline' : 'restaurant-outline'
}
function DraggableMeal({ children, disabled, label, onDrop, onDragging }: { children: ReactNode; disabled: boolean; label: string; onDrop: (slots: number) => void; onDragging: (dragging: boolean) => void }) {
  const x = useRef(new Animated.Value(0)).current
  const [dragging, setDragging] = useState(false)
  const latest = useRef({ disabled, onDrop, onDragging })
  latest.current = { disabled, onDrop, onDragging }
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onMoveShouldSetPanResponder: () => !latest.current.disabled,
    onPanResponderGrant: () => { setDragging(true); latest.current.onDragging(true) },
    onPanResponderMove: (_, g) => x.setValue(g.dx),
    onPanResponderRelease: (_, g) => { x.setValue(0); setDragging(false); latest.current.onDragging(false); latest.current.onDrop(Math.round(g.dx / 186)) },
    onPanResponderTerminate: () => { x.setValue(0); setDragging(false); latest.current.onDragging(false) },
    onPanResponderTerminationRequest: () => false,
  })).current
  return <Animated.View style={{ width: 176, zIndex: dragging ? 10 : 0, elevation: dragging ? 9 : 0, transform: [{ translateX: x }, { scale: dragging ? 1.03 : 1 }], opacity: dragging ? 0.9 : 1 }}>
    <View {...responder.panHandlers} accessible accessibilityLabel={'Arrastrar ' + label} accessibilityHint="Mantén el dedo en los puntos y arrastra horizontalmente" style={{ minHeight: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f2eb', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}><Ionicons name="reorder-four" size={23} color={c.green} /></View>
    {children}
  </Animated.View>
}
export function MealNavigator({ meals, active, disabled, onSelect, onMove, onAdd, onReorder }: {
  meals: DraftMeal[]; active: string; disabled: boolean; onSelect: (key: string) => void; onMove: (key: string, direction: -1 | 1) => void; onAdd: () => void; onReorder: (from: number, to: number) => void
}) {
  const [dragging, setDragging] = useState(false)
  return <View style={{ gap: 10 }}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={s.title}>Comidas</Text>
      <DietAction label="Agregar" icon="add" disabled={disabled} onPress={onAdd} /></View>
    <Text style={s.caption}>Arrastra desde los puntos para ordenar. También puedes usar las flechas.</Text>
    <ScrollView horizontal scrollEnabled={!dragging} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">
      {meals.map((meal, index) => { const totals = planTotals([meal]), selected = meal.key === active
        return <DraggableMeal key={meal.key} disabled={disabled} label={meal.nombre} onDragging={setDragging} onDrop={slots => onReorder(index, Math.max(0, Math.min(meals.length - 1, index + slots)))}><View style={{ width: 176, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: selected ? c.green : c.border, backgroundColor: selected ? c.selected : '#ffffff' }}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} accessibilityLabel={`${meal.nombre}, ${meal.hora || 'sin hora'}, ${totals.kcal.toFixed(0)} kilocalorías`} onPress={() => onSelect(meal.key)} style={{ gap: 6, minHeight: 82 }}>
            <View style={s.row}><Ionicons name={mealIcon(meal.nombre)} size={18} color={c.green} /><Text numberOfLines={2} style={[s.label, { flex: 1 }]}>{meal.nombre || 'Sin nombre'}</Text>
              {selected && <Ionicons name="checkmark-circle" size={15} color={c.green} />}</View>
            <Text style={s.caption} numberOfLines={1}>{meal.preparaciones?.find(p => p.nombre)?.nombre || meal.platillo || 'Platillo sin nombre'}</Text>
            <View style={[s.row, { gap: 4 }]}><Ionicons name="time-outline" size={12} color={c.muted} /><Text style={s.caption}>{meal.hora || 'Sin hora'}</Text></View>
            <Text style={{ color: '#87683f', fontSize: 12, fontWeight: '700' }}>{totals.kcal.toFixed(0)} kcal · {meal.alimentos.length} alimentos</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
            <DietIconButton icon="chevron-back" label={'Mover antes ' + meal.nombre} disabled={disabled || index === 0} outlined onPress={() => onMove(meal.key, -1)} />
            <DietIconButton icon="chevron-forward" label={'Mover después ' + meal.nombre} disabled={disabled || index === meals.length - 1} outlined onPress={() => onMove(meal.key, 1)} />
          </View>
        </View></DraggableMeal>
      })}
    </ScrollView>
  </View>
}
