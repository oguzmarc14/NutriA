const test = require('node:test')
const assert = require('node:assert/strict')
const {
  fechaProgramable,
  requiereReiniciarRecordatorios,
  estadoPermitidoEnFecha,
  solapamiento,
} = require('../src/utils/citas.utils')

const ahora = new Date('2026-11-10T17:00:00Z')
const anterior = '2026-11-09T17:00:00Z'
const futuro = '2026-11-11T17:00:00Z'

test('crear y reprogramar requiere fecha futura; modificar histórica conserva su fecha', () => {
  assert.equal(fechaProgramable(futuro, null, ahora), true)
  assert.equal(fechaProgramable(anterior, null, ahora), false)
  assert.equal(fechaProgramable(anterior, anterior, ahora), true)
  assert.equal(fechaProgramable('2026-11-08T17:00:00Z', anterior, ahora), false)
  assert.equal(fechaProgramable('fecha inválida', anterior, ahora), false)
})

test('cambio de notas no reinicia recordatorios; cambiar fecha o estado sí', () => {
  const original = { inicio: futuro, estado: 'confirmada', notas: 'A' }
  assert.equal(requiereReiniciarRecordatorios(original, { inicio: futuro, estado: 'confirmada', notas: 'B' }), false)
  assert.equal(requiereReiniciarRecordatorios(original, { inicio: futuro, estado: 'cancelada', notas: 'A' }), true)
  assert.equal(requiereReiniciarRecordatorios(original, { inicio: '2026-11-12T17:00:00Z', estado: 'confirmada' }), true)
})

test('se permite completar en pasado pero no antes de la cita', () => {
  assert.equal(estadoPermitidoEnFecha('completada', anterior, ahora), true)
  assert.equal(estadoPermitidoEnFecha('completada', futuro, ahora), false)
  assert.equal(estadoPermitidoEnFecha('cancelada', anterior, ahora), true)
  assert.equal(estadoPermitidoEnFecha('confirmada', anterior, ahora), false)
  assert.equal(estadoPermitidoEnFecha('programada', futuro, ahora), true)
})

test('citas solapadas de una hora se identifican, citas contiguas no', () => {
  const a='2026-11-11T10:00:00Z',b='2026-11-11T11:00:00Z'
  assert.equal(solapamiento(a,b,'2026-11-11T10:30:00Z','2026-11-11T11:30:00Z'),true)
  assert.equal(solapamiento(a,b,b,'2026-11-11T12:00:00Z'),false)
  assert.equal(solapamiento(a,b,'2026-11-11T09:00:00Z',a),false)
})

const fs = require('node:fs')
const path = require('node:path')
const rutas = fs.readFileSync(path.join(__dirname,'../src/routes/citas.routes.js'),'utf8')
const calendar = fs.readFileSync(path.join(__dirname,'../src/services/calendar.service.js'),'utf8')

test('rutas REST incluyen consultar, crear, editar, cambiar estado y eliminar', () => {
  for(const endpoint of ["router.get('/')","router.post('/')","router.put('/:id')","router.patch('/:id/estado')","router.delete('/:id')"]) {
    assert.ok(rutas.includes(endpoint), 'Falta '+endpoint)
  }
})
test('eliminación se restringe al propietario y primero limpia Google Calendar', () => {
  assert.match(rutas, /nutritionist: req\.user\._id/)
  assert.ok(rutas.indexOf('await deleteAppointment(cita)') < rutas.indexOf('await cita.deleteOne()'))
  assert.match(calendar, /async function deleteAppointment\(cita\)/)
})
