import assert from 'node:assert/strict'
import test from 'node:test'
import { period } from '../src/agenda.ts'
import { canViewClinic, isRole } from '../src/access.ts'

test('solo el nutriólogo tiene acceso a las rutas clínicas', () => {
  for (const role of ['admin', 'nutritionist', 'patient']) assert.ok(isRole(role))
  assert.equal(isRole('constructor'), false)
  assert.equal(canViewClinic('admin'), false)
  assert.equal(canViewClinic('patient'), false)
  assert.equal(canViewClinic(undefined), false)
  assert.equal(canViewClinic('nutritionist'), true)
})

test('la agenda usa límites locales y fin exclusivo', () => {
  const sunday = new Date(2026, 10, 1, 12)
  assert.deepEqual(period(sunday, 'Día'), [new Date(2026, 10, 1), new Date(2026, 10, 2)])
  assert.deepEqual(period(sunday, 'Semana'), [new Date(2026, 9, 26), new Date(2026, 10, 2)])
  assert.deepEqual(period(sunday, 'Mes', -1), [new Date(2026, 9, 1), new Date(2026, 10, 1)])
})
