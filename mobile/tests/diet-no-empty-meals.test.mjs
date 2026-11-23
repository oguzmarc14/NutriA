import test from 'node:test'
import assert from 'node:assert/strict'
import {newPlan, newMeal, fromCatalog, planPayload, planDistribution, editablePlanPayload} from '../src/features/nutrition/plans/models.ts'

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
  assert.throws(() => editablePlanPayload(draft), /Agrega ingredientes/)
  for (const meal of draft.meals.slice(3)) meal.alimentos = [fromCatalog(catalog)]
  const saved = editablePlanPayload(draft)
  assert.equal(saved.comidas.length, 5)
  assert.equal(saved.comidas.reduce((sum, meal) => sum + meal.porcentajeDistribucion, 0), 100)
  draft.meals.pop()
  assert.throws(() => editablePlanPayload(draft), /Faltan 2.5/)
})
