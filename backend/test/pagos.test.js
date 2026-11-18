// Contratos de HU-23/24 sin conexión a MongoDB ni pasarela externa.
const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const {z}=require('zod')
const mongoose=require('mongoose')
const source=fs.readFileSync(path.join(__dirname,'../src/controllers/pagos.controller.js'),'utf8')
const routes=fs.readFileSync(path.join(__dirname,'../src/routes/pagos.routes.js'),'utf8')
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8')
const UID='507f1f77bcf86cd799439011'
const PID='507f191e810c19729de860ea'
const OID='507f191e810c19729de860eb'
const PAY='507f191e810c19729de860ec'

function fixture({owned=true,patientActive=true,reported=true}={}){
  const calls={created:null,checked:null,updated:null,pagoQuery:null}
  const paciente={_id:PID,nutritionist:UID,name:'Paciente de prueba'}
  const pago={_id:PAY,estado:'reportado',montoCentavos:12000,moneda:'MXN'}
  const f={
    Paciente:{
      findOne(query){
        calls.checked=query
        return {select:()=>({lean:async()=>owned&&patientActive?paciente:null})}
      }
    },
    Pago:{
      async create(data){calls.created=data;return {...data,_id:PAY}},
      find(query){
        calls.pagoQuery=query
        return {select:()=>({sort:()=>({limit:()=>({lean:async()=>[pago]})})})}
      },
      findOneAndUpdate(query,update){
        calls.updated={query,update}
        return {select:()=>({lean:async()=>reported?{...pago,estado:update.$set.estado}:null})}
      },
    },
  }
  const deps={mongoose:{isValidObjectId:mongoose.isValidObjectId},zod:{z},
    '../models/Pacientes':f.Paciente,'../models/Pago':f.Pago}
  const context={module:{exports:{}},require(spec){assert.ok(spec in deps,'Unmocked '+spec);return deps[spec]},Date}
  vm.runInNewContext(source,context,{filename:'pagos.controller.js'})
  async function call(name,{role='patient',body={},id=PAY,pacienteId=PID}={}){
    const res={statusCode:200,body:null,headers:{},
      set(k,v){this.headers[k]=v;return this},
      status(v){this.statusCode=v;return this},json(x){this.body=x;return this}}
    let error
    const req={user:role==='patient'?{patient:PID}:{_id:UID},body,params:{id},query:{pacienteId}}
    await context.module.exports[name](req,res,e=>{error=e})
    if(error)throw error
    return res
  }
  return {call,calls}
}
const valido={monto:125.50,metodo:'transferencia',fechaPago:'2026-10-12',referencia:'TRANSF-123',concepto:'Consulta'}
test('HU-23/24 pacientes y nutriólogos tienen endpoints separados por rol',()=>{
  assert.match(routes,/router\.use\(requireAuth\)/)
  assert.match(routes,/router\.post\('\/mios',allowRoles\('patient'\),registrarMiPago\)/)
  assert.match(routes,/router\.get\('\/mios',allowRoles\('patient'\),listarMisPagos\)/)
  assert.match(routes,/router\.get\('\/consultorio',allowRoles\('nutritionist'\),listarPagosPaciente\)/)
  assert.match(routes,/router\.patch\('\/consultorio\/:id\/estado',allowRoles\('nutritionist'\),revisarPago\)/)
  assert.match(app,/app\.use\('\/api\/pagos', pagosRoutes\)/)
})
test('HU-23 sólo registra reporte pendiente, sin fingir cobro',async()=>{
  const f=fixture()
  const r=await f.call('registrarMiPago',{body:valido})
  assert.equal(r.statusCode,201)
  assert.equal(f.calls.created.montoCentavos,12550)
  assert.equal(f.calls.created.estado,'reportado')
  assert.equal(f.calls.created.moneda,'MXN')
  assert.equal(f.calls.created.paciente,PID)
  assert.match(r.body.message,/debe confirmar/)
})
test('HU-23 rechaza importes y fechas inválidas',async()=>{
  for(const body of [
    {...valido,monto:0},{...valido,monto:-3},{...valido,monto:3.999},
    {...valido,fechaPago:'2026-02-30'},{...valido,fechaPago:'2099-12-31'},
    {...valido,metodo:'tarjeta'},
  ]){
    const f=fixture()
    assert.equal((await f.call('registrarMiPago',{body})).statusCode,400)
    assert.equal(f.calls.created,null)
  }
})
test('HU-24 sólo devuelve los pagos del paciente autenticado',async()=>{
  const f=fixture()
  const r=await f.call('listarMisPagos')
  assert.equal(r.statusCode,200)
  assert.equal(r.body.pagos.length,1)
  assert.equal(f.calls.pagoQuery.paciente,PID)
  assert.equal(f.calls.pagoQuery.nutritionist,UID)
  assert.equal(r.headers['Cache-Control'],'no-store')
})
test('HU-24 niega acceso a expedientes de otra clínica',async()=>{
  const f=fixture({owned:false})
  assert.equal((await f.call('listarPagosPaciente',{role:'nutritionist'})).statusCode,404)
  const g=fixture()
  assert.equal((await g.call('listarPagosPaciente',{role:'nutritionist',pacienteId:'invalido'})).statusCode,400)
})
test('HU-23 nutriólogo confirma o rechaza una sola vez',async()=>{
  const f=fixture()
  const r=await f.call('revisarPago',{role:'nutritionist',body:{estado:'confirmado'}})
  assert.equal(r.statusCode,200)
  assert.equal(f.calls.updated.query.nutritionist,UID)
  assert.equal(f.calls.updated.query.estado,'reportado')
  assert.equal(f.calls.updated.update.$set.estado,'confirmado')
  const g=fixture({reported:false})
  assert.equal((await g.call('revisarPago',{role:'nutritionist',body:{estado:'rechazado'}})).statusCode,409)
  assert.equal((await g.call('revisarPago',{role:'nutritionist',body:{estado:'confirmado',extra:1}})).statusCode,400)
})
