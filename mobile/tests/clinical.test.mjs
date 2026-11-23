import assert from 'node:assert/strict'
import test from 'node:test'
import { measurementDate, measurementDay, numberInput, measurementChanged } from '../src/features/nutrition/clinicalModels.ts'

test('clinical numbers accept decimal comma without silently treating empty input as zero', () => {
  assert.equal(numberInput(' 1,72 '), 1.72)
  assert.equal(numberInput('-300'), -300)
  for (const value of ['', ' ', '1,000.5', 'Infinity', '7 kg', '1e3']) assert.ok(Number.isNaN(numberInput(value)))
})
test('measurement dates reject impossible calendar dates', () => {
  assert.equal(measurementDate('2026-02-29'), null)
  assert.equal(measurementDate('2026-04-31'), null)
  assert.equal(measurementDate('2026-13-01'), null)
  assert.ok(measurementDate('2028-02-29'))
})
test('saved calculations detect newly registered and edited measurements', () => {
  const calculation = { medicion: 'one', peso: 70, edad: 25, estaturaCm: 170,
    fechaMedicion: '2026-11-01T18:00:00Z', createdAt: '2026-11-01T19:00:00Z' }
  const original = { _id: 'one', peso: 70, edad: 25, estatura: 1.7, fecha: calculation.fechaMedicion }
  assert.equal(measurementChanged(calculation, [original]), false)
  assert.equal(measurementChanged(calculation, [{ ...original, peso: 72 }]), true)
  assert.equal(measurementChanged(calculation, [{ ...original, _id: 'two', createdAt: '2026-11-02T01:00:00Z' }]), true)
  assert.equal(measurementChanged(calculation, [{ ...original, _id: 'two', fecha: '2026-11-10T18:00:00Z' }]), true)
})

test('clinical dates survive UTC offsets and editing preserves their original calendar day',()=>{
  assert.equal(measurementDay('2026-11-22T00:00:00.000Z'), '2026-11-22')
  assert.equal(measurementDay('2026-11-22T12:00:00.000Z'), '2026-11-22')
  assert.equal(measurementDate('2026-11-22'), '2026-11-22T12:00:00.000Z')
})
