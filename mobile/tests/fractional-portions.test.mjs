import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuantity, planTotals, planPayload, newPlan, fromCatalog } from '../src/features/nutrition/plans/models.ts'
import { stepPortion } from '../src/features/nutrition/plans/preparations.ts'

test('fraction and mixed-portion values are parsed accurately', () => {
  for (const [value, n] of [['½',.5],['¼',.25],['¾',.75],['1/2',.5],['1 1/2',1.5],['1½',1.5],['2,5',2.5]]) {
    assert.equal(parseQuantity(value), n, value)
  }
  for (const value of ['1/0','3/2','nada','']) assert.ok(Number.isNaN(parseQuantity(value)))
  assert.equal(stepPortion('½',1),'1.5')
})
test('fractional portions scale calories, macros and payload quantities', () => {
  const draft = newPlan()
  draft.name = 'Plan de fracciones'
  const food = fromCatalog({_id:'aaaaaaaaaaaaaaaaaaaaaaaa',nombre:'Tortilla',
    nutrimentos:{kcal:80,proteina:2,carbohidratos:16,grasas:1}})
  food.quantity='½'
  draft.meals[0].alimentos=[food]
  assert.equal(planTotals(draft.meals).kcal,40)
  assert.equal(planTotals(draft.meals).proteina,1)
  assert.equal(planPayload(draft).comidas[0].alimentos[0].cantidad,0.5)
  food.quantity='¼'
  assert.equal(planTotals(draft.meals).kcal,20)
  assert.equal(planPayload(draft).comidas[0].alimentos[0].cantidad,0.25)
})
