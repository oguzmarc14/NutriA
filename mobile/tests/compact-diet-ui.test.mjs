import test from 'node:test'
import assert from 'node:assert/strict'
import { newMeal, fromCatalog, planPayload, newPlan } from '../src/features/nutrition/plans/models.ts'
import { preparationFoods, normalizedFoods, stepPortion } from '../src/features/nutrition/plans/preparations.ts'
const tortilla = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', nombre: 'Tortilla', nutrimentos: { kcal: 70, proteina: 2, carbohidratos: 15, grasas: 0 } }
test('switching preparation keeps catalog and custom food quantities independent', () => {
  const meal = newMeal(); meal.preparaciones = [{ id: 'plate', nombre: 'Tacos', tipo: 'platillo' }, { id: 'drink', nombre: 'Leche', tipo: 'bebida' }]
  meal.alimentos = [{ ...fromCatalog(tortilla), preparacionId: 'plate', quantity: '2' }, { ...fromCatalog(tortilla), tipo: 'personalizado', preparacionId: 'drink', quantity: '0.5' }]
  assert.equal(preparationFoods(meal, 'plate')[0].quantity, '2')
  assert.equal(preparationFoods(meal, 'drink')[0].quantity, '0.5')
})
test('decimal portions stay editable and preserve notes when serialized', () => {
  const draft = newPlan(); draft.name = 'Plan de prueba'
  draft.meals[0].alimentos = [{ ...fromCatalog(tortilla), quantity: '0,5', notas: 'Calentar', preparacionId: draft.meals[0].preparaciones[0].id }]
  const food = planPayload(draft).comidas[0].alimentos[0]
  assert.equal(food.cantidad, 0.5); assert.equal(food.notas, 'Calentar')
})
test('portion changes obey backend minimum without losing comma decimal values', () => {
  assert.equal(stepPortion('0,5', -1), '0.1')
  assert.equal(stepPortion('1,5', 1), '2.5')
})
test('legacy food preparation normalization does not mutate saved references', () => {
  const meal = newMeal(); meal.alimentos = [{ ...fromCatalog(tortilla), preparacionId: 'legacy-unknown' }]
  assert.equal(normalizedFoods(meal)[0].preparacionId, meal.preparaciones[0].id)
  assert.equal(meal.alimentos[0].preparacionId, 'legacy-unknown')
})
