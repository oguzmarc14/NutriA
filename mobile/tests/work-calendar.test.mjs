import test from 'node:test'
import assert from 'node:assert/strict'
import {calendarDays,closedRange,addClosedDays,shiftCalendar} from '../src/features/clinic/workCalendar.ts'
test('views and month navigation keep real dates',()=>{
  assert.deepEqual(calendarDays('2026-11-22','Día'),['2026-11-22'])
  assert.deepEqual(calendarDays('2026-11-22','Semana'),['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22'])
  assert.equal(calendarDays('2026-11-22','Mes').length,42)
  assert.equal(shiftCalendar('2026-01-31','Mes',1),'2026-02-28')
})
test('vacation ranges are ordered, deduplicated and validated',()=>{
  assert.deepEqual(closedRange('2026-11-30','2026-12-02'),['2026-11-30','2026-12-01','2026-12-02'])
  assert.deepEqual(addClosedDays([{fecha:'2026-12-01',motivo:'Antes'}],'2026-11-30','2026-12-02','Vacaciones').map(x=>x.fecha),
    ['2026-11-30','2026-12-01','2026-12-02'])
  assert.throws(()=>closedRange('2026-02-29','2026-03-01'),/rango/)
})
