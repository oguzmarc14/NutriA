const test = require('node:test')
const assert = require('node:assert/strict')

// Pruebas de contrato: mantienen claros los endpoints y reglas críticas de las citas.
const fs = require('node:fs')
const path = require('node:path')
const rutas = fs.readFileSync(path.join(__dirname, '../src/routes/citas.routes.js'), 'utf8')
const google = fs.readFileSync(path.join(__dirname, '../src/services/calendar.service.js'), 'utf8')

test('las rutas soportan altas, consulta, edición, cambio de estado y eliminación', () => {
  for (const endpoint of ["router.get('/')", "router.post('/')", "router.put('/:id')", "router.patch('/:id/estado')", "router.delete('/:id')"]) {
    assert.ok(rutas.includes(endpoint), 'Falta ruta ' + endpoint)
  }
})
test('las escrituras verifican identidad del nutriólogo y la cita antes de cambiarla', () => {
  assert.match(rutas, /nutritionist: req\.user\._id/)
  assert.match(rutas, /mongoose\.isValidObjectId\(req\.params\.id\)/)
})
test('no se elimina MongoDB antes de sincronizar la eliminación con Calendar', () => {
  assert.ok(rutas.indexOf('await deleteAppointment(cita)') < rutas.indexOf('await cita.deleteOne()'))
  assert.match(rutas, /No se eliminó en NutriA/)
  assert.match(google, /async function deleteAppointment\(cita\)/)
})
test('se distinguen modificaciones históricas de reprogramaciones pasadas', () => {
  assert.match(rutas, /seCambioFecha && inicio <= new Date\(\)/)
  assert.match(rutas, /cambioEstadoSchema/)
  assert.match(rutas, /Una cita pasada no puede reactivarse/)
})
