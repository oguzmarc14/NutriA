const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const {z}=require('zod')
const horarioSource=fs.readFileSync(path.join(__dirname,'../src/routes/horario.routes.js'),'utf8')
const pacientesSource=fs.readFileSync(path.join(__dirname,'../src/controllers/pacientes.controller.js'),'utf8')
const utils=require('../src/utils/agenda-publica.utils')
const ID='507f1f77bcf86cd799439011'
const PID='507f191e810c19729de860ea'

function rutas(){
  const handlers=new Map()
  let changes=null
  const user={
    horarioLaboral:{zonaHoraria:'America/Mexico_City'},
    recordatoriosSeguimiento:undefined,
  }
  const deps={
    express:{Router:()=>({
      use(){},
      get:(name,fn)=>handlers.set('GET '+name,fn),
      put:(name,fn)=>handlers.set('PUT '+name,fn),
    })},
    zod:{z},
    '../models/User':{
      findById:()=>({select:()=>({lean:async()=>user})}),
      findByIdAndUpdate:(_id,update)=>{changes=update;return {
        select:async()=>({recordatoriosSeguimiento:update.$set.recordatoriosSeguimiento}),
      }},
    },
    '../middleware/auth.middleware':{requireAuth(){},allowRoles:()=>()=>{}},
    '../models/Cita':{},
    '../utils/agenda-publica.utils':utils,
  }
  vm.runInNewContext(horarioSource,{
    require(name){if(!(name in deps))throw Error('Import inesperado '+name);return deps[name]},
    module:{exports:{}},Date,Number,Intl,Set,
  },{filename:'horario.routes.js'})
  const invoke=async(method,body={})=>{
    const req={user:{_id:ID},body}
    const res={statusCode:200,body:null,headers:{},
      set(k,v){this.headers[k]=v;return this},
      status(v){this.statusCode=v;return this},
      json(v){this.body=v;return this},
    }
    let error
    await handlers.get(method+' /seguimiento')(req,res,e=>error=e)
    if(error)throw error
    return res
  }
  return {invoke,changes:()=>changes}
}

test('preferencias por defecto de seguimiento son privadas y no cacheables',async()=>{
  const r=await rutas().invoke('GET')
  assert.equal(r.statusCode,200)
  assert.deepEqual(JSON.parse(JSON.stringify(r.body.configuracion)),
    {activo:true,cicloDias:30,anticipacionDias:5})
  assert.match(r.body.hoy,/^\d{4}-\d{2}-\d{2}$/)
  assert.equal(r.headers['Cache-Control'],'no-store')
})
test('se pueden configurar ciclos de 15 y 30 días con antelación variable',async()=>{
  const r=rutas()
  const ok=await r.invoke('PUT',{activo:true,cicloDias:15,anticipacionDias:3})
  assert.equal(ok.statusCode,200)
  assert.equal(r.changes().$set.recordatoriosSeguimiento.cicloDias,15)
  assert.equal((await r.invoke('PUT',{activo:false,cicloDias:30,anticipacionDias:5})).statusCode,200)
})
test('rechaza configuración abusiva y propiedades extra',async()=>{
  const r=rutas()
  for(const values of [
    {activo:true,cicloDias:5,anticipacionDias:1},
    {activo:true,cicloDias:15,anticipacionDias:20},
    {activo:true,cicloDias:30,anticipacionDias:31},
    {activo:true,cicloDias:30,anticipacionDias:5,admin:true},
  ])assert.equal((await r.invoke('PUT',values)).statusCode,400)
})
test('listado de pacientes incluye última completada y siguiente activa, no datos extra',async()=>{
  const deps={
    zod:{z},crypto:require('node:crypto'),
    '../models/Pacientes':{find:()=>({sort:()=>({lean:async()=>[{_id:PID,name:'Juan'}]})})},
    '../models/Medicion':{findOne:()=>({sort:()=>({select:()=>({lean:async()=>null})})})},
    '../models/ExpedienteClinico':{find:()=>({select:()=>({lean:async()=>[]})})},
    '../models/PlanAlimenticio':{distinct:async()=>[]},
    '../models/Cita':{aggregate:async pipeline=>{
      const match=pipeline[0].$match
      assert.equal(String(match.nutritionist),ID)
      assert.equal(match.$or[0].estado,'completada')
      assert.deepEqual(JSON.parse(JSON.stringify(match.$or[1].estado.$in)),['programada','confirmada'])
      return [{
        _id:PID,ultimaConsulta:new Date('2026-11-01T15:00:00Z'),
        proximaConsulta:new Date('2026-12-15T17:00:00Z'),
      }]
    }},
    '../models/User':{find:()=>({select:()=>({lean:async()=>[]})})},
    mongoose:{Types:{ObjectId:class{constructor(id){this.id=id}toString(){return this.id}}}},
    '../services/email.service':{enviarInvitacionPaciente:async()=>{}},
  }
  const module={exports:{}}
  vm.runInNewContext(pacientesSource,{
    require(name){if(!(name in deps))throw Error('Import inesperado '+name);return deps[name]},
    module,Date,Number,Intl,Promise,Set,Map,String,
  },{filename:'pacientes.controller.js'})
  let result
  await module.exports.obtenerPacientes({user:{id:ID}},{
    json(value){result=value;return this},
  },error=>{throw error})
  const p=result.pacientes[0]
  assert.equal(p.ultimaConsulta.inicio.toISOString(),'2026-11-01T15:00:00.000Z')
  assert.equal(p.proximaConsulta.inicio.toISOString(),'2026-12-15T17:00:00.000Z')
  assert.equal(p.tienePlan,false)
})
