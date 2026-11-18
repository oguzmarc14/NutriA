// HU-22 — contrato de cancelación: cliente sólo modifica sus citas futuras.
// Pruebas sin MongoDB ni servicios externos, aislando el controlador real.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/controllers/cancelarCitaPaciente.controller.js'),'utf8')
const ruta = fs.readFileSync(path.join(__dirname, '../src/routes/perfilPaciente.routes.js'),'utf8')
const PID='507f191e810c19729de860ea'
const NID='507f1f77bcf86cd799439011'
const AID='507f191e810c19729de860eb'
const OID='507f191e810c19729de860ec'
const fecha=(dias=3)=>new Date(Date.now()+dias*86400000)

function fixture({id=AID,estado='confirmada',inicio=fecha(),pacienteId=PID,
  existePaciente=true,existeCita=true,calendarSync=true,calendarError=null,conEvento=true}={}) {
  const calls={calendar:0,saved:0,scoped:false,patientQuery:null}
  const cita={
    _id:AID,patient:PID,nutritionist:NID,estado,inicio,
    calendarEventId:conEvento?'calendar-event':null,
    recordatorio24hEnviado:fecha(-1),recordatorio2hEnviado:fecha(-1),
    async save(){calls.saved++},
  }
  const patient={_id:PID,nutritionist:NID}
  const deps={
    mongoose:{isValidObjectId:x=>/^[a-f0-9]{24}$/i.test(x)},
    '../models/Pacientes':{findOne(query) {
      calls.patientQuery=query
      return {select:()=>({lean:async()=>existePaciente?patient:null})}
    }},
    '../models/Cita':{findOne(query) {
      calls.scoped=query._id===id&&query.patient===PID&&query.nutritionist===NID
      return {select:async()=>existeCita?cita:null}
    }},
    '../services/calendar.service':{async deleteAppointment(){
      calls.calendar++
      if(calendarError)throw calendarError
      return calendarSync
    }},
  }
  const sandbox={
    module:{exports:{}},console:{error(){}},Date,
    require(name){assert.ok(name in deps,'Unmocked: '+name);return deps[name]},
  }
  vm.runInNewContext(source,sandbox,{filename:'cancelarCitaPaciente.controller.js'})
  let errorCapturado
  const res={
    statusCode:200,body:null,headers:{},
    set(k,v){this.headers[k]=v;return this},
    status(value){this.statusCode=value;return this},
    json(value){this.body=value;return this},
  }
  async function invoke() {
    await sandbox.module.exports.cancelarMiCita(
      {params:{id},user:{patient:pacienteId}},res,e=>{errorCapturado=e})
    if(errorCapturado)throw errorCapturado
    return res
  }
  return {invoke,calls,cita,res}
}

test('HU-22 expone ruta PATCH protegida por autenticación y rol paciente',()=>{
  assert.match(ruta,/router\.use\(requireAuth\)/)
  assert.match(ruta,/router\.use\(allowRoles\('patient'\)\)/)
  assert.match(ruta,/router\.patch\('\/citas\/:id\/cancelar', cancelarMiCita\)/)
})
test('HU-22 cancela la cita futura del paciente y conserva el registro',async()=>{
  const f=fixture()
  const r=await f.invoke()
  assert.equal(r.statusCode,200)
  assert.equal(r.body.cita.estado,'cancelada')
  assert.equal(f.cita.estado,'cancelada')
  assert.equal(f.cita.calendarEventId,null)
  assert.equal(f.cita.recordatorio24hEnviado,null)
  assert.equal(f.cita.recordatorio2hEnviado,null)
  assert.equal(f.calls.saved,1)
  assert.equal(f.calls.calendar,1)
  assert.equal(f.calls.scoped,true)
  assert.equal(r.headers['Cache-Control'],'no-store')
})
test('HU-22 valida el ID y cuenta del paciente',async()=>{
  for(const value of ['invalido','']) {
    const f=fixture({id:value});assert.equal((await f.invoke()).statusCode,400);assert.equal(f.calls.calendar,0)
  }
  const sinCuenta=fixture({pacienteId:null})
  assert.equal((await sinCuenta.invoke()).statusCode,404)
  assert.equal(sinCuenta.calls.calendar,0)
  const eliminado=fixture({existePaciente:false})
  assert.equal((await eliminado.invoke()).statusCode,404)
  assert.equal(eliminado.calls.calendar,0)
  const ajena=fixture({existeCita:false,id:OID})
  assert.equal((await ajena.invoke()).statusCode,404)
  assert.equal(ajena.calls.calendar,0)
})
test('HU-22 impide cancelar citas realizadas o anteriores',async()=>{
  for(const estado of ['cancelada','completada']) {
    const f=fixture({estado})
    assert.equal((await f.invoke()).statusCode,409)
    assert.equal(f.calls.saved,0)
    assert.equal(f.calls.calendar,0)
  }
  const anterior=fixture({inicio:fecha(-1)})
  assert.equal((await anterior.invoke()).statusCode,409)
  assert.equal(anterior.calls.saved,0)
  assert.equal(anterior.calls.calendar,0)
})
test('HU-22 no cancela en NutriA si Google Calendar no puede sincronizarse',async()=>{
  const f=fixture({calendarSync:false})
  const r=await f.invoke()
  assert.equal(r.statusCode,409)
  assert.equal(f.calls.saved,0)
  assert.equal(f.cita.estado,'confirmada')
  assert.equal(f.calls.calendar,1)
  const g=fixture({calendarError:new Error('Calendar 500')})
  assert.equal((await g.invoke()).statusCode,502)
  assert.equal(g.calls.saved,0)
  assert.equal(g.cita.estado,'confirmada')
})
test('HU-22 no depende de evento de Calendar si la cita nunca tuvo uno',async()=>{
  const f=fixture({conEvento:false})
  const r=await f.invoke()
  assert.equal(r.statusCode,200)
  assert.equal(f.calls.saved,1)
})
