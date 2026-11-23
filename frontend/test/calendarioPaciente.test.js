import test from 'node:test'
import assert from 'node:assert/strict'
import { dietaParaFecha, ordenarDietas, proximasDietas } from '../src/utils/calendarioDietas.js'
import { fechaCitaEnZona } from '../src/utils/fechasMisCitas.js'
import { documentoPlanPDF } from '../src/utils/exportarPlanPDF.js'

test('calendar keeps the current diet active and marks the latest plan when multiple start on the same day', () => {
  const current = { _id: 'a', fechaInicio: '2026-11-21T00:00:00.000Z' }
  const older = { _id: 'b', fechaInicio: '2026-12-01', createdAt: '2026-11-22T10:00:00Z' }
  const newer = { _id: 'c', fechaInicio: '2026-12-01', createdAt: '2026-11-22T11:00:00Z' }
  const later = { _id: 'd', fechaInicio: '2026-12-07' }
  const plans = ordenarDietas([newer,current,later,older])
  assert.equal(dietaParaFecha(plans, '2026-11-20'), undefined)
  assert.equal(dietaParaFecha(plans, '2026-11-30'), current)
  assert.equal(dietaParaFecha(plans, '2026-12-01'), newer)
  assert.deepEqual(proximasDietas(plans, '2026-11-23'), [newer,later])
})

test('appointments are marked on the date at the clinic, including near UTC midnight', () => {
  assert.equal(fechaCitaEnZona('2026-12-01T02:00:00Z', 'America/Mexico_City'), '2026-11-30')
  assert.equal(fechaCitaEnZona('2026-12-01T08:00:00Z', 'America/Mexico_City'), '2026-12-01')
  assert.equal(fechaCitaEnZona('', 'America/Mexico_City'), '')
})

test('printed plans render the clinic first and accept only safe image data in the logo', () => {
  const plan = { nombre: 'Dieta de prueba', comidas: [{ nombre: 'Desayuno' }] }
  const html = documentoPlanPDF(plan, { name: 'Paciente' }, {
    clinica: { nombre: 'Nutrición <Norte>', logo: 'data:image/png;base64,aGVsbG8=' },
  })
  assert.match(html, /Nutrición &lt;Norte&gt;/)
  assert.match(html, /<img src="data:image\/png;base64,aGVsbG8="/)
  assert.match(html, /<footer><strong>Tecnología de NutriA<\/strong>/)
  assert.doesNotMatch(documentoPlanPDF(plan, null, { clinica: { logo: 'data:image/svg+xml;base64,aA==' } }), /<img src=/)
})
