import test from 'node:test'
import assert from 'node:assert/strict'
import { calculationEstimate, clinicalDay } from '../src/features/nutrition/calculationEstimate.ts'

const measurement = { _id:'m',fecha:'2026-11-22T00:00:00.000Z',
  peso:70,estatura:1.70,edad:30,nivelActividadFisica:3 }
test('Mifflin-St Jeor estimated results match API formulas before saving', () => {
  const estimate=calculationEstimate({measurement,sex:'male',factor:1.4,adjustment:0,carbs:50,protein:20,fats:30})
  assert.equal(estimate?.basal,1617.5)
  assert.equal(estimate?.gasto,2264.5)
  assert.equal(estimate?.objetivo,2264.5)
  assert.equal(estimate?.carbohidratos,283.1)
  assert.equal(estimate?.proteinas,113.2)
  assert.equal(estimate?.grasas,75.5)
})
test('invalid percentages, minor, or missing sex do not display a misleading preview', () => {
  assert.equal(calculationEstimate({measurement,sex:'male',factor:1.4,adjustment:0,carbs:60,protein:60,fats:30}),null)
  assert.equal(calculationEstimate({measurement:{...measurement,edad:15},sex:'male',factor:1.4,adjustment:0,carbs:50,protein:20,fats:30}),null)
  assert.equal(calculationEstimate({measurement,sex:null,factor:1.4,adjustment:0,carbs:50,protein:20,fats:30}),null)
})
test('stored UTC dates render as original calendar day', () => {
  assert.match(clinicalDay('2026-11-22T00:00:00.000Z'),/22/)
})
