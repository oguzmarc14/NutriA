import { parseQuantity, type DraftFood, type DraftMeal } from './models.ts'
export function mealPreparations(meal: DraftMeal) {
  return meal.preparaciones?.length ? meal.preparaciones : [{ id: 'legacy-' + meal.key, nombre: meal.platillo || '', tipo: 'platillo' as const }]
}
export function preparationFoods(meal: DraftMeal, id: string) {
  const preparations = mealPreparations(meal)
  return meal.alimentos.filter(food => (preparations.some(p => p.id === food.preparacionId) ? food.preparacionId : preparations[0].id) === id)
}
export function stepPortion(value: string, direction: -1 | 1, increment = 1) {
  const amount = parseQuantity(value)
  return Number.isFinite(amount) && value.trim() ? String(Math.max(0.1, Math.round((amount + direction * increment) * 100) / 100)) : direction > 0 ? String(increment) : '0.1'
}
export function normalizedFoods(meal: DraftMeal): DraftFood[] {
  const preparations = mealPreparations(meal)
  return meal.alimentos.map(food => ({ ...food, preparacionId: preparations.some(p => p.id === food.preparacionId) ? food.preparacionId : preparations[0].id }))
}
