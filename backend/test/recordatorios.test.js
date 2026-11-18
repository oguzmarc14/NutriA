const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { fechaLocal, diaSiguiente, debeRecordarse } = require('../src/utils/recordatorios.utils')

test('el día siguiente se calcula sin perder fechas en fin de mes o año', () => {
  assert.equal(diaSiguiente('2026-12-31'), '2027-01-01')
  assert.equal(diaSiguiente('2024-02-28'), '2024-02-29')
})
test('el recordatorio usa la fecha de consulta en la zona local', () => {
  const ahora = new Date('2026-11-18T06:17:00Z')
  assert.equal(fechaLocal(ahora, 'America/Mexico_City'), '2026-11-18')
  assert.equal(debeRecordarse({
    inicio: '2026-11-19T20:00:00Z', zonaHoraria: 'America/Mexico_City',
  }, ahora), true)
  assert.equal(debeRecordarse({
    inicio: '2026-11-20T20:00:00Z', zonaHoraria: 'America/Mexico_City',
  }, ahora), false)
})
test('citas del mismo día nuevas reciben aviso sólo si faltan al menos dos horas', () => {
  const ahora = new Date('2026-11-18T06:17:00Z')
  assert.equal(debeRecordarse({
    inicio: '2026-11-18T15:00:00Z', zonaHoraria: 'America/Mexico_City',
  }, ahora), true)
  assert.equal(debeRecordarse({
    inicio: '2026-11-18T07:00:00Z', zonaHoraria: 'America/Mexico_City',
  }, ahora), false)
})
test('no se recuerdan citas vencidas ni zonas horarias inválidas', () => {
  const ahora = new Date('2026-11-18T06:17:00Z')
  for (const cita of [
    {inicio:'2026-11-18T02:00:00Z',zonaHoraria:'America/Mexico_City'},
    {inicio:'2026-11-19T15:00:00Z',zonaHoraria:'Zona/Invalida'},
    {inicio:'fecha invalida',zonaHoraria:'America/Mexico_City'},
  ]) assert.equal(debeRecordarse(cita, ahora), false)
})
test('el endpoint exige secreto, evita correos duplicados y sólo consulta citas futuras', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/recordatorios.routes.js'), 'utf8')
  const handlers = new Map()
  let enviado = 0
  let consultas = 0
  const ahora = new Date()
  const mañana = new Date(ahora.getTime() + 30 * 3600000)
  const cita = {_id:'id',inicio:mañana,zonaHoraria:'America/Mexico_City',
    patient:{name:'Paciente',email:'paciente@example.com',active:true}}
  const Cita = {
    find(query) {
      consultas++
      assert.ok(query.inicio.$gt instanceof Date)
      assert.ok(query.inicio.$lt instanceof Date)
      assert.equal(query.recordatorio24hEnviado, null)
      return {sort:()=>({populate:()=>({limit:async()=>[cita]})})}
    },
    findOneAndUpdate:async query=>{
      assert.equal(query.recordatorio24hEnviado, null)
      return cita
    },
    updateOne:async()=>({}),
  }
  const deps={
    express:{Router:()=>({post:(path,handler)=>handlers.set(path,handler)})},
    crypto:require('node:crypto'),
    '../models/Cita':Cita,
    '../services/gmail.service':{enviarCorreoGmail:async()=>{enviado++}},
    '../utils/recordatorios.utils':{debeRecordarse:()=>true},
  }
  const context={
    module:{exports:{}},process:{env:{CRON_SECRET:'secreto-de-prueba'}},Date,Buffer,Intl,
    require:s=>{assert.ok(s in deps,'Dependencia '+s);return deps[s]},console:{error(){}},
  }
  vm.runInNewContext(source,context)
  const handler=handlers.get('/procesar')
  assert.equal(typeof handler,'function')
  const res=()=>({statusCode:200,body:null,headers:{},
    set(k,v){this.headers[k]=v;return this},status(n){this.statusCode=n;return this},
    json(d){this.body=d;return this}})
  const invalid=res()
  await handler({headers:{'x-cron-secret':'incorrecto'}},invalid,e=>{throw e})
  assert.equal(invalid.statusCode,401)
  assert.equal(consultas,0)
  const valid=res()
  await handler({headers:{'x-cron-secret':'secreto-de-prueba'}},valid,e=>{throw e})
  assert.equal(valid.statusCode,200)
  assert.equal(valid.body.enviados,1)
  assert.equal(valid.body.evaluados,1)
  assert.equal(enviado,1)
  assert.equal(valid.headers['Cache-Control'],'no-store')
})
