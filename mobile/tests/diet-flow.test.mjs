import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assistedPlan, duplicatePlan, newPlan, planPayload } from '../src/features/nutrition/plans/models.ts'
import { calendarDays, dayValue, parseDay } from '../src/shared/ui/dateTimeModel.ts'
test('new plans start with the same three meals and hours as the web', () => {
  assert.deepEqual(newPlan().meals.map(m => [m.nombre, m.hora]), [['Desayuno', '08:00'], ['Comida', '14:30'], ['Cena', '20:30']])
  assert.equal(newPlan().meals.every(m => m.preparaciones.length === 1), true)
})
test('assisted plans use clinical meal count, time endpoints and saved energy target', () => {
  const draft = assistedPlan({ numeroComidasDia: 5, primeraComida: '07:00', ultimaComida: '21:00', objetivos: ['salud'] }, 2100)
  assert.equal(draft.meals.length, 5)
  assert.equal(draft.meals[0].hora, '07:00')
  assert.equal(draft.meals[4].hora, '21:00')
  assert.equal(draft.meals.reduce((n, m) => n + Number(m.percentage), 0), 100)
  assert.equal(draft.energy, '2100'); assert.equal(draft.goal, 'Mejorar la salud')
  assert.equal(assistedPlan({ primeraComida: 'bad', ultimaComida: '01:00' }, 2000).meals[0].hora, '08:00')
})
test('duplicating a plan removes server meal IDs and preserves preparation and food quantities', () => {
  const original = { _id: 'plan', nombre: 'Menú', fechaInicio: '2026-01-01', createdAt: '2026-01-01', comidas: [{ _id: 'server-meal', nombre: 'Desayuno', hora: '08:00',
    preparaciones: [{ id: 'beverage', nombre: 'Bebida', tipo: 'bebida' }], alimentos: [{ tipo: 'personalizado', nombre: 'Batido', cantidad: 1.5, preparacionId: 'beverage', nutrimentos: { kcal: 100, proteina: 10, carbohidratos: 10, grasas: 2 } }] }] }
  const draft = duplicatePlan(original), body = planPayload(draft)
  assert.equal(body.comidas[0]._id, undefined)
  assert.equal(body.comidas[0].alimentos[0].preparacionId, 'beverage')
  assert.equal(body.comidas[0].alimentos[0].cantidad, 1.5)
  assert.equal(original.comidas[0]._id, 'server-meal')
})
test('calendar accepts leap days, rejects impossible dates and traverses December to January', () => {
  assert.ok(parseDay('2028-02-29'))
  assert.equal(parseDay('2026-02-29'), null)
  assert.equal(parseDay('2026-13-01'), null)
  assert.equal(parseDay('2026-1-1'), null)
  const days = calendarDays(2026, 11)
  assert.equal(days.length, 42)
  assert.equal(days[0].getDay(), 1)
  assert.ok(days.some(d => dayValue(d) === '2027-01-01'))
})
