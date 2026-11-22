import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { clinicMenu, patientDestinations, isPatientIntent } from '../src/features/navigation/menu.ts'
test('all twelve clinic sections lead to an existing mobile route', () => {
  assert.equal(clinicMenu.length, 12)
  assert.equal(new Set(clinicMenu.map(item => item.label)).size, 12)
  for (const item of clinicMenu) {
    const path = 'intent' in item ? patientDestinations[item.intent] : item.path
    const file = path === '/' ? '/index' : path
    assert.ok(existsSync(new URL('../app' + file + '.tsx', import.meta.url)) || existsSync(new URL('../app/(tabs)' + file + '.tsx', import.meta.url)), item.label)
  }
})
test('patient selection distinguishes creation, consultation and clinical destinations', () => {
  assert.equal(patientDestinations['create-plan'], '/dieta')
  assert.equal(patientDestinations.plan, '/planes')
  assert.equal(patientDestinations.record, '/expediente')
  assert.equal(isPatientIntent('toString'), false)
  assert.equal(isPatientIntent(['record']), false)
  assert.equal(isPatientIntent('measurements'), true)
})
