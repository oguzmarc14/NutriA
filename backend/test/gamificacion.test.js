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

test('HU-30: rachas de días reales, sin duplicados ni puntuar comidas', () => {
  const {calcularRachas} = require('../src/services/gamificacion.service')
  const registros=[
    registro('2026-11-06','', 'omitida'),
    registro('2026-11-07','', 'parcial'),
    registro('2026-11-08','', 'completada'),
    registro('2026-11-08','duplicado'),
    registro('2026-11-09','','omitida'),
  ]
  const resumen=construirReconocimientos(registros,hoy)
  assert.deepEqual(resumen.rachas,{actual:4,maxima:4,ultimoRegistro:'2026-11-09',registroHoy:false})
  assert.equal(resumen.reconocimientos.some(x=>x.id==='tres-dias-seguidos'),true)
  assert.equal(resumen.reconocimientos.some(x=>x.id==='siete-dias-seguidos'),false)
  assert.deepEqual(calcularRachas(['2026-11-08','2026-11-08'],hoy),{
    actual:0,maxima:1,ultimoRegistro:'2026-11-08',registroHoy:false,
  })
})
test('HU-30: racha pausada conserva récord y respeta cruces de mes/año',()=>{
  const {calcularRachas}=require('../src/services/gamificacion.service')
  const d=calcularRachas(['2025-12-30','2025-12-31','2026-01-01'],new Date('2026-01-05T08:00:00Z'))
  assert.equal(d.actual,0)
  assert.equal(d.maxima,3)
  assert.equal(d.ultimoRegistro,'2026-01-01')
  const b=calcularRachas(['2026-02-27','2026-02-28','2026-03-01'],new Date('2026-03-01T23:00:00Z'))
  assert.equal(b.actual,3)
  assert.equal(b.registroHoy,true)
  assert.equal(calcularRachas(['2026-11-11'],hoy).maxima,0)
})
test('HU-30: siete días consecutivos desbloquean reconocimiento y compartir',()=>{
  const registros=Array.from({length:7},(_,i)=>registro('2026-11-'+String(i+4).padStart(2,'0')))
  const resumen=construirReconocimientos(registros,hoy)
  assert.equal(resumen.rachas.actual,7)
  assert.equal(resumen.rachas.maxima,7)
  assert.ok(resumen.reconocimientos.some(x=>x.id==='siete-dias-seguidos'))
})
