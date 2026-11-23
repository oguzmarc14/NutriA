const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const {z}=require('zod')
const utilities=require('../src/utils/agenda-publica.utils')
const source=fs.readFileSync(path.join(__dirname,'../src/routes/horario.routes.js'),'utf8')
const UID='507f1f77bcf86cd799439011'
const base={
  dias:[1,2,3,4,5],inicio:'09:00',fin:'18:00',
  zonaHoraria:'America/Mexico_City',
}
function setup(){
  const handlers=new Map()
  let modified=null
  const deps={
    express:{Router:()=>({
      use(){},
      get:(name,fn)=>handlers.set('GET '+name,fn),
      put:(name,fn)=>handlers.set('PUT '+name,fn),
    })},
    zod:{z},
    '../models/User':{
      findById:()=>({select:()=>({lean:async()=>({horarioLaboral:base, horarioCitas:{franjas:[]}})})}),
      findOneAndUpdate:(_filter,update)=> {
        modified=update
        return {select:async()=>({horarioLaboral:{
          ...base,diasNoLaborables:update.$set['horarioLaboral.diasNoLaborables']||[],
        }})}
      },
    },
    '../models/Cita':{},
    '../middleware/auth.middleware':{requireAuth(){},allowRoles:()=>()=>{}},
    '../utils/agenda-publica.utils':utilities,
  }
  vm.runInNewContext(source,{
    require(name){if(!(name in deps)) throw Error('Unexpected import '+name);return deps[name]},
    module:{exports:{}},Date,Number,Intl,Set,
  },{filename:'horario.routes.js'})
  async function save(payload){
    const req={user:{_id:UID},body:payload}
    const res={statusCode:200,body:null,
      status(value){this.statusCode=value;return this},
      json(data){this.body=data;return this},
    }
    let error=null
    await handlers.get('PUT /')(req,res,e=>{error=e})
    if(error)throw error
    return res
  }
  return {save,getUpdate:()=>modified}
}

test('guarda festivos y vacaciones con fecha y motivo válidos',async()=>{
  const a=setup()
  const res=await a.save({...base,diasNoLaborables:[
    {fecha:'2027-03-15',motivo:'Vacaciones'},
    {fecha:'2027-05-01',motivo:'Día festivo'},
  ]})
  assert.equal(res.statusCode,200)
  assert.equal(a.getUpdate().$set['horarioLaboral.diasNoLaborables'].length,2)
  assert.equal(a.getUpdate().$set['horarioLaboral.configurado'],true)
})
test('clientes PWA anteriores no eliminan excepciones al guardar su jornada',async()=>{
  const a=setup()
  const res=await a.save(base)
  assert.equal(res.statusCode,200)
  assert.equal(Object.hasOwn(a.getUpdate().$set,'horarioLaboral.diasNoLaborables'),false)
})
test('no permite fechas repetidas, inválidas o más de cien',async()=>{
  const a=setup()
  const dosIguales=[{fecha:'2027-05-01',motivo:'Descanso'},{fecha:'2027-05-01',motivo:'Otro'}]
  assert.equal((await a.save({...base,diasNoLaborables:dosIguales})).statusCode,400)
  assert.equal((await a.save({...base,diasNoLaborables:[{fecha:'2027-02-30',motivo:'Fecha inválida'}]})).statusCode,400)
  const demasiadas=Array.from({length:101},(_,i)=>({
    fecha:utilities.sumarDias('2027-01-01',i),motivo:'Cierre',
  }))
  assert.equal((await a.save({...base,diasNoLaborables:demasiadas})).statusCode,400)
})

test('agregar sábado y domingo reconfigura bloques conservando las horas explícitas', () => {
  const { ajustarBloquesAJornada, construirDisponibilidad } = utilities
  const anterior = { ...base, configurado: true }
  const jornada = { ...anterior, dias: [0, 1, 6] }
  const franjas = ajustarBloquesAJornada(anterior, jornada, { franjas: [
    { dia: 1, inicio: '10:00', fin: '12:00' },
    { dia: 2, inicio: '09:00', fin: '18:00' },
  ] })
  assert.deepEqual(franjas.map(f => f.dia), [0, 1, 6])
  assert.deepEqual(franjas[1], { dia: 1, inicio: '10:00', fin: '12:00' })
  const agenda = { configurado: true, franjas, anticipacionHoras: 0 }
  const ahora = new Date('2026-11-22T16:00:00Z')
  assert.equal(construirDisponibilidad('2026-11-28', agenda, jornada, [], ahora)[0].hora, '09:00')
  assert.equal(construirDisponibilidad('2026-11-29', agenda, jornada, [], ahora)[0].hora, '09:00')
  assert.equal(construirDisponibilidad('2026-11-27', agenda, jornada, [], ahora).length, 0)
})
