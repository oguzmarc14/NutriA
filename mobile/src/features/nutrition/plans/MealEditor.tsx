import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AppDialog } from '@/shared/ui/AppDialog'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { EquivalentPanel } from './EquivalentPanel'
import { InlineFoodSearch } from './InlineFoodSearch'
import { CustomFoodForm } from './CustomFoodForm'
import { FoodRow } from './FoodRow'
import { mealIcon } from './MealNavigator'
import { mealPreparations, normalizedFoods, preparationFoods } from './preparations'
import { dietColors as c, dietStyles as s, DietAction, DietDisclosure, DietField, DietIconButton } from './dietUI'
import { draftKey, fromCatalog, mealPercentage, parseQuantity, planTotals, type DraftFood, type DraftMeal } from './models'
export function MealEditor({ patient, meal, index, target, busy, onChange, onRemove }: {
  patient: string; meal: DraftMeal; index: number; target: number; busy: boolean; onChange: (meal: DraftMeal) => void; onRemove: () => void
}) {
  const [custom, setCustom] = useState(false), [advanced, setAdvanced] = useState(false), [notes, setNotes] = useState(!!meal.descripcion)
  const [active, setActive] = useState(meal.preparaciones?.[0]?.id || ''), [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const preparations = mealPreparations(meal), current = preparations.find(p => p.id === active) || preparations[0]
  const foods = preparationFoods(meal, current.id), totals = planTotals([meal])
  const beverage = current.tipo === 'bebida'
  const subtotal = planTotals([{ ...meal, alimentos: foods }]).kcal
  const percent = mealPercentage(meal.percentage), goal = Number.isFinite(percent) && Number.isFinite(target) && target > 0 ? target * percent / 100 : 0
  function add(food: DraftFood) {
    const existing = food.tipo === 'catalogo' ? foods.find(f => f.tipo === 'catalogo' && (typeof f.alimento === 'string' ? f.alimento : f.alimento?._id) === food.alimento) : undefined
    const normalized = normalizedFoods(meal)
    onChange({ ...meal, preparaciones: preparations, alimentos: existing ? normalized.map(f => f.key === existing.key ? { ...f, quantity: String((parseQuantity(f.quantity) || 0) + 1) } : f) : [...normalized, { ...food, preparacionId: current.id }] })
  }
  function addPreparation(tipo: 'platillo' | 'bebida') {
    const next = { id: draftKey(), tipo, nombre: '' }
    onChange({ ...meal, preparaciones: [...preparations, next], alimentos: normalizedFoods(meal) }); setActive(next.id); setCustom(false)
  }
  return <View style={s.card}>
    <View style={s.header}><View style={s.iconTile}><Ionicons name={mealIcon(meal.nombre)} size={22} color={c.green} /></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={s.eyebrow}>COMIDA {index + 1}</Text><Text style={s.title}>{meal.nombre || 'Nueva comida'}</Text>
        <Text style={s.caption}>{current.nombre || (current.tipo === 'bebida' ? 'Bebida sin nombre' : 'Platillo sin nombre')}</Text></View>
      <DietIconButton icon="trash-outline" label="Eliminar comida" danger disabled={busy} onPress={() => setRemoveTarget('meal')} />
    </View>
    <View style={s.body}>
      <DietField label="Tiempo de comida *" value={meal.nombre} placeholder="Desayuno" onChange={nombre => onChange({ ...meal, nombre })} disabled={busy} />
      <TimeField labelStyle={s.label} label="Hora" value={meal.hora || ''} onChange={hora => onChange({ ...meal, hora })} disabled={busy} />
      <View style={s.inset}>
        <Text accessibilityRole="header" style={s.title}>Platillos y bebidas</Text>
        <View style={s.wrap}>
          {preparations.map((prep, index) => {
            const selected = prep.id === current.id
            const label = prep.nombre.trim() || (prep.tipo === 'bebida' ? 'Bebida ' : 'Platillo ') + (index + 1)
            return <Pressable key={prep.id} accessibilityRole="tab" accessibilityState={{ selected, disabled: busy }}
              disabled={busy} onPress={() => { setActive(prep.id); setCustom(false) }}
              style={{ maxWidth: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: selected ? c.green : c.border,
                backgroundColor: selected ? c.selected : '#fff' }}>
              <Ionicons name={prep.tipo === 'bebida' ? 'cafe-outline' : 'restaurant-outline'} size={17} color={c.green} />
              <Text numberOfLines={1} style={[s.label, { flexShrink: 1 }]}>{label}</Text>
              {selected && <Ionicons name="checkmark" size={16} color={c.green} />}
            </Pressable>
          })}
        </View>
        <View style={s.wrap}>
          <DietAction disabled={busy} label="Agregar platillo" icon="restaurant-outline" onPress={() => addPreparation('platillo')} />
          <DietAction disabled={busy} label="Agregar bebida" icon="cafe-outline" onPress={() => addPreparation('bebida')} />
        </View>
      </View>
      <View key={current.id} style={{ gap: 12 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text accessibilityRole="header" style={s.title}>{beverage ? 'Editar bebida' : 'Editar platillo'}</Text>
          {preparations.length > 1 && <DietIconButton icon="trash-outline" danger disabled={busy}
            label={beverage ? 'Eliminar bebida' : 'Eliminar platillo'} onPress={() => setRemoveTarget(current.id)} />}
        </View>
        <DietField label={beverage ? 'Nombre de la bebida' : 'Nombre del platillo'}
          placeholder={beverage ? 'Ej. Café con leche' : 'Ej. Huevos con verduras'}
          value={current.nombre} disabled={busy} onChange={nombre => onChange({
            ...meal, preparaciones: preparations.map(prep => prep.id === current.id ? { ...prep, nombre } : prep),
          })} />
        <InlineFoodSearch disabled={busy}
          addedIds={foods.flatMap(food => typeof food.alimento === 'string' ? [food.alimento] : food.alimento?._id ? [food.alimento._id] : [])}
          onChoose={food => add(fromCatalog(food))} />
        <DietDisclosure label="Agregar ingrediente personalizado" open={custom} disabled={busy} onPress={() => setCustom(!custom)}>
          <View style={s.inset}><CustomFoodForm onCancel={() => setCustom(false)} onAdd={food => { add(food); setCustom(false) }} /></View>
        </DietDisclosure>
        <View style={[s.wrap, { justifyContent: 'space-between' }]}>
          <Text style={s.title}>Ingredientes</Text>
          <Text style={s.caption}>{foods.length} · {subtotal.toFixed(0)} kcal</Text>
        </View>
        {!foods.length && <Text style={s.caption}>Busca un ingrediente para empezar.</Text>}
        {foods.map(food => <FoodRow key={food.key} food={food} disabled={busy}
          onChange={next => onChange({ ...meal, alimentos: meal.alimentos.map(item => item.key === next.key ? next : item) })}
          onRemove={() => onChange({ ...meal, alimentos: meal.alimentos.filter(item => item.key !== food.key) })} />)}
      </View>
      <View style={s.inset}><View style={[s.wrap, { justifyContent: 'space-between' }]}><Text style={s.label}>Meta de {meal.nombre || 'esta comida'}</Text>
        <Text style={{ color: c.green, fontSize: 12, fontWeight: '600' }}>{Number.isFinite(percent) ? percent + '%' : 'Sin distribución'}{goal > 0 ? ` · ${goal.toFixed(0)} kcal objetivo` : ''}</Text></View>
        <View style={{ height: 7, borderRadius: 4, backgroundColor: '#d9eade', overflow: 'hidden' }}><View style={{ height: 7, width: `${goal > 0 ? Math.min(100, totals.kcal / goal * 100) : 0}%`, backgroundColor: totals.kcal > goal && goal > 0 ? '#b47820' : '#79b593' }} /></View>
        <Text style={s.caption}>{totals.kcal.toFixed(0)} kcal agregadas{goal > 0 ? ` · ${Math.abs(goal - totals.kcal).toFixed(0)} kcal ${totals.kcal > goal ? 'de excedente' : 'pendientes'}` : ''}</Text>
      </View>
      <DietDisclosure label="Indicaciones de esta comida" open={notes} onPress={() => setNotes(!notes)} disabled={busy}>
        <DietField label="Indicaciones · opcional" multiline placeholder="Recomendaciones para el paciente" value={meal.descripcion || ''} onChange={descripcion => onChange({ ...meal, descripcion })} disabled={busy} />
      </DietDisclosure>
      <DietDisclosure label="Opciones avanzadas y equivalentes" open={advanced} onPress={() => setAdvanced(!advanced)} disabled={busy}>
        <View style={s.inset}><FormField numeric label="Distribución de energía (%)" value={meal.percentage} disabled={busy} onChange={percentage => onChange({ ...meal, percentage })} />
          <EquivalentPanel patient={patient} disabled={busy} onChoose={food => add(fromCatalog(food))} /></View>
      </DietDisclosure>
    </View>
    <AppDialog visible={removeTarget !== null} title={removeTarget === 'meal' ? 'Eliminar comida' : 'Eliminar preparación'}
      message={removeTarget === 'meal' && meal._id ? 'Al guardar se quitará esta comida y sus registros de seguimiento. Esta acción no se puede deshacer.' : 'Se quitarán esta preparación y sus alimentos del borrador.'} onClose={() => setRemoveTarget(null)}>
      <View style={styles.row}><Button expand selected={false} label="Cancelar" onPress={() => setRemoveTarget(null)} /><Button expand label="Eliminar" disabled={busy} onPress={() => {
        const target = removeTarget; setRemoveTarget(null)
        if (target === 'meal') { onRemove(); return }
        const remaining = preparations.filter(prep => prep.id !== target)
        onChange({ ...meal, preparaciones: remaining, alimentos: normalizedFoods(meal).filter(food => food.preparacionId !== target) })
        setActive(remaining[0]?.id || ''); setCustom(false)
      }} /></View>
    </AppDialog>
  </View>
}
