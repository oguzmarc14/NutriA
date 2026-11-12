const test = require('node:test')
const assert = require('node:assert/strict')
const { construirReconocimientos, preferenciasDe } = require('../src/services/gamificacion.service')

const hoy = new Date('2026-11-10T12:00:00Z')
const registro = (fecha, comentario = '', estado = 'omitida') => ({ fecha, comentario, estado })

test('no otorga logros sin registros, y el consentimiento inicia desactivado', () => {
  const resumen = construirReconocimientos([], hoy)
  assert.equal(resumen.diasConRegistro, 0)
  assert.deepEqual(resumen.reconocimientos, [])
  assert.equal(preferenciasDe({}).activa, false)
})

test('reconoce el registro honesto sin exigir comidas completadas', () => {
  const resumen = construirReconocimientos([registro('2026-11-08')], hoy)
  assert.equal(resumen.diasConRegistro, 1)
  assert.deepEqual(resumen.reconocimientos.map((item) => item.id), ['primer-paso'])
})

test('cuenta días únicos y la reflexión, no cantidad de comidas ni peso', () => {
  const resumen = construirReconocimientos([
    registro('2026-11-08', 'No me sentí bien'),
    registro('2026-11-08'),
    registro('2026-11-09'),
    registro('2026-11-10'),
  ], hoy)
  assert.equal(resumen.diasConRegistro, 3)
  assert.equal(resumen.diasUltimos14, 3)
  assert.ok(resumen.reconocimientos.some((item) => item.id === 'mi-voz'))
  assert.ok(resumen.reconocimientos.some((item) => item.id === 'conociendome'))
})

test('reconoce retomar tras una pausa sin penalizarla', () => {
  const resumen = construirReconocimientos([
    registro('2026-11-01'),
    registro('2026-11-08'),
  ], hoy)
  assert.ok(resumen.reconocimientos.some((item) => item.id === 'a-mi-ritmo'))
})

test('descarta fechas inválidas o futuras y los registros duplicados del mismo día', () => {
  const resumen = construirReconocimientos([
    registro('2026-02-30'),
    registro('2026-11-11'),
    registro('2026-11-10'),
    registro('2026-11-10'),
  ], hoy)
  assert.equal(resumen.diasConRegistro, 1)
})

test('requiere consentimiento del paciente y permiso del nutriólogo', () => {
  assert.equal(preferenciasDe({ gamificacion: { participa: true } }).activa, true)
  assert.equal(preferenciasDe({ gamificacion: { participa: true, permitidaPorNutriologo: false } }).activa, false)
  assert.equal(preferenciasDe({ gamificacion: { participa: false, permitidaPorNutriologo: true } }).activa, false)
})
