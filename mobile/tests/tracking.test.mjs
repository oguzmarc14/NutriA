import test from 'node:test'
import assert from 'node:assert/strict'
import { activePlan, dailySummary, findTracking, trackingPayload, validDay } from '../src/features/nutrition/tracking/models.ts'
const PLAN = 'bbbbbbbbbbbbbbbbbbbbbbbb', MEAL = 'cccccccccccccccccccccccc'
const plan = { _id: PLAN, fechaInicio: '2026-11-01T00:00:00Z', comidas: [{ _id: MEAL }] }
test('a menu remains applicable after its start until replaced', () => {
  assert.equal(activePlan([plan], '2026-11-02'), plan)
  assert.equal(activePlan([plan], '2026-10-31'), undefined)
  const next = { ...plan, _id: 'dddddddddddddddddddddddd', fechaInicio: '2026-11-05' }
  assert.equal(activePlan([plan, next], '2026-11-05'), next)
  assert.equal(validDay('2026-02-30'), false)
})
test('records for different dates, plans or meals cannot be confused', () => {
  const record = { plan: PLAN, comida: MEAL, fecha: '2026-11-02', estado: 'parcial' }
  assert.equal(findTracking([record], PLAN, MEAL, '2026-11-03'), undefined)
  assert.equal(findTracking([record], 'another', MEAL, record.fecha), undefined)
  assert.equal(findTracking([record], PLAN, MEAL, record.fecha), record)
})
test('tracking submission requires valid choices, an owned meal, and bounded comments', () => {
  assert.throws(() => trackingPayload(plan, MEAL, '2026-11-02', '', '', ''))
  assert.throws(() => trackingPayload(plan, 'aaaaaaaaaaaaaaaaaaaaaaaa', '2026-11-02', 'completada', 'neutral', ''))
  assert.throws(() => trackingPayload(plan, MEAL, '2026-11-02', 'completada', 'neutral', 'x'.repeat(501)))
  assert.deepEqual(trackingPayload(plan, MEAL, '2026-11-02', 'parcial', 'neutral', ' Nota '), {
    planId: PLAN, comidaId: MEAL, fecha: '2026-11-02', estado: 'parcial', agrado: 'neutral', comentario: 'Nota',
  })
})
test('daily summary counts each assigned meal once and ignores another day', () => {
  const registros = [{ plan: PLAN, comida: MEAL, fecha: '2026-11-02', estado: 'completada' }]
  assert.equal(dailySummary({ planes: [plan], registros }, '2026-11-02').completed, 1)
  assert.equal(dailySummary({ planes: [plan], registros }, '2026-11-03').recorded, 0)
})
