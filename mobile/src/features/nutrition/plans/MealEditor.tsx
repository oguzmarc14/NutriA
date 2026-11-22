import { EquivalentPanel } from './EquivalentPanel'
import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { TimeField } from '@/shared/ui/DateTimeField'
import { numberInput } from '../clinicalModels'
import { InlineFoodSearch } from './InlineFoodSearch'
import { CustomFoodForm } from './CustomFoodForm'
import { draftKey, fromCatalog, planTotals, type DraftFood, type DraftMeal } from './models'
export function MealEditor({ patient, meal, busy, onChange, onRemove }: {
  patient: string; meal: DraftMeal; busy: boolean; onChange: (meal: DraftMeal) => void; onRemove: () => void
}) {
  const [custom, setCustom] = useState(false)
  const [active, setActive] = useState(meal.preparaciones?.[0]?.id || '')
  const fallback = { id: 'legacy-' + meal.key, nombre: meal.platillo || '', tipo: 'platillo' as const }
  const preparations = meal.preparaciones?.length ? meal.preparaciones : [fallback]
  const current = preparations.find(p => p.id === active) || preparations[0]
  const foods = meal.alimentos.filter(f => f.preparacionId === current.id || !f.preparacionId && current.id === preparations[0].id)
  const totals = planTotals([meal])
  function add(food: DraftFood) {
    const existing = food.tipo === 'catalogo' ? foods.find(f => f.tipo === 'catalogo' && f.alimento === food.alimento) : undefined
    const normalized = meal.alimentos.map(f => ({ ...f, preparacionId: f.preparacionId || preparations[0].id }))
    onChange({ ...meal, preparaciones: preparations, alimentos: existing ? normalized.map(f => f.key === existing.key ? { ...f, quantity: String((numberInput(f.quantity) || 0) + 1) } : f) : [...normalized, { ...food, preparacionId: current.id }] })
  }
  function addPreparation(tipo: 'platillo' | 'bebida') {
    const next = { id: draftKey(), tipo, nombre: '' }
    onChange({ ...meal, preparaciones: [...preparations, next], alimentos: meal.alimentos.map(f => ({ ...f, preparacionId: f.preparacionId || preparations[0].id })) }); setActive(next.id)
  }
  return <View style={[styles.card, { gap: 14 }]}>
    <Text accessibilityRole="header" style={styles.cardTitle}>{meal.nombre || 'Tiempo de comida'}</Text>
    <FormField label="Nombre de la comida" value={meal.nombre} onChange={nombre => onChange({ ...meal, nombre })} disabled={busy} />
    <TimeField label="Hora · opcional" value={meal.hora || ''} onChange={hora => onChange({ ...meal, hora })} disabled={busy} />
    <FormField label="Distribución de energía (%) · opcional" numeric value={meal.percentage} onChange={percentage => onChange({ ...meal, percentage })} disabled={busy} />
    <View style={styles.row}><Button expand disabled={busy} selected={false} label="+ Platillo" onPress={() => addPreparation('platillo')} />
      <Button expand disabled={busy} selected={false} label="+ Bebida" onPress={() => addPreparation('bebida')} /></View>
    <View style={styles.row}>{preparations.map((p, i) => <Button key={p.id} disabled={busy} selected={p.id === current.id}
      label={p.nombre || `${p.tipo === 'bebida' ? 'Bebida' : 'Platillo'} ${i + 1}`} onPress={() => { setActive(p.id); setCustom(false) }} />)}</View>
    <FormField label={current.tipo === 'bebida' ? 'Nombre de la bebida' : 'Nombre del platillo'} value={current.nombre} disabled={busy}
      onChange={nombre => onChange({ ...meal, preparaciones: preparations.map(p => p.id === current.id ? { ...p, nombre } : p) })} />
    <EquivalentPanel patient={patient} disabled={busy} onChoose={food => add(fromCatalog(food))} />
    <InlineFoodSearch key={current.id} disabled={busy} onChoose={food => add(fromCatalog(food))} />
    <Button disabled={busy || custom} selected={false} label="Agregar alimento personalizado" onPress={() => setCustom(true)} />
    {custom && !busy && <CustomFoodForm onCancel={() => setCustom(false)} onAdd={food => { add(food); setCustom(false) }} />}
    <Text style={styles.cardTitle}>Alimentos de esta preparación</Text>
    {!foods.length && <Text style={styles.body}>Busca y agrega alimentos al platillo o bebida seleccionado.</Text>}
    {foods.map(food => <View key={food.key} style={{ paddingVertical: 12, gap: 8, borderTopWidth: 1, borderColor: '#d3e0d7' }}>
      <Text style={styles.cardTitle}>{food.nombre}</Text>
      <Text style={styles.body}>Una porción: {food.porcion?.descripcion || `${food.porcion?.cantidad ?? 1} ${food.porcion?.unidad || 'porción'}`} · {food.nutrimentos.kcal} kcal</Text>
      <FormField numeric label={`Porciones de ${food.nombre}`} disabled={busy} value={food.quantity}
        onChange={quantity => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, quantity } : f) })} />
      <View style={styles.row}>{[-1, 1].map(direction => <Button key={direction} expand selected={false} disabled={busy || direction < 0 && numberInput(food.quantity) <= 1}
        label={direction < 0 ? '− 1 porción' : '+ 1 porción'} onPress={() => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, quantity: String(Math.max(0.1, Math.round(((numberInput(f.quantity) || 0) + direction) * 10) / 10)) } : f) })} />)}</View>
      <FormField label={`Notas de ${food.nombre} · opcional`} value={food.notas || ''} disabled={busy}
        onChange={notas => onChange({ ...meal, alimentos: meal.alimentos.map(f => f.key === food.key ? { ...f, notas } : f) })} />
      <Button selected={false} disabled={busy} label={`Quitar ${food.nombre}`} onPress={() => onChange({ ...meal, alimentos: meal.alimentos.filter(f => f.key !== food.key) })} />
    </View>)}
    {preparations.length > 1 && <Button selected={false} disabled={busy} label="Eliminar preparación" onPress={() => Alert.alert('Eliminar preparación', 'Se quitarán esta preparación y sus alimentos del borrador.', [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Aceptar', style: 'destructive', onPress: () => { onChange({ ...meal, preparaciones: preparations.filter(p => p.id !== current.id), alimentos: meal.alimentos.filter(f => !foods.some(item => item.key === f.key)) }); setActive('') } },
    ])} />}
    <FormField label="Indicaciones · opcional" multiline value={meal.descripcion || ''} onChange={descripcion => onChange({ ...meal, descripcion })} disabled={busy} />
    <Text style={styles.body}>{totals.kcal.toFixed(1)} kcal · Proteínas {totals.proteina.toFixed(1)} g · Carbohidratos {totals.carbohidratos.toFixed(1)} g · Grasas {totals.grasas.toFixed(1)} g</Text>
    <Button disabled={busy} selected={false} label="Eliminar comida" onPress={() => Alert.alert('Eliminar comida', meal._id ? 'Al guardar se quitará la comida y sus registros de seguimiento.' : 'Se quitará esta comida y todos sus alimentos del borrador.', [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Aceptar', style: 'destructive', onPress: onRemove },
    ])} />
  </View>
}
