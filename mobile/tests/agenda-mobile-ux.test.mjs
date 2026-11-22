import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const agenda = read('src/features/appointments/screens/AgendaScreen.tsx')
const create = read('src/features/appointments/screens/CreateAppointmentScreen.tsx')
test('agenda presents daily weekly and monthly calendar with status filters', () => {
  assert.match(agenda, /views: AgendaView\[\] = \['Día', 'Semana', 'Mes'\]/)
  assert.match(agenda, /calendarDays\(date\.getFullYear\(\)/)
  assert.match(agenda, /options\.map\(option =>/)
  assert.match(agenda, /Citas del día/)
  assert.match(agenda, /pathname: '\/consulta'/)
})
test('appointment form uses actual backend availability and validates before saving', () => {
  assert.match(create, /\/horario\/disponibilidad\?dias=7/)
  assert.match(create, /day\.espacios\.map\(space =>/)
  assert.match(create, /parseDay\(value\)/)
  assert.match(create, /calendarValid/)
  assert.match(create, /Alert\.alert\(existing \? 'Reprogramar cita' : 'Confirmar cita'/)
  assert.match(create, /availability\.reload\(\)/)
})
test('new appointment can inherit selected patient and agenda date', () => {
  assert.match(agenda, /patient: active\.id/)
  assert.match(agenda, /date: selectedDay >= today \? selectedDay : today/)
  assert.match(create, /initialPatient \|\| active\?\.id/)
})
