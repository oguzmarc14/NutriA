import { clockLabel, clockParts, clockValue } from '../src/shared/ui/dateTimeModel.ts'
import { calendarDays } from '../src/features/clinic/workCalendar.ts'
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
  assert.match(create, /\/horario\/disponibilidad\?dias=/)
  assert.match(create, /<PeriodCalendar/)
  assert.match(create, /clockLabel\(space.hora\)/)
  assert.match(create, /day\.espacios\.filter\(space =>/)
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

test('12 AM y 12 PM conservan su significado para guardar y reservar', () => {
  assert.equal(clockValue(12, '00', 'AM'), '00:00')
  assert.equal(clockValue(12, '30', 'PM'), '12:30')
  assert.equal(clockLabel('21:05'), '9:05 PM')
  assert.deepEqual(clockParts('09:15'), { hour: 9, minute: '15', period: 'AM' })
})
test('día, semana y mes generan rangos compatibles con la disponibilidad', () => {
  assert.deepEqual(calendarDays('2026-11-29', 'Día'), ['2026-11-29'])
  assert.equal(calendarDays('2026-11-29', 'Semana').at(-1), '2026-11-29')
  assert.equal(calendarDays('2026-11-29', 'Mes').length, 42)
})
