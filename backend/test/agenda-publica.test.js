const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const utils = require('../src/utils/agenda-publica.utils')
const ZONA = 'America/Mexico_City'
const JORNADA = { configurado:true, dias:[0,1,2,3,4,5,6],inicio:'08:00',fin:'18:00',zonaHoraria:ZONA }
const CONFIG = { configurado:true,publicado:true,anticipacionHoras:0,
  franjas:[{dia:4,inicio:'09:00',fin:'13:00'},{dia:4,inicio:'16:00',fin:'18:00'}] }

test('horario local del consultorio se convierte a UTC sin cambiar día y hora',()=>{
  const instant=utils.horaLocalAUTC('2026-11-12','09:00',ZONA)
  assert.equal(instant.toISOString(),'2026-11-12T15:00:00.000Z')
  assert.equal(utils.partesLocales(instant,ZONA).hora,'09:00')
  assert.equal(utils.partesLocales(instant,ZONA).fecha,'2026-11-12')
})
test('solo devuelve franjas de citas: fuera de ellas y los descansos se ocultan',()=>{
  const available=utils.construirDisponibilidad('2026-11-12',CONFIG,JORNADA,[],new Date('2026-11-10T12:00:00Z'))
  assert.deepEqual(available.map(x=>x.hora),['09:00','10:00','11:00','12:00','16:00','17:00'])
  assert.deepEqual(utils.construirDisponibilidad('2026-11-13',CONFIG,JORNADA,[],new Date('2026-11-10T12:00:00Z')),[])
})
test('un espacio ya ocupado se excluye del calendario público',()=>{
  const ocupado={inicio:'2026-11-12T16:00:00.000Z',fin:'2026-11-12T17:00:00.000Z'}
  const slots=utils.construirDisponibilidad('2026-11-12',CONFIG,JORNADA,[ocupado],new Date('2026-11-10T12:00:00Z'))
  assert.deepEqual(slots.map(x=>x.hora),['09:00','11:00','12:00','16:00','17:00'])
})
test('la jornada laboral limita los bloques incluso si existía una configuración antigua',()=>{
  const reducida={...JORNADA,fin:'12:00',dias:[1,2,3,4,5]}
  const slots=utils.construirDisponibilidad('2026-11-12',CONFIG,reducida,[],new Date('2026-11-10T12:00:00Z'))
  assert.deepEqual(slots.map(x=>x.hora),['09:00','10:00','11:00'])
  assert.equal(utils.franjaDentroHorario(CONFIG.franjas,reducida),false)
})
test('bloquea citas cercanas según la anticipación mínima',()=>{
  const config={...CONFIG,anticipacionHoras:2}
  const slots=utils.construirDisponibilidad('2026-11-12',config,JORNADA,[],new Date('2026-11-12T14:00:00Z'))
  assert.equal(slots.some(x=>x.hora==='09:00'),false)
  assert.equal(slots.some(x=>x.hora==='11:00'),true)
})
test('UTC local inexistente en cambio de horario de verano no se ofrece',()=>{
  assert.equal(utils.horaLocalAUTC('2026-03-08','02:30','America/New_York'),null)
})

const source = fs.readFileSync(path.join(__dirname,'../src/routes/agendaPublica.routes.js'),'utf8')
const ID='507f1f77bcf86cd799439011'
function publicApi({publicado=true,booked=[]}={}) {
  const handlers=new Map()
  const user={_id:ID,name:'Nutriólogo Demo',role:'nutritionist',active:true,
    email:'privado@ejemplo.invalid',clinica:{nombre:'Consultorio NutriA',nombreProfesional:'Profesional Demo'},
    horarioLaboral:JORNADA,horarioCitas:{...CONFIG,publicado}}
  const requireFake=(spec)=>{
    if(spec==='express')return {Router:()=>({get:(p,fn)=>handlers.set('GET '+p,fn)})}
    if(spec==='mongoose')return {isValidObjectId:()=>true}
    if(spec==='../models/User')return {findOne:()=>({select:()=>({lean:async()=>user})})}
    if(spec==='../models/Cita')return {find:()=>({select:()=>({lean:async()=>booked})})}
    if(spec==='../utils/agenda-publica.utils')return utils
    throw Error('unexpected import '+spec)
  }
  const env={require:requireFake,module:{exports:{}},Date,Number,String,Intl}
  vm.runInNewContext(source,env,{filename:'agendaPublica.routes.js'})
  return async (query={})=>{
    const req={params:{nutritionistId:ID},query}
    const res={
      statusCode:200,body:null,headers:{},
      set(k,v){this.headers[k]=v;return this},
      status(c){this.statusCode=c;return this},
      json(b){this.body=b;return this},
    }
    let error
    await handlers.get('GET /:nutritionistId')(req,res,e=>{error=e})
    if(error)throw error
    return res
  }
}
test('calendario no publicado devuelve 404 sin filtrar información personal',async()=>{
  const result=await publicApi({publicado:false})()
  assert.equal(result.statusCode,404)
  assert.equal(result.body.clinica,undefined)
})
test('calendario publicado muestra sólo horas libres y nombre profesional',async()=>{
  const hoy=utils.fechaLocalAhora(ZONA)
  const desde=utils.sumarDias(hoy,3)
  const result=await publicApi()({desde,dias:2})
  assert.equal(result.statusCode,200)
  assert.equal(result.headers['Cache-Control'],'no-store')
  assert.equal(result.body.profesional,'Profesional Demo')
  assert.ok(Array.isArray(result.body.dias))
  const serialized=JSON.stringify(result.body)
  assert.equal(serialized.includes('privado@ejemplo.invalid'),false)
  assert.equal(serialized.includes('patient'),false)
  assert.equal(serialized.includes('calendarEventId'),false)
})
test('parámetros abusivos o fechas inválidas no generan consultas ilimitadas',async()=>{
  const query=publicApi()
  assert.equal((await query({dias:1000})).statusCode,400)
  assert.equal((await query({desde:'2026-99-99'})).statusCode,400)
})
