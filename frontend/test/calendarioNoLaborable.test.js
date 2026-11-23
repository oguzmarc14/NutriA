import test from 'node:test'
import assert from 'node:assert/strict'
import {diaValido,moverPeriodo,diasVista,bloquearRango} from '../src/utils/calendarioNoLaborable.js'
test('dates render correctly in week and month modes and avoid invalid days',()=>{
  assert.deepEqual(diasVista('2026-11-22','Semana'),['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22'])
  assert.equal(diasVista('2026-11-22','Mes').length,42)
  assert.equal(moverPeriodo('2026-01-31','Mes',1),'2026-02-28')
  assert.equal(diaValido('2026-02-29'),false)
})
test('blocks ranges across months, deduplicates dates and limits 100 days',()=>{
  const rows=bloquearRango([{fecha:'2026-12-01',motivo:'antiguo'}],'2026-11-30','2026-12-02','Vacaciones')
  assert.deepEqual(rows.map(x=>x.fecha),['2026-11-30','2026-12-01','2026-12-02'])
  assert.ok(rows.every(x=>x.motivo==='Vacaciones'))
  assert.throws(()=>bloquearRango([],'2026-12-05','2026-12-01',''),/fechas/)
})
