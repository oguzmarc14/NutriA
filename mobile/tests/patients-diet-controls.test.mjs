import test from 'node:test'
import assert from 'node:assert/strict'
import { patientNotices, weightChange } from '../src/features/patients/patientNotices.ts'
import { reorderMeals } from '../src/features/nutrition/plans/reorderMeals.ts'
import { newPlan, planPayload, fromCatalog } from '../src/features/nutrition/plans/models.ts'
test('patient notices only infer missing records from explicit backend flags', () => {
  const ready = { accountStatus: 'active', phone: '4491234567', birthDate: '2000-01-01' }
  assert.deepEqual(patientNotices(ready), [])
  assert.deepEqual(patientNotices({ ...ready, tieneExpediente: false, tienePlan: false, ultimaMedicion: null }).map(n => n.id), ['record','plan','measurements'])
  assert.equal(patientNotices({ ...ready, accountStatus: 'pending' })[0].id, 'invitation')
})
test('weight change needs two dated valid measurements and never changes the source order', () => {
  const entries = [{ peso: 82, fecha: '2026-11-20' }, { peso: 90, fecha: '2026-09-01' }, { peso: 0, fecha: '2026-10-01' }]
  assert.equal(weightChange(entries), -8); assert.equal(entries[0].peso, 82)
  assert.equal(weightChange([entries[0]]), null)
})
test('drag reorder preserves meal identity, foods, times and percentage', () => {
  const plan = newPlan(), original = [...plan.meals]
  const next = reorderMeals(plan.meals, 0, 2)
  assert.deepEqual(next.map(m => m.key), [original[1].key, original[2].key, original[0].key])
  assert.equal(next[2], original[0]); assert.deepEqual(plan.meals, original)
  assert.equal(reorderMeals(plan.meals, -1, 3), plan.meals)
})
test('custom energy is persisted independently of food energy and restored to default without changing foods', () => {
  const plan = newPlan(); plan.name = 'Plan de prueba'
  plan.meals[0].alimentos.push(fromCatalog({ _id: 'a'.repeat(24), nombre: 'Tortilla', nutrimentos: { kcal: 70, proteina: 2, carbohidratos: 15, grasas: 0 } }))
  const adjusted = planPayload({ ...plan, energy: '2300' })
  const restored = planPayload({ ...plan, energy: '' })
  assert.equal(adjusted.metaEnergiaKcal, 2300); assert.equal(restored.metaEnergiaKcal, null)
  assert.deepEqual(adjusted.comidas, restored.comidas)
})
