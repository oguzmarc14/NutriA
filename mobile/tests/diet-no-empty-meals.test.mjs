import test from 'node:test'
import assert from 'node:assert/strict'
import {newPlan, fromCatalog, planPayload} from '../src/features/nutrition/plans/models.ts'

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
