import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chartPoints, chartCoordinates } from '../src/features/progress/chartModel.ts'
import { roleNotices } from '../src/features/notifications/noticeModel.ts'
test('measurement charts sort real dates and exclude missing, invalid and nonnumeric values', () => {
  const rows = [{ _id: 'b', fecha: '2026-02-01', peso: 72 }, { _id: 'a', fecha: '2026-01-01', peso: 75 },
    { _id: 'c', fecha: 'bad', peso: 70 }, { _id: 'd', fecha: '2026-03-01', peso: null }, { _id: 'e', fecha: '2026-04-01', peso: '70' }]
  assert.deepEqual(chartPoints(rows, 'peso').map(p => p.value), [75, 72])
  assert.deepEqual(chartPoints(rows, 'imc'), [])
})
test('composition zero remains a recorded value and invalid weight zero is excluded', () => {
  const rows = [{ _id: 'a', fecha: '2026-01-01', peso: 0, grasaCorporal: 0 }]
  assert.equal(chartPoints(rows, 'grasaCorporal')[0].value, 0)
  assert.equal(chartPoints(rows, 'peso').length, 0)
})
test('single, constant and same-day charts never divide by zero', () => {
  for (const rows of [[], [{ _id: 'a', fecha: '2026-01-01', peso: 70 }],
    [{ _id: 'a', fecha: '2026-01-01', peso: 70 }, { _id: 'b', fecha: '2026-01-01', peso: 70 }]]) {
    const coordinates = chartCoordinates(chartPoints(rows, 'peso'), 220, 120)
    for (const p of coordinates) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y))
  }
})
test('chart horizontal scale follows elapsed time and fits the available width', () => {
  const points = chartPoints([{ _id: 'a', fecha: '2026-01-01', peso: 80 }, { _id: 'b', fecha: '2026-01-02', peso: 79 }, { _id: 'c', fecha: '2026-01-11', peso: 78 }], 'peso')
  const xy = chartCoordinates(points, 200, 120)
  assert.equal(xy[0].x, 0); assert.equal(xy[1].x, 20); assert.equal(xy[2].x, 200)
})
test('clinic notices show only future appointments still awaiting confirmation', () => {
  const rows = ['programada', 'confirmada', 'cancelada'].map((estado, i) => ({ _id: String(i), estado, inicio: '2026-02-01T12:00:00Z', patient: { name: 'Paciente' } }))
  rows.push({ _id: 'past', estado: 'programada', inicio: '2025-01-01' })
  assert.equal(roleNotices('nutritionist', rows, Date.parse('2026-01-01')).length, 1)
})
test('patient notices come only from the patient endpoint format and unknown roles get no notices', () => {
  const avisos = [{ id: 'a', titulo: 'Cita confirmada', detalle: 'Revisa tu cita' }]
  assert.deepEqual(roleNotices('patient', { avisos }), avisos)
  assert.deepEqual(roleNotices('patient', [{ _id: 'staff' }]), [])
  assert.deepEqual(roleNotices(undefined, [{ _id: 'staff' }]), [])
  assert.equal(roleNotices('admin', [{ _id: 'recipe', titulo: 'Ensalada' }])[0].id, 'recipe-recipe')
})
