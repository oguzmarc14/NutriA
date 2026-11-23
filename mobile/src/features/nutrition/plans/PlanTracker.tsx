import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState } from 'react'
import { Modal, PanResponder, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FormField } from '@/shared/ui/FormField'
import { RangeBar } from '@/shared/ui/RangeBar'
import { Button } from '@/shared/ui/primitives'
import { numberInput, type Calculation } from '../clinicalModels'
import { mealPercentage, parseQuantity, planDistribution, planTotals, type DraftPlan } from './models'
import { dietColors as c, dietStyles as s } from './dietUI'

function PercentageInput({ label, value, disabled, onCommit }: {
  label: string; value: string; disabled: boolean; onCommit: (value: number) => void
}) {
  const [entry, setEntry] = useState<string | null>(null)
  return <TextInput accessibilityLabel={label} editable={!disabled} keyboardType="decimal-pad"
    returnKeyType="done" maxLength={7} value={entry ?? value} selectTextOnFocus
    onChangeText={setEntry} onEndEditing={({ nativeEvent }) => {
      const percent = numberInput(nativeEvent.text)
      setEntry(null)
      if (Number.isFinite(percent)) onCommit(percent)
    }}
    style={[s.input, { minWidth: 74, minHeight: 44, paddingVertical: 7, textAlign: 'right' }]} />
}

export function PlanTracker({ draft, reference, active, disabled, open, onOpenChange, onPercentageChange, onChange }: {
  draft: DraftPlan; reference?: Calculation; active: string; disabled: boolean; open: boolean; onOpenChange: (open: boolean) => void; onPercentageChange: (key: string, percent: number) => void; onChange: (plan: DraftPlan) => void
}) {
  const { total, error } = planDistribution(draft.meals)
  const totalLabel = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 8 }).format(total) + '%'
  const insets = useSafeAreaInsets()
  const recommended = reference?.resultado.objetivoKcal || 0
  const entered = draft.energy.trim() ? numberInput(draft.energy) : recommended
  const target = Number.isFinite(entered) && entered > 0 ? entered : 0
  const totals = planTotals(draft.meals)
  const [max] = useState(() => Math.max(4000, Math.ceil(Math.max(Number(draft.energy) || 0, recommended) * 1.5 / 100) * 100))
  const gesture = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderRelease: (_, g) => { if (g.dy < -25) onOpenChange(true); if (g.dy > 25) onOpenChange(false) },
  })).current
  const current = draft.meals.find(m => m.key === active)
  const groups = new Map<string, number>()
  for (const meal of draft.meals) for (const food of meal.alimentos) {
    const amount = parseQuantity(food.quantity)
    if (Number.isFinite(amount) && amount >= 0.1) { const name = food.grupo || 'Sin grupo asignado'; groups.set(name, (groups.get(name) || 0) + amount) }
  }
  const metrics = [
    { label: 'Energía', actual: totals.kcal, goal: target, unit: 'kcal' },
    { label: 'Proteínas', actual: totals.proteina, goal: reference?.resultado.proteinasGramos, unit: 'g' },
    { label: 'Carbohidratos', actual: totals.carbohidratos, goal: reference?.resultado.carbohidratosGramos, unit: 'g' },
    { label: 'Grasas', actual: totals.grasas, goal: reference?.resultado.grasasGramos, unit: 'g' },
  ]
  const handle = <View style={{ alignItems: 'center', paddingTop: 9, paddingBottom: 3 }}><View style={{ width: 38, height: 4, borderRadius: 3, backgroundColor: '#a9c6b5' }} /></View>
  return <>
    <View style={{ backgroundColor: '#f7fcf8', borderTopWidth: 1, borderColor: c.border, paddingHorizontal: 18, paddingBottom: Math.max(8, insets.bottom) }} {...gesture.panHandlers}>
      {handle}
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir seguimiento del plan" accessibilityHint="Desliza hacia arriba o toca para ver nutrientes y ajustar la meta" onPress={() => onOpenChange(true)} style={{ minHeight: 54, justifyContent: 'center', gap: 6 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.label}>Energía del plan</Text><Text style={s.label}>{totals.kcal.toFixed(0)} / {target > 0 ? target.toFixed(0) : '—'} kcal <Ionicons name="chevron-up" color={c.green} size={16} /></Text></View>
        <Text style={[s.caption, { color: error ? '#8b4b15' : c.green }]}>Distribución · {totalLabel}</Text>
        <View style={{ height: 5, borderRadius: 4, backgroundColor: c.border }}><View style={{ height: 5, borderRadius: 4, width: `${target ? Math.min(100, totals.kcal / target * 100) : 0}%`, backgroundColor: totals.kcal > target && target ? '#b47820' : c.green }} /></View>
      </Pressable>
    </View>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: '#173f3477', justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar seguimiento" style={{ flex: 1 }} onPress={() => onOpenChange(false)} />
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 720, alignSelf: 'center', maxHeight: '85%', borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#f8fcf9', paddingBottom: Math.max(12, insets.bottom) }}>
          <View {...gesture.panHandlers}>{handle}<View style={[s.row, { paddingHorizontal: 20, paddingBottom: 8 }]}><Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>Seguimiento del plan</Text><Pressable accessibilityRole="button" accessibilityLabel="Minimizar seguimiento" onPress={() => onOpenChange(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={23} color={c.green} /></Pressable></View></View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <View style={s.inset}>
              <FormField label="Meta de energía (kcal/día)" numeric value={draft.energy || (recommended ? String(recommended) : '')} disabled={disabled} onChange={energy => onChange({ ...draft, energy })} />
              <RangeBar label="Ajustar meta de energía" value={target} min={50} max={max} step={50} disabled={disabled} onChange={v => onChange({ ...draft, energy: String(v) })} />
              <Text style={s.caption}>Barra: 50–{max} kcal. También puedes escribir una meta exacta.</Text>
              <Text style={s.caption}>{recommended ? `Referencia del último cálculo: ${recommended.toFixed(1)} kcal/día · ${new Date(reference!.createdAt).toLocaleDateString('es-MX')}.` : 'No hay cálculo nutricional guardado. La meta se define manualmente.'}</Text>
              {!!recommended && target > 0 && target !== recommended && <><Text style={s.caption}>Ajuste: {target - recommended > 0 ? '+' : ''}{(target - recommended).toFixed(1)} kcal respecto al cálculo. La referencia guardada se conserva.</Text><Button selected={false} label="Restaurar meta del cálculo" disabled={disabled} onPress={() => onChange({ ...draft, energy: '' })} /></>}
            </View>
            <View style={{ gap: 5 }}>
              <Text accessibilityRole="header" style={s.title}>Distribución por comida</Text>
              <Text accessibilityLiveRegion="polite" style={[s.label, { color: error ? '#8b4b15' : c.green }]}>Total: {totalLabel}</Text>
              <Text style={s.caption}>Al cambiar un porcentaje, los demás se ajustan para conservar el 100%.</Text>
              {!!error && <Text style={s.caption}>{error}</Text>}
            </View>
            {draft.meals.map(meal => { const percent = mealPercentage(meal.percentage); return <View key={meal.key} style={s.inset}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={[s.label, { flex: 1 }]}>{meal.nombre || 'Comida'}</Text>
                <PercentageInput label={'Porcentaje de ' + meal.nombre} value={meal.percentage}
                  disabled={disabled || draft.meals.length === 1} onCommit={value => onPercentageChange(meal.key, value)} />
                <Text style={s.caption}>%</Text>
              </View>
              <RangeBar label={'Ajustar porcentaje de ' + meal.nombre} value={percent} max={100}
                disabled={disabled || draft.meals.length === 1} onChange={value => onPercentageChange(meal.key, value)} />
              <Text style={s.caption}>{planTotals([meal]).kcal.toFixed(0)} / {Number.isFinite(percent) ? (target * percent / 100).toFixed(0) : '—'} kcal</Text>
            </View> })}
            {metrics.map(m => <View key={m.label} style={{ gap: 6 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.label}>{m.label}</Text><Text style={s.caption}>{m.actual.toFixed(1)} / {m.goal && m.goal > 0 ? m.goal.toFixed(1) : '—'} {m.unit}</Text></View>{!!m.goal && m.goal > 0 && <><View style={{ height: 7, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }}><View style={{ height: 7, width: `${Math.min(100, m.actual / m.goal * 100)}%`, backgroundColor: m.actual > m.goal ? '#b47820' : c.green }} /></View><Text style={s.caption}>{m.actual > m.goal ? 'Excedente' : 'Pendiente'}: {Math.abs(m.goal - m.actual).toFixed(1)} {m.unit}</Text></>}</View>)}
            {!!reference && <Text style={s.caption}>Las metas de macronutrientes corresponden al cálculo guardado; ajustar energía no modifica ese cálculo.</Text>}
            {current && <View style={s.inset}><Text style={s.label}>Comida seleccionada · {current.nombre}</Text><Text style={s.caption}>{planTotals([current]).kcal.toFixed(0)} kcal añadidas{Number.isFinite(mealPercentage(current.percentage)) ? ` · Meta: ${(target * mealPercentage(current.percentage) / 100).toFixed(0)} kcal` : ''}</Text></View>}
            <Text style={s.title}>Grupos utilizados</Text>
            {!groups.size && <Text style={s.caption}>Sin alimentos agregados.</Text>}
            {[...groups].map(([name, portions]) => <View key={name} style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.caption, { flex: 1 }]}>{name}</Text><Text style={s.label}>{portions.toFixed(1)} porciones</Text></View>)}
            <Text style={s.caption}>Porciones del catálogo; no equivalen a una asignación SMAE.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>
}
