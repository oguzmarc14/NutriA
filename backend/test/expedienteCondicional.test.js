const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { z } = require('zod')
const Expediente = require('../src/models/ExpedienteClinico')

const source = fs.readFileSync(path.join(__dirname,'../src/controllers/expedienteClinico.controller.js'),'utf8')
const PACIENTE='507f191e810c19729de860ea'
const NUTRIOLOGO='507f1f77bcf86cd799439011'
function fixture() {
  let guardado
  const paciente={_id:PACIENTE}
  const deps={
    zod:{z},
    '../models/ExpedienteClinico':{
      findOneAndUpdate:async(filtro,body,opciones)=>{
        assert.equal(filtro.nutritionist,NUTRIOLOGO)
        assert.equal(opciones.runValidators,true)
        guardado=body
        return body
      },
    },
    '../models/Pacientes':{findOne:async()=>paciente},
    '../models/Medicion':{},
  }
  const mod={exports:{}}
  vm.runInNewContext(source,{
    require(nombre){if(!(nombre in deps))throw Error('Import inesperado '+nombre);return deps[nombre]},
    module:mod,Number,Set,
  },{filename:'expedienteClinico.controller.js'})
  const send=async(body)=>{
    const req={user:{id:NUTRIOLOGO},params:{pacienteId:PACIENTE},body}
    const res={statusCode:200,body:null,status(n){this.statusCode=n;return this},
      json(obj){this.body=obj;return this}}
    await mod.exports.guardarExpediente(req,res,e=>{throw e})
    return res
  }
  return {send,getGuardado:()=>guardado}
}

test('acepta Sí sin descripción como estado explícito del campo',async()=>{
  const f=fixture()
  const r=await f.send({camposConDetalle:['alergias','nutricion.comidaFavorita'],
    alergias:'',nutricion:{comidaFavorita:''}})
  assert.equal(r.statusCode,200)
  assert.deepEqual(JSON.parse(JSON.stringify(f.getGuardado().camposConDetalle)),
    ['alergias','nutricion.comidaFavorita'])
})

test('no rechaza expedientes anteriores que no enviaban indicadores Sí/No',async()=>{
  const f=fixture()
  const r=await f.send({alergias:'Penicilina',nutricion:{numeroComidasDia:4,
    primeraComida:'08:00',ultimaComida:'20:00'}})
  assert.equal(r.statusCode,200)
  assert.equal(f.getGuardado().camposConDetalle,undefined)
  assert.equal(f.getGuardado().nutricion.numeroComidasDia,4)
})

test('rechaza nombres inventados, repetidos o más campos de lo permitido',async()=>{
  const f=fixture()
  for(const campos of [['usuario.admin'],['alergias','alergias'],
    Array.from({length:17},()=> 'alergias')]) {
    const r=await f.send({camposConDetalle:campos})
    assert.equal(r.statusCode,400)
  }
})

test('el modelo mongoose conserva estados de texto aun sin detalle',()=>{
  const doc=new Expediente({paciente:PACIENTE,nutritionist:NUTRIOLOGO,
    camposConDetalle:['antecedentesFamiliares','observaciones']})
  assert.equal(doc.validateSync(),undefined)
  assert.deepEqual([...doc.camposConDetalle],['antecedentesFamiliares','observaciones'])
  const invalid=new Expediente({paciente:PACIENTE,nutritionist:NUTRIOLOGO,
    camposConDetalle:['campoSecreto']})
  assert.ok(invalid.validateSync())
})
