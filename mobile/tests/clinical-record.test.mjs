import assert from 'node:assert/strict'
import test from 'node:test'
import { clinicalForm, clinicalUpdate } from '../src/features/nutrition/clinicalRecordModel.ts'

test('partial clinical updates preserve untouched sections and explicit flags without transmitting server fields', () => {
  const base = { _id: 'owned', nutritionist: 'staff', alergias: '', observaciones: 'Anterior',
    nutricion: { aguaPorDia: 2 }, deporte: { tipo: 'Caminar' }, camposConDetalle: ['alergias', 'nutricion.intoleranciasAlimentarias'] }
  const before = structuredClone(base)
  const form = clinicalForm(base); form.observaciones = 'Actualizada'
  assert.deepEqual(clinicalUpdate(base, form), { observaciones: 'Actualizada',
    camposConDetalle: ['alergias', 'nutricion.intoleranciasAlimentarias', 'observaciones'] })
  assert.deepEqual(base, before)
})
test('clearing an edited clinical field removes its flag and leaves unrelated flags intact', () => {
  const base = { alergias: 'Detalle anterior', camposConDetalle: ['alergias', 'deporte.ejercicioRealizar'] }
  const form = clinicalForm(base); form.alergias = ''
  assert.deepEqual(clinicalUpdate(base, form), { alergias: '', camposConDetalle: ['deporte.ejercicioRealizar'] })
})
test('an empty form cannot create a placeholder clinical record', () => {
  assert.throws(() => clinicalUpdate(null, clinicalForm(null)), /datos clínicos/)
  const form = clinicalForm(null); form.observaciones = '  Datos revisados  '
  assert.deepEqual(clinicalUpdate(null, form), { observaciones: 'Datos revisados', camposConDetalle: ['observaciones'] })
})
