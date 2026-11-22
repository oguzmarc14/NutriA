import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { numberInput } from '../clinicalModels'
import { dietColors as c, dietStyles as s, DietField, DietIconButton } from './dietUI'
import { stepPortion } from './preparations'
import type { DraftFood } from './models'
export function FoodRow({ food, disabled, onChange, onRemove }: { food: DraftFood; disabled: boolean; onChange: (food: DraftFood) => void; onRemove: () => void }) {
  const [notesOpen, setNotesOpen] = useState(!!food.notas)
  const quantity = numberInput(food.quantity), valid = Number.isFinite(quantity) && quantity >= 0.1
  return <View style={{ gap: 9, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e3ece6' }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{food.nombre}</Text>
        <Text style={s.caption}>{food.porcion?.descripcion || `${food.porcion?.cantidad ?? 1} ${food.porcion?.unidad || 'porción'}`} por porción</Text>
        <Text style={{ color: c.green, fontSize: 12, fontWeight: '600' }}>{valid ? (food.nutrimentos.kcal * quantity).toFixed(0) : '—'} kcal</Text></View>
      <DietIconButton icon="trash-outline" danger label={'Quitar ' + food.nombre} disabled={disabled} onPress={onRemove} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: valid ? c.border : c.danger, borderRadius: 13, overflow: 'hidden', backgroundColor: '#ffffff' }}>
        <DietIconButton icon="remove" label={'Reducir porción de ' + food.nombre} disabled={disabled || valid && quantity <= 0.1} onPress={() => onChange({ ...food, quantity: stepPortion(food.quantity, -1) })} />
        <TextInput accessibilityLabel={'Porciones de ' + food.nombre} keyboardType="decimal-pad" editable={!disabled} value={food.quantity}
          onChangeText={quantity => onChange({ ...food, quantity })} style={{ width: 54, minHeight: 44, textAlign: 'center', color: c.ink, fontSize: 15, fontWeight: '600', paddingHorizontal: 2 }} />
        <DietIconButton icon="add" label={'Aumentar porción de ' + food.nombre} disabled={disabled} onPress={() => onChange({ ...food, quantity: stepPortion(food.quantity, 1) })} />
      </View>
      <Text style={s.caption}>porciones</Text>
    </View>
    {!valid && <Text accessibilityRole="alert" style={{ fontSize: 12, color: c.danger }}>Indica al menos 0.1 porciones.</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: notesOpen, disabled }} disabled={disabled} onPress={() => setNotesOpen(!notesOpen)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}><Ionicons name="create-outline" size={15} color={c.muted} />
      <Text style={s.caption}>{notesOpen ? 'Ocultar nota' : food.notas ? 'Ver nota' : 'Añadir nota'}</Text></Pressable>
    {notesOpen && <DietField label={'Nota de ' + food.nombre} placeholder="Ej. Calentar antes de servir" value={food.notas || ''} disabled={disabled} onChange={notas => onChange({ ...food, notas })} />}
  </View>
}
