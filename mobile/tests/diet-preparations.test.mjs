import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mealPreparations, normalizedFoods, preparationFoods, stepPortion } from '../src/features/nutrition/plans/preparations.ts'
import { newMeal, fromCatalog, planTotals } from '../src/features/nutrition/plans/models.ts'
const food = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', nombre: 'Tortilla', nutrimentos: { kcal: 70, proteina: 2, carbohidratos: 15, grasas: 0 } }
test('preparation groups keep each food visible exactly once, including legacy references', () => {
  const meal = newMeal()
  meal.preparaciones = [{ id: 'plate', nombre: 'Tacos', tipo: 'platillo' }, { id: 'drink', nombre: 'Bebida', tipo: 'bebida' }]
  meal.alimentos = [fromCatalog(food), { ...fromCatalog(food), preparacionId: 'drink' }, { ...fromCatalog(food), preparacionId: 'removed-old-id' }]
  const groups = mealPreparations(meal).map(p => preparationFoods(meal, p.id))
  assert.deepEqual(groups.map(g => g.length), [2, 1])
  assert.equal(new Set(groups.flat().map(f => f.key)).size, 3)
  assert.equal(groups.reduce((sum, alimentos) => sum + planTotals([{ ...meal, alimentos }]).kcal, 0), 210)
  const normalized = normalizedFoods(meal)
  assert.deepEqual(normalized.map(f => f.preparacionId), ['plate', 'drink', 'plate'])
  assert.equal(meal.alimentos[2].preparacionId, 'removed-old-id')
})
test('portion stepper accepts decimal commas and never drops below the API minimum', () => {
  assert.equal(stepPortion('1,5', 1), '2.5')
  assert.equal(stepPortion('0.5', -1), '0.1')
  assert.equal(stepPortion('0.1', -1), '0.1')
  assert.equal(stepPortion('', 1), '1')
})

test('food portion controls step in quarters without losing 0.1 minimum',()=>{
  assert.equal(stepPortion('½',1,.25),'0.75')
  assert.equal(stepPortion('¾',-1,.25),'0.5')
  assert.equal(stepPortion('0.25',-1,.25),'0.1')
})
