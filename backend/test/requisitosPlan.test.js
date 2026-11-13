const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const {z} = require('zod')
const source = fs.readFileSync(path.join(__dirname,'../src/controllers/planAlimenticio.controller.js'),'utf8')
const PID='507f191e810c19729de860ea'
const UID='507f1f77bcf86cd799439011'
function fixture({expediente=true,medicion=true,pertenece=true}={}){
  const calls={created:0,expediente:null,medicion:null}
  const deps={
    mongoose:{Types:{ObjectId:{isValid:()=>true}}},
    zod:{z},
    '../models/PlanAlimenticio':{
      create:async plan=>{calls.created++;return {...plan,_id:'plan-nuevo'}},
    },
    '../models/ExpedienteClinico':{
      exists:async query=>{calls.expediente=query;return expediente?{_id:'registro'}:null},
    },
    '../models/Medicion':{
      exists:async query=>{calls.medicion=query;return medicion?{_id:'medicion'}:null},
    },
    '../models/Pacientes':{
      findOne:async query=>pertenece?{_id:query._id}:null,
    },
    '../models/Alimento':{},
    '../models/SeguimientoComida':{},
  }
  const mod={exports:{}}
  vm.runInNewContext(source,{
    require(name){if(!(name in deps))throw Error('Unexpected require: '+name);return deps[name]},
    module:mod,Date,Number,Promise,Set,
  },{filename:'planAlimenticio.controller.js'})
  const invoke=async()=>{
    let error=null
    const res={statusCode:200,body:null,status(n){this.statusCode=n;return this},
      json(data){this.body=data;return this}}
    const req={params:{pacienteId:PID},user:{id:UID},body:{
      nombre:'Dieta seguimiento',fechaInicio:'2026-11-14',comidas:[],
    }}
    await mod.exports.crearPlanAlimenticio(req,res,e=>error=e)
    if(error)throw error
    return res
  }
  return {invoke,calls}
}

test('crear dieta rechaza paciente sin expediente ni mediciones',async()=>{
  const f=fixture({expediente:false,medicion:false})
  const r=await f.invoke()
  assert.equal(r.statusCode,409)
  assert.deepEqual(JSON.parse(JSON.stringify(r.body.faltantes)),['expediente','mediciones'])
  assert.equal(f.calls.created,0)
})
test('solo falta expediente, el backend exige expediente del mismo nutriólogo',async()=>{
  const f=fixture({expediente:false,medicion:true})
  const r=await f.invoke()
  assert.equal(r.statusCode,409)
  assert.deepEqual(JSON.parse(JSON.stringify(r.body.faltantes)),['expediente'])
  assert.equal(String(f.calls.expediente.paciente),PID)
  assert.equal(String(f.calls.expediente.nutritionist),UID)
  assert.equal(f.calls.created,0)
})
test('solo faltan medidas, el backend exige valores básicos válidos',async()=>{
  const f=fixture({expediente:true,medicion:false})
  const r=await f.invoke()
  assert.equal(r.statusCode,409)
  assert.deepEqual(JSON.parse(JSON.stringify(r.body.faltantes)),['mediciones'])
  assert.deepEqual(Object.keys(f.calls.medicion).sort(),
    ['edad','estatura','nivelActividadFisica','nutritionist','paciente','peso'].sort())
  assert.equal(f.calls.created,0)
})
test('crear dieta funciona si existen expediente y medidas, con permiso de nutriólogo',async()=>{
  const f=fixture({expediente:true,medicion:true})
  const r=await f.invoke()
  assert.equal(r.statusCode,201)
  assert.equal(f.calls.created,1)
  assert.equal(r.body.plan.nombre,'Dieta seguimiento')
  const sinPermiso=fixture({pertenece:false})
  const res=await sinPermiso.invoke()
  assert.equal(res.statusCode,404)
  assert.equal(sinPermiso.calls.created,0)
})
