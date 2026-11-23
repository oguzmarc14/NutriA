import test from 'node:test'
import assert from 'node:assert/strict'
import {newPlan, newMeal, fromCatalog, planPayload, planDistribution, editablePlanPayload, balanceMealDistribution, suggestedPlanName} from '../src/features/nutrition/plans/models.ts'

test('default proposed meals without ingredients are omitted, never shown as empty to the patient',()=>{
  const draft=newPlan()
  draft.name='Dieta con una preparación'
  draft.meals[0].alimentos=[fromCatalog({
    _id:'aaaaaaaaaaaaaaaaaaaaaaaa',nombre:'Avena',nutrimentos:{kcal:120,proteina:4,carbohidratos:20,grasas:2},
  })]
  const result=planPayload(draft)
  assert.equal(result.comidas.length,1)
  assert.equal(result.comidas[0].nombre,'Desayuno')
  assert.equal(result.comidas[0].alimentos.length,1)
})
test('legacy saved empty meals cannot be silently deleted with tracking history',()=>{
  const draft=newPlan();draft.name='Plan antiguo'
  draft.meals[0].alimentos=[fromCatalog({
    _id:'aaaaaaaaaaaaaaaaaaaaaaaa',nombre:'Avena',nutrimentos:{kcal:120,proteina:4,carbohidratos:20,grasas:2},
  })]
  draft.meals[1]._id='bbbbbbbbbbbbbbbbbbbbbbbb'
  assert.throws(()=>planPayload(draft),/elimínala explícitamente/)
})

test('new meals join the running distribution and only a balanced plan can be submitted', () => {
  const draft = newPlan()
  draft.name = 'Plan de prueba'
  const catalog = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', nombre: 'Avena',
    nutrimentos: { kcal: 120, proteina: 4, carbohidratos: 20, grasas: 2 } }
  for (const meal of draft.meals) meal.alimentos = [fromCatalog(catalog)]
  draft.meals.push({ ...newMeal('Colación'), percentage: '0' }, { ...newMeal('Colación vespertina'), percentage: '0' })
  assert.equal(planDistribution(draft.meals).total, 100)
  assert.equal(editablePlanPayload(draft).comidas.length, 3)

  draft.meals[3].percentage = '5'
  draft.meals[4].percentage = '2,5'
  assert.equal(planDistribution(draft.meals).total, 107.5)
  assert.throws(() => editablePlanPayload(draft), /Sobran 7.5/)
  draft.meals[0].percentage = '17,5'
  const withoutEmpty = editablePlanPayload(draft)
  assert.equal(withoutEmpty.comidas.length, 3)
  assert.ok(Math.abs(withoutEmpty.comidas.reduce((sum, meal) => sum + meal.porcentajeDistribucion, 0) - 100) < 1e-8)
  for (const meal of draft.meals.slice(3)) meal.alimentos = [fromCatalog(catalog)]
  const saved = editablePlanPayload(draft)
  assert.equal(saved.comidas.length, 5)
  assert.equal(saved.comidas.reduce((sum, meal) => sum + meal.porcentajeDistribucion, 0), 100)
  draft.meals.pop()
  assert.throws(() => editablePlanPayload(draft), /Faltan 2.5/)
})

test('rebalancing preserves the edited share and keeps one hundred percent across additions and removals', () => {
  const draft = newPlan()
  const extra = newMeal('Colación')
  const added = balanceMealDistribution([...draft.meals, extra], { key: extra.key, percent: 25 })
  assert.equal(added.at(-1).percentage, '25')
  assert.equal(planDistribution(added).total, 100)
  const edited = balanceMealDistribution(added, { key: added[0].key, percent: 47.25 })
  assert.equal(edited[0].percentage, '47.25')
  assert.ok(Math.abs(planDistribution(edited).total - 100) < 1e-8)
  assert.equal(balanceMealDistribution(edited.slice(-1))[0].percentage, '100')
})

test('suggested names include patient, plan date and next daily folio', () => {
  const date = '2026-11-23'
  const previous = [{ nombre: 'Plan nutricional Ana Pérez 2026-11-23 #005', fechaInicio: date },
    { nombre: 'Personalizado', fechaInicio: date },
    { nombre: 'Plan nutricional Ana Pérez 2026-11-22 #010', fechaInicio: '2026-11-22' }]
  assert.equal(suggestedPlanName('Ana Pérez', date, previous), 'Plan nutricional Ana Pérez 2026-11-23 #006')
  assert.equal(suggestedPlanName('Ana Pérez', '2026-11-24', previous), 'Plan nutricional Ana Pérez 2026-11-24 #001')
})
