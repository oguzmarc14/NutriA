import assert from 'node:assert/strict'
import test from 'node:test'
import { editPlan, fromCatalog, newMeal, newPlan, planPayload, planTotals } from '../src/features/nutrition/plans/models.ts'

const food = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', nombre: 'Tortilla', grupo: 'Cereales',
  porcion: { cantidad: 2, unidad: 'piezas', descripcion: '2 tortillas' },
  nutrimentos: { kcal: 120, proteina: 3, carbohidratos: 25, grasas: 1, fibra: 2, sodio: 5 } }
const plan = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', nombre: 'Plan de prueba', objetivo: 'Ejemplo',
  fechaInicio: '2026-11-19T18:00:00.000Z', createdAt: '2026-11-18T18:00:00.000Z', metaEnergiaKcal: 2000,
  comidas: [{ _id: 'cccccccccccccccccccccccc', nombre: 'Desayuno', hora: '08:00', platillo: 'Tacos',
    descripcion: 'Con verduras', porcentajeDistribucion: 30,
    preparaciones: [{ id: 'prep-1', nombre: 'Tacos', tipo: 'platillo' }],
    alimentos: [{ ...food, tipo: 'catalogo', alimento: food._id, cantidad: 2, preparacionId: 'prep-1', notas: 'Calentar' }] }] }

test('editing preserves meal IDs, preparations and catalog references needed for follow-up', () => {
  const before = structuredClone(plan)
  const payload = planPayload(editPlan(plan))
  assert.equal(payload.comidas[0]._id, plan.comidas[0]._id)
  assert.deepEqual(payload.comidas[0].preparaciones, plan.comidas[0].preparaciones)
  assert.equal(payload.comidas[0].alimentos[0].preparacionId, 'prep-1')
  assert.equal(payload.comidas[0].alimentos[0].alimentoId, food._id)
  assert.equal(payload.comidas[0].alimentos[0].notas, 'Calentar')
  assert.equal(payload.comidas[0].porcentajeDistribucion, 30)
  assert.equal(payload.fechaInicio, '2026-11-19T00:00:00.000Z')
  assert.deepEqual(plan, before)
})
test('catalog references also support populated objects', () => {
  const draft = editPlan(plan)
  draft.meals[0].alimentos[0].alimento = { _id: food._id }
  assert.equal(planPayload(draft).comidas[0].alimentos[0].alimentoId, food._id)
})
test('target energy changes independently from food quantities and can be cleared', () => {
  const draft = editPlan(plan)
  const before = planTotals(draft.meals)
  draft.energy = '1800,5'
  assert.equal(planPayload(draft).metaEnergiaKcal, 1800.5)
  assert.deepEqual(planTotals(draft.meals), before)
  draft.energy = ''
  assert.equal(planPayload(draft).metaEnergiaKcal, null)
  for (const value of ['0', '-1', 'Infinity', 'abc']) {
    draft.energy = value; assert.throws(() => planPayload(draft), /meta de energía/)
  }
})
test('nutrients multiply base portions once and accept decimal comma quantities', () => {
  const draft = editPlan(plan)
  draft.meals[0].alimentos[0].quantity = '1,5'
  assert.deepEqual(planTotals(draft.meals), { kcal: 180, proteina: 4.5, carbohidratos: 37.5, grasas: 1.5 })
  assert.equal(planPayload(draft).comidas[0].alimentos[0].cantidad, 1.5)
})
test('custom foods preserve portion, optional nutrients and notes when editing', () => {
  const draft = editPlan(plan)
  draft.meals[0].alimentos[0].tipo = 'personalizado'
  const payload = planPayload(draft).comidas[0].alimentos[0]
  assert.equal(payload.tipo, 'personalizado')
  assert.deepEqual(payload.porcion, food.porcion)
  assert.equal(payload.nutrimentos.fibra, 2)
  assert.equal(payload.nutrimentos.sodio, 5)
  assert.equal(payload.notas, 'Calentar')
  assert.equal('alimentoId' in payload, false)
})
test('invalid quantities and impossible dates cannot reach the API', () => {
  for (const quantity of ['', '0', '-1', '0.09', 'NaN']) {
    const draft = editPlan(plan); draft.meals[0].alimentos[0].quantity = quantity
    assert.throws(() => planPayload(draft), /porciones/)
  }
  const draft = editPlan(plan); draft.date = '2026-02-30'
  assert.throws(() => planPayload(draft), /fecha válida/)
})
test('new plans need food and new catalog rows receive distinct local keys', () => {
  assert.throws(() => planPayload(newPlan()))
  assert.notEqual(fromCatalog(food).key, fromCatalog(food).key)
  assert.notEqual(newMeal().key, newMeal().key)
})
