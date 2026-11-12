const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { z } = require('zod')
const utils = require('../src/utils/agenda-publica.utils')

const code = fs.readFileSync(path.join(__dirname,'../src/routes/horario.routes.js'),'utf8')
const ID = '507f1f77bcf86cd799439011'
const zone = 'America/Mexico_City'
const hoy = utils.fechaLocalAhora(zone)

function requestPrivado() {
  const handlers = new Map()
  const horario = {
    configurado:true, zonaHoraria:zone, inicio:'08:00',fin:'18:00',
    dias:[0,1,2,3,4,5,6],
  }
  const schedule = {
    configurado:true,anticipacionHoras:0,
    franjas:[{dia:0,inicio:'09:00',fin:'10:00'},
      {dia:1,inicio:'09:00',fin:'10:00'},
      {dia:2,inicio:'09:00',fin:'10:00'},
      {dia:3,inicio:'09:00',fin:'10:00'},
      {dia:4,inicio:'09:00',fin:'10:00'},
      {dia:5,inicio:'09:00',fin:'10:00'},
      {dia:6,inicio:'09:00',fin:'10:00'}],
  }
  const deps = {
    express: { Router:() => ({
      use() {},
      get(route,callback){handlers.set('GET '+route,callback)},
      put(route,callback){handlers.set('PUT '+route,callback)},
    }) },
    zod:{z},
    '../models/User':{
      findById:()=>({
        select:()=>({lean:async()=>({horarioCitas:schedule,horarioLaboral:horario})}),
      }),
    },
    '../middleware/auth.middleware':{requireAuth(){},allowRoles:()=>()=>{}},
    '../utils/agenda-publica.utils':utils,
    '../models/Cita':{find:()=>({select:()=>({lean:async()=>[]})})},
  }
  const context = {
    require(module){if(!(module in deps))throw Error('Dependencia inesperada '+module);return deps[module]},
    module:{exports:{}},Date,Number,Array,String,Intl,
  }
  vm.runInNewContext(code,context,{filename:'horario.routes.js'})
  return async (params) => {
    const fn=handlers.get('GET /disponibilidad')
    assert.equal(typeof fn,'function')
    const req={user:{_id:ID},query:params}
    const res={
      statusCode:200,body:null,
      status(n){this.statusCode=n;return this},
      json(v){this.body=v;return this},
    }
    let error
    await fn(req,res,e=>{error=e})
    if(error)throw error
    return res
  }
}

test('Día, Semana y Mes se consultan en backend sin superar 42 días',async()=>{
  const get=requestPrivado()
  for(const length of [1,7,42]){
    const res=await get({desde:hoy,dias:length})
    assert.equal(res.statusCode,200)
    assert.equal(res.body.dias.length,length)
    assert.equal(res.body.hoy,hoy)
    assert.equal(res.body.zonaHoraria,zone)
  }
})
test('rechaza rangos ilimitados y fechas muy alejadas',async()=>{
  const get=requestPrivado()
  assert.equal((await get({desde:hoy,dias:43})).statusCode,400)
  assert.equal((await get({desde:hoy,dias:0})).statusCode,400)
  assert.equal((await get({desde:'2026-99-77',dias:7})).statusCode,400)
  assert.equal((await get({desde:utils.sumarDias(hoy,181),dias:1})).statusCode,400)
  assert.equal((await get({desde:utils.sumarDias(hoy,-42),dias:1})).statusCode,400)
  assert.equal((await get({desde:utils.sumarDias(hoy,180),dias:1})).statusCode,200)
})
test('permite mostrar semanas al principio del mes, sin ofrecer citas pasadas',async()=>{
  const get=requestPrivado()
  const res=await get({desde:utils.sumarDias(hoy,-29),dias:42})
  assert.equal(res.statusCode,200)
  const anteriores=res.body.dias.filter(d=>d.fecha<hoy)
  assert.ok(anteriores.length>0)
  assert.ok(anteriores.every(d=>d.espacios.length===0))
})
