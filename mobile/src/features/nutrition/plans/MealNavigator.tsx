import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { dietColors as c, dietStyles as s, DietAction, DietIconButton } from './dietUI'
import { planTotals, type DraftMeal } from './models'
export function mealIcon(name: string): keyof typeof Ionicons.glyphMap {
  const value = name.toLocaleLowerCase()
  return value.includes('desayuno') ? 'sunny-outline' : value.includes('cena') ? 'moon-outline' : value.includes('colación') ? 'nutrition-outline' : 'restaurant-outline'
}
export function MealNavigator({ meals, active, disabled, onSelect, onMove, onAdd }: {
  meals: DraftMeal[]; active: string; disabled: boolean; onSelect: (key: string) => void; onMove: (key: string, direction: -1 | 1) => void; onAdd: () => void
}) {
  return <View style={{ gap: 10 }}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={s.title}>Comidas</Text>
      <DietAction label="Agregar" icon="add" disabled={disabled} onPress={onAdd} /></View>
    <Text style={s.caption}>Crea desayuno, colación, comida, cena o los tiempos que necesites.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">
      {meals.map((meal, index) => { const totals = planTotals([meal]), selected = meal.key === active
        return <View key={meal.key} style={{ width: 176, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: selected ? c.green : c.border, backgroundColor: selected ? c.selected : '#ffffff' }}>
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
        </View>
      })}
    </ScrollView>
  </View>
}
