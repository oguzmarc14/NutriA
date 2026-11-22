import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { numberInput } from '../clinicalModels'
import { EquivalentPanel } from './EquivalentPanel'
import { InlineFoodSearch } from './InlineFoodSearch'
import { CustomFoodForm } from './CustomFoodForm'
import { draftKey, fromCatalog, planTotals, type DraftFood, type DraftMeal } from './models'

export function MealEditor({ patient, meal, busy, onChange, onRemove }: {
  patient: string; meal: DraftMeal; busy: boolean; onChange: (meal: DraftMeal) => void; onRemove: () => void
}) {
  const [custom, setCustom] = useState(false)
  const [active, setActive] = useState(meal.preparaciones?.[0]?.id || '')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [expandedFood, setExpandedFood] = useState<string | null>(null)
  const fallback = { id: 'legacy-' + meal.key, nombre: meal.platillo || '', tipo: 'platillo' as const }
  const preparations = meal.preparaciones?.length ? meal.preparaciones : [fallback]
  const current = preparations.find(p => p.id === active) || preparations[0]
  const foods = meal.alimentos.filter(f => f.preparacionId === current.id || !f.preparacionId && current.id === preparations[0].id)
  const totals = planTotals([meal])

  function add(food: DraftFood) {
    const existing = food.tipo === 'catalogo' ? foods.find(f => f.tipo === 'catalogo' && f.alimento === food.alimento) : undefined
    const normalized = meal.alimentos.map(f => ({ ...f, preparacionId: f.preparacionId || preparations[0].id }))
    onChange({ ...meal, preparaciones: preparations, alimentos: existing
      ? normalized.map(f => f.key === existing.key ? { ...f, quantity: String((numberInput(f.quantity) || 0) + 1) } : f)
      : [...normalized, { ...food, preparacionId: current.id }],
    })
  }
  function addPreparation(tipo: 'platillo' | 'bebida') {
    const next = { id: draftKey(), tipo, nombre: '' }
    onChange({ ...meal, preparaciones: [...preparations, next],
      alimentos: meal.alimentos.map(f => ({ ...f, preparacionId: f.preparacionId || preparations[0].id })) })
    setActive(next.id)
    setCustom(false)
    setExpandedFood(null)
  }
  function adjustPortion(food: DraftFood, delta: number) {
    const amount = numberInput(food.quantity)
    const currentAmount = Number.isFinite(amount) && amount >= 0.1 ? amount : 1
    const quantity = String(Math.max(0.1, Math.round((currentAmount + delta) * 10) / 10))
    onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, quantity } : f) })
  }
  function removePreparation() {
    Alert.alert('Eliminar preparación', 'Se quitarán esta preparación y sus alimentos del borrador.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        onChange({ ...meal, preparaciones: preparations.filter(p => p.id !== current.id),
          alimentos: meal.alimentos.filter(f => !foods.some(item => item.key === f.key)) })
        setActive('')
        setExpandedFood(null)
      } },
    ])
  }
  function removeMeal() {
    Alert.alert('Eliminar comida', meal._id
      ? 'Al guardar se quitará la comida y sus registros de seguimiento.'
      : 'Se quitará esta comida y todos sus alimentos del borrador.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onRemove },
    ])
  }

  return <View style={[styles.card, { gap: 12 }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" style={styles.cardTitle}>{meal.nombre || 'Tiempo de comida'}</Text>
        {!!meal.hora && <Text style={{ color: colors.muted, fontSize: 13 }}>{meal.hora}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar comida ${meal.nombre}`} disabled={busy}
        onPress={removeMeal} style={({ pressed }) => ({
          width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
          backgroundColor: '#fff2ef', opacity: busy ? 0.5 : pressed ? 0.7 : 1,
        })}>
        <Ionicons name="trash-outline" size={21} color="#a02e27" />
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: optionsOpen }}
      disabled={busy} onPress={() => setOptionsOpen(!optionsOpen)}
      style={{ minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Ionicons name={optionsOpen ? 'chevron-up' : 'options-outline'} size={19} color={colors.green} />
      <Text style={{ color: colors.green, fontWeight: '700' }}>{optionsOpen ? 'Ocultar opciones de comida' : 'Hora, distribución y opciones'}</Text>
    </Pressable>
    {optionsOpen && <View style={{ gap: 10, padding: 10, backgroundColor: '#f4f9f5', borderRadius: 12 }}>
      <FormField label="Nombre de la comida" value={meal.nombre} onChange={nombre => onChange({ ...meal, nombre })} disabled={busy} />
      <TimeField label="Hora · opcional" value={meal.hora || ''} onChange={hora => onChange({ ...meal, hora })} disabled={busy} />
      <FormField label="Distribución de energía (%) · opcional" numeric value={meal.percentage}
        onChange={percentage => onChange({ ...meal, percentage })} disabled={busy} />
      <FormField label="Indicaciones · opcional" multiline value={meal.descripcion || ''}
        onChange={descripcion => onChange({ ...meal, descripcion })} disabled={busy} />
    </View>}
    <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 13 }}>Platillos y bebidas</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ alignItems: 'center', gap: 8, paddingVertical: 4 }}>
      {preparations.map((p, i) => {
        const selected = p.id === current.id
        return <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected }}
          accessibilityLabel={p.nombre || `${p.tipo} ${i + 1}`} disabled={busy}
          onPress={() => { setActive(p.id); setCustom(false); setExpandedFood(null) }}
          style={({ pressed }) => ({
            flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, minHeight: 44, borderRadius: 22,
            backgroundColor: selected ? colors.green : '#f1f7f3',
            borderWidth: 1, borderColor: selected ? colors.green : colors.border,
            opacity: busy ? 0.5 : pressed ? 0.7 : 1,
          })}>
          <Ionicons name={p.tipo === 'bebida' ? 'cafe-outline' : 'restaurant-outline'} size={17} color={selected ? colors.white : colors.green} />
          <Text numberOfLines={1} style={{ fontWeight: '700', color: selected ? colors.white : colors.green, maxWidth: 130 }}>
            {p.nombre || `${p.tipo === 'bebida' ? 'Bebida' : 'Platillo'} ${i + 1}`}
          </Text>
        </Pressable>
      })}
      {(['platillo', 'bebida'] as const).map(tipo =>
        <Pressable key={tipo} accessibilityRole="button" accessibilityLabel={`Agregar ${tipo}`}
          disabled={busy} onPress={() => addPreparation(tipo)} style={{
            flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44,
            paddingHorizontal: 10, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.green,
          }}>
          <Ionicons name="add" size={18} color={colors.green} />
          <Text style={{ color: colors.green, fontWeight: '700', fontSize: 13 }}>{tipo === 'platillo' ? 'Platillo' : 'Bebida'}</Text>
        </Pressable>)}
    </ScrollView>
    <View style={{ gap: 7 }}>
      <FormField label={current.tipo === 'bebida' ? 'Nombre de la bebida' : 'Nombre del platillo'}
        value={current.nombre} disabled={busy}
        onChange={nombre => onChange({ ...meal, preparaciones: preparations.map(p => p.id === current.id ? { ...p, nombre } : p) })} />
      {preparations.length > 1 && <Pressable accessibilityRole="button" accessibilityLabel="Eliminar preparación"
        disabled={busy} onPress={removePreparation}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 }}>
        <Ionicons name="trash-outline" size={17} color="#a02e27" />
        <Text style={{ color: '#a02e27', fontWeight: '700' }}>Eliminar preparación</Text>
      </Pressable>}
    </View>
    <InlineFoodSearch key={current.id} disabled={busy} onChoose={food => add(fromCatalog(food))} />
    <EquivalentPanel patient={patient} disabled={busy} onChoose={food => add(fromCatalog(food))} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: custom }} disabled={busy}
      onPress={() => setCustom(value => !value)}
      style={{ minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <Ionicons name={custom ? 'remove-circle-outline' : 'add-circle-outline'} size={19} color={colors.green} />
      <Text style={{ color: colors.green, fontWeight: '700' }}>{custom ? 'Ocultar alimento personalizado' : 'Agregar alimento personalizado'}</Text>
    </Pressable>
    {custom && !busy && <CustomFoodForm onCancel={() => setCustom(false)} onAdd={food => { add(food); setCustom(false) }} />}
    <Text style={[styles.cardTitle, { fontSize: 16 }]}>Alimentos de esta preparación ({foods.length})</Text>
    {!foods.length && <Text style={styles.body}>Busca y agrega alimentos al platillo o bebida seleccionado.</Text>}
    {foods.map(food => {
      const quantity = numberInput(food.quantity)
      const subtotal = Number.isFinite(quantity) && quantity >= 0.1 ? quantity * (food.nutrimentos.kcal || 0) : 0
      const expanded = expandedFood === food.key
      const buttonStyle = (disabled = false) => ({
        height: 44, width: 44, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const,
        backgroundColor: '#eef6f0', opacity: disabled ? 0.45 : 1,
      })
      return <View key={food.key} style={{
        gap: 7, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fbfdfa',
      }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }} numberOfLines={2}>{food.nombre}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>
              {food.porcion?.descripcion || `${food.porcion?.cantidad ?? 1} ${food.porcion?.unidad || 'porción'}`} · {subtotal.toFixed(0)} kcal
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${food.nombre}`} disabled={busy}
            onPress={() => onChange({ ...meal, alimentos: meal.alimentos.filter(f => f.key !== food.key) })}
            style={({ pressed }) => [buttonStyle(busy), { backgroundColor: '#fff2ef', opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}>
            <Ionicons name="trash-outline" size={19} color="#a02e27" />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ fontSize: 13, color: colors.muted, flexShrink: 1 }}>Porciones</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Reducir porciones de ${food.nombre}`}
              disabled={busy || quantity <= 0.1} onPress={() => adjustPortion(food, -1)}
              style={buttonStyle(busy || quantity <= 0.1)}>
              <Ionicons name="remove" size={22} color={colors.green} />
            </Pressable>
            <Text style={{ minWidth: 38, textAlign: 'center', color: colors.ink, fontWeight: '800', fontSize: 16 }}>
              {food.quantity}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar porciones de ${food.nombre}`}
              disabled={busy} onPress={() => adjustPortion(food, 1)} style={buttonStyle(busy)}>
              <Ionicons name="add" size={22} color={colors.green} />
            </Pressable>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setExpandedFood(expanded ? null : food.key)} disabled={busy}
          style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 6 }}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={colors.green} />
          <Text style={{ color: colors.green, fontWeight: '700', fontSize: 13 }}>
            {expanded ? 'Ocultar notas y cantidad exacta' : 'Notas y cantidad exacta'}
          </Text>
        </Pressable>
        {expanded && <View style={{ gap: 8, paddingTop: 4 }}>
          <FormField numeric label={`Porciones exactas de ${food.nombre}`} disabled={busy} value={food.quantity}
            onChange={next => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, quantity: next } : f) })} />
          <FormField label={`Notas de ${food.nombre} · opcional`} value={food.notas || ''} disabled={busy}
            onChange={notas => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, notas } : f) })} />
        </View>}
      </View>
    })}
    <Text style={{ color: colors.muted, fontSize: 14 }}>
      {totals.kcal.toFixed(1)} kcal · Proteínas {totals.proteina.toFixed(1)} g · Carbohidratos {totals.carbohidratos.toFixed(1)} g · Grasas {totals.grasas.toFixed(1)} g
    </Text>
  </View>
}
