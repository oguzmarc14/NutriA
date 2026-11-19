import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { CustomFoodForm } from './CustomFoodForm'
import { planTotals, type DraftMeal } from './models'

export function MealEditor({ meal, busy, onChange, onCatalog, onRemove }: {
  meal: DraftMeal; busy: boolean; onChange: (meal: DraftMeal) => void; onCatalog: () => void; onRemove: () => void
}) {
  const [custom, setCustom] = useState(false)
  const totals = planTotals([meal])
  return <View style={[styles.card, { gap: 12 }]}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Editar comida</Text>
    <Text style={styles.body}>{totals.kcal.toFixed(1)} kcal · Proteínas {totals.proteina.toFixed(1)} g · Carbohidratos {totals.carbohidratos.toFixed(1)} g · Grasas {totals.grasas.toFixed(1)} g</Text>
    <FormField label="Nombre de la comida" value={meal.nombre} onChange={nombre => onChange({ ...meal, nombre })} disabled={busy} />
    <FormField label="Hora (HH:MM) · opcional" value={meal.hora || ''} onChange={hora => onChange({ ...meal, hora })} disabled={busy} />
    <FormField label="Platillo · opcional" value={meal.platillo || ''} onChange={platillo => onChange({ ...meal, platillo })} disabled={busy} />
    <FormField label="Indicaciones · opcional" multiline value={meal.descripcion || ''} onChange={descripcion => onChange({ ...meal, descripcion })} disabled={busy} />
    <FormField label="Distribución de energía (%) · opcional" numeric value={meal.percentage} onChange={percentage => onChange({ ...meal, percentage })} disabled={busy} />
    {!meal.alimentos.length && <Text style={styles.body}>Agrega alimentos a esta comida.</Text>}
    {meal.alimentos.map(food => <View key={food.key} style={{ paddingVertical: 12, gap: 8 }}>
      <Text style={styles.cardTitle}>{food.nombre}</Text>
      <Text style={styles.body}>Una porción: {food.porcion?.descripcion || `${food.porcion?.cantidad ?? 1} ${food.porcion?.unidad || 'porción'}`} · {food.nutrimentos.kcal} kcal</Text>
      <FormField numeric label={`Porciones de ${food.nombre}`} disabled={busy} value={food.quantity}
        onChange={quantity => onChange({ ...meal, alimentos: meal.alimentos.map(item => item.key === food.key ? { ...item, quantity } : item) })} />
      <FormField label={`Notas de ${food.nombre} · opcional`} value={food.notas || ''} disabled={busy}
        onChange={notas => onChange({ ...meal, alimentos: meal.alimentos.map(item => item.key === food.key ? { ...item, notas } : item) })} />
      <Button selected={false} disabled={busy} label={`Quitar ${food.nombre}`} onPress={() => onChange({ ...meal, alimentos: meal.alimentos.filter(item => item.key !== food.key) })} />
    </View>)}
    <Button disabled={busy} label="Buscar en catálogo" onPress={onCatalog} />
    <Button disabled={busy || custom} selected={false} label="Agregar alimento personalizado" onPress={() => setCustom(true)} />
    {custom && !busy && <CustomFoodForm onCancel={() => setCustom(false)} onAdd={food => { onChange({ ...meal, alimentos: [...meal.alimentos, food] }); setCustom(false) }} />}
    <Button disabled={busy} selected={false} label="Quitar esta comida" onPress={() => Alert.alert('Quitar comida',
      meal._id ? 'Al guardar, se quitará esta comida y se eliminarán sus registros de seguimiento. Esta acción no se puede deshacer.' : 'Se quitará esta comida del borrador.', [
        { text: 'Conservar', style: 'cancel' }, { text: 'Quitar comida', style: 'destructive', onPress: onRemove },
      ])} />
  </View>
}
