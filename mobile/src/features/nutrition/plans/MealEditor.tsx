import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { AppDialog } from '@/shared/ui/AppDialog'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { numberInput } from '../clinicalModels'
import { EquivalentPanel } from './EquivalentPanel'
import { InlineFoodSearch } from './InlineFoodSearch'
import { CustomFoodForm } from './CustomFoodForm'
import { FoodRow } from './FoodRow'
import { mealIcon } from './MealNavigator'
import { mealPreparations, normalizedFoods, preparationFoods } from './preparations'
import { dietColors as c, dietStyles as s, DietAction, DietDisclosure, DietField, DietIconButton } from './dietUI'
import { draftKey, fromCatalog, parseQuantity, planTotals, type DraftFood, type DraftMeal } from './models'
export function MealEditor({ patient, meal, index, target, busy, onChange, onRemove }: {
  patient: string; meal: DraftMeal; index: number; target: number; busy: boolean; onChange: (meal: DraftMeal) => void; onRemove: () => void
}) {
  const prepScroll = useRef<ScrollView>(null), scrollToNew = useRef(false)
  const [prepWidth, setPrepWidth] = useState(220)
  const [custom, setCustom] = useState(false), [advanced, setAdvanced] = useState(false), [notes, setNotes] = useState(!!meal.descripcion)
  const [active, setActive] = useState(meal.preparaciones?.[0]?.id || ''), [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const preparations = mealPreparations(meal), current = preparations.find(p => p.id === active) || preparations[0]
  const foods = preparationFoods(meal, current.id), totals = planTotals([meal])
  const percent = numberInput(meal.percentage), goal = Number.isFinite(percent) && Number.isFinite(target) && target > 0 ? target * percent / 100 : 0
  function add(food: DraftFood) {
    const existing = food.tipo === 'catalogo' ? foods.find(f => f.tipo === 'catalogo' && (typeof f.alimento === 'string' ? f.alimento : f.alimento?._id) === food.alimento) : undefined
    const normalized = normalizedFoods(meal)
    onChange({ ...meal, preparaciones: preparations, alimentos: existing ? normalized.map(f => f.key === existing.key ? { ...f, quantity: String((parseQuantity(f.quantity) || 0) + 1) } : f) : [...normalized, { ...food, preparacionId: current.id }] })
  }
  function addPreparation(tipo: 'platillo' | 'bebida') {
    const next = { id: draftKey(), tipo, nombre: '' }
    scrollToNew.current = true
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
      <View style={s.inset}><View style={{ gap: 3 }}><Text style={s.title}>Platillos y bebidas</Text><Text style={s.caption}>Selecciona dónde agregar los ingredientes del catálogo.</Text></View>
        <View style={s.wrap}><DietAction disabled={busy} label="+ Platillo" icon="restaurant-outline" onPress={() => addPreparation('platillo')} />
          <DietAction disabled={busy} label="+ Bebida" icon="cafe-outline" onPress={() => addPreparation('bebida')} /></View>
        {preparations.length > 1 && <Text style={s.caption}>Desliza para cambiar de preparación.</Text>}
        <ScrollView horizontal ref={prepScroll} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          onLayout={event => setPrepWidth(Math.max(160, event.nativeEvent.layout.width))}
          onContentSizeChange={() => { if (scrollToNew.current) { prepScroll.current?.scrollToEnd({ animated: true }); scrollToNew.current = false } }}
          contentContainerStyle={{ gap: 10 }}>
        {preparations.map((p, i) => { const selected = p.id === current.id, items = preparationFoods(meal, p.id), kcal = planTotals([{ ...meal, alimentos: items }]).kcal
          return <View key={p.id} style={{ width: prepWidth, padding: 11, gap: 7, borderRadius: 14, borderWidth: 1, borderColor: selected ? c.green : c.border, backgroundColor: selected ? c.selected : '#ffffff' }}>
            <View style={s.row}><Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: busy }} disabled={busy}
              accessibilityLabel={`Seleccionar ${p.nombre || p.tipo + ' ' + (i + 1)}`} onPress={() => { setActive(p.id); setCustom(false) }} style={{ flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Ionicons name={p.tipo === 'bebida' ? 'cafe-outline' : 'restaurant-outline'} size={17} color={c.green} />
              <Text style={[s.label, { flexShrink: 1 }]}>{selected ? `${p.tipo === 'bebida' ? 'Bebida' : 'Platillo'} ${i + 1}` : p.nombre || `${p.tipo === 'bebida' ? 'Bebida' : 'Platillo'} ${i + 1}`}</Text>
              {selected && <Ionicons name="checkmark-circle-outline" size={17} color={c.green} />}
            </Pressable>{preparations.length > 1 && <DietIconButton icon="trash-outline" label={'Eliminar preparación ' + (p.nombre || i + 1)} disabled={busy} danger onPress={() => setRemoveTarget(p.id)} />}</View>
            {selected && <TextInput accessibilityLabel={p.tipo === 'bebida' ? 'Nombre de la bebida' : 'Nombre del platillo'} placeholder={p.tipo === 'bebida' ? 'Ej. Café con leche' : 'Ej. Huevos con verduras'}
              value={p.nombre} editable={!busy} onChangeText={nombre => onChange({ ...meal, preparaciones: preparations.map(item => item.id === p.id ? { ...item, nombre } : item) })}
              style={[s.input, { borderColor: c.green, minHeight: 44, fontSize: 14 }]} placeholderTextColor={c.muted} />}
            <Text style={s.caption}>{items.length} {items.length === 1 ? 'alimento' : 'alimentos'} · {kcal.toFixed(0)} kcal</Text>
          </View>
        })}
        </ScrollView>
      </View>
      <InlineFoodSearch key={current.id} disabled={busy} addedIds={foods.flatMap(f => typeof f.alimento === 'string' ? [f.alimento] : f.alimento?._id ? [f.alimento._id] : [])} onChoose={food => add(fromCatalog(food))} />
      <DietDisclosure label="¿No lo encuentras? Agregar alimento personalizado" open={custom} disabled={busy} onPress={() => setCustom(!custom)}>
        <View style={s.inset}><CustomFoodForm onCancel={() => setCustom(false)} onAdd={food => { add(food); setCustom(false) }} /></View>
      </DietDisclosure>
      <View style={{ gap: 3 }}>
        <Text style={s.title}>Ingredientes de {current.nombre || (current.tipo === 'bebida' ? 'esta bebida' : 'este platillo')}</Text>
        <Text style={s.caption}>Solo se muestran los {foods.length} ingredientes de la preparación seleccionada. Los demás se conservan por separado.</Text>
      </View>
      {(() => { const p = current, items = foods, subtotal = planTotals([{ ...meal, alimentos: items }]).kcal
        return <View key={p.id} style={{ padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 18, gap: 9 }}>
          <View style={s.row}><Ionicons name={p.tipo === 'bebida' ? 'cafe-outline' : 'restaurant-outline'} size={17} color={c.green} /><Text style={[s.label, { flex: 1 }]}>{p.nombre || (p.tipo === 'bebida' ? 'Bebida sin nombre' : 'Platillo sin nombre')}</Text>
            <Text style={{ color: c.green, fontSize: 12, fontWeight: '700' }}>{subtotal.toFixed(0)} kcal</Text></View>
          {!items.length ? <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar esta preparación para añadir alimentos" disabled={busy} onPress={() => setActive(p.id)} style={{ backgroundColor: c.soft, padding: 12, borderRadius: 12 }}>
            <Text style={s.caption}>Sin ingredientes. Selecciona esta preparación arriba para agregar alimentos.</Text></Pressable> :
            items.map(food => <FoodRow key={food.key} food={food} disabled={busy}
              onChange={next => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === next.key ? next : f) })}
              onRemove={() => onChange({ ...meal, alimentos: meal.alimentos.filter(f => f.key !== food.key) })} />)}
        </View>
      })()}
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
        const removed = preparationFoods(meal, target || '')
        onChange({ ...meal, preparaciones: preparations.filter(p => p.id !== target), alimentos: meal.alimentos.filter(f => !removed.some(item => item.key === f.key)) }); setActive('')
      }} /></View>
    </AppDialog>
  </View>
}
