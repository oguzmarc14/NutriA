import assert from 'node:assert/strict'
import test from 'node:test'
import { period } from '../src/agenda.ts'
import { matchesPatient, shiftDate } from '../src/clinic.ts'
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

test('la búsqueda encuentra nombres con acentos y correos', () => {
  const patient = { _id: 'demo', name: 'María López', email: 'maria@example.com' }
  assert.ok(matchesPatient(patient, 'maria lopez'))
  assert.ok(matchesPatient(patient, 'EXAMPLE.COM'))
  assert.equal(matchesPatient(patient, 'García'), false)
})

test('la disponibilidad avanza por días de calendario sin depender de la zona del dispositivo', () => {
  assert.equal(shiftDate('2026-12-29', 7), '2027-01-05')
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29')
})
