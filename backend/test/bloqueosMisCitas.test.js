const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const { z }=require('zod')
const utils=require('../src/utils/agenda-publica.utils')
const {resumenCitasPaciente}=require('../src/utils/resumen-citas-paciente')
const ZONA='America/Mexico_City'
const ID='507f1f77bcf86cd799439011'
const PID='507f191e810c19729de860ea'
const JORNADA={configurado:true,dias:[0,1,2,3,4,5,6],inicio:'08:00',fin:'18:00',zonaHoraria:ZONA}
const CFG={configurado:true,publicado:true,anticipacionHoras:0,franjas:[{dia:4,inicio:'09:00',fin:'14:00'}]}

test('una hora semanal bloqueada desaparece de todos los calendarios sin quitar el resto',()=>{
  const horario={...CFG,bloqueos:[{dia:4,inicio:'11:00',fin:'12:00'}]}
  const fecha='2026-11-12'
  const slots=utils.construirDisponibilidad(fecha,horario,JORNADA,[],new Date('2026-11-10T12:00:00Z'))
  assert.deepEqual(slots.map(x=>x.hora),['09:00','10:00','12:00','13:00'])
  assert.equal(utils.horarioAdmite({...horario,zonaHoraria:ZONA},new Date('2026-11-12T17:00:00Z')),false)
  assert.equal(utils.horarioAdmite({...horario,zonaHoraria:ZONA},new Date('2026-11-12T18:00:00Z')),true)
})
test('una exclusión por fecha no elimina la misma hora de la semana siguiente',()=>{
  const horario={...CFG,bloqueosPorFecha:[{fecha:'2026-11-12',inicio:'10:30',fin:'11:30',motivo:'Compromiso'}]}
  const hoy=new Date('2026-11-10T12:00:00Z')
  assert.deepEqual(utils.construirDisponibilidad('2026-11-12',horario,JORNADA,[],hoy).map(x=>x.hora),['09:00','12:00','13:00'])
  assert.equal(utils.bloqueadoPorHorario({...horario,zonaHoraria:ZONA},new Date('2026-11-12T16:00:00Z')),true)
  assert.equal(utils.bloqueadoPorHorario({...horario,zonaHoraria:ZONA},new Date('2026-11-19T16:00:00Z')),false)
})
function fixtureHorario(){
  const handlers=new Map()
  let saved=null
  const user={horarioLaboral:JORNADA,horarioCitas:{...CFG,bloqueos:[{dia:4,inicio:'11:00',fin:'12:00'}],
    bloqueosPorFecha:[{fecha:'2027-03-15',inicio:'09:00',fin:'10:00',motivo:'Vacaciones'}]},
    async save(){saved=this.horarioCitas}}
  const deps={
    express:{Router:()=>({use(){},get(k,fn){handlers.set('GET '+k,fn)},put(k,fn){handlers.set('PUT '+k,fn)}})},
    zod:{z},
    '../models/User':{findById:()=>({select:()=>user})},
    '../middleware/auth.middleware':{requireAuth(){},allowRoles:()=>()=>{}},
    '../utils/agenda-publica.utils':utils,
    '../models/Cita':{},
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/routes/horario.routes.js'),'utf8'),{
    module:{exports:{}},require(module){if(!(module in deps))throw Error('unknown '+module);return deps[module]},
    Date,Number,Set,Intl,Array,
  },{filename:'horario.routes.js'})
  const send=async(body)=>{
    const req={user:{_id:ID},body}
    const res={statusCode:200,body:null,status(n){this.statusCode=n;return this},json(x){this.body=x;return this}}
    let error
    await handlers.get('PUT /citas')(req,res,e=>error=e)
    if(error)throw error
    return res
  }
  return {send,saved:()=>saved}
}
test('guardar bloques por fecha y bloqueos semanales con validación estricta',async()=>{
  const f=fixtureHorario()
  const r=await f.send({franjas:CFG.franjas,publicado:true,anticipacionHoras:0,
    bloqueos:[{dia:4,inicio:'11:00',fin:'12:00'}],
    bloqueosPorFecha:[{fecha:'2027-01-25',inicio:'09:00',fin:'10:00',motivo:'Cierre'}]})
  assert.equal(r.statusCode,200)
  assert.equal(f.saved().bloqueosPorFecha[0].fecha,'2027-01-25')
})
test('no acepta fechas imposibles, franjas inversas, traslapes ni campos no previstos',async()=>{
  const f=fixtureHorario()
  const base={franjas:CFG.franjas,publicado:false,anticipacionHoras:2}
  for(const value of [
    {...base,bloqueos:[{dia:4,inicio:'12:00',fin:'11:00'}]},
    {...base,bloqueos:[{dia:4,inicio:'10:00',fin:'11:00'}, {dia:4,inicio:'10:30',fin:'11:30'}]},
    {...base,bloqueosPorFecha:[{fecha:'2027-02-30',inicio:'09:00',fin:'10:00'}]},
    {...base,bloqueosPorFecha:[{fecha:'2027-04-05',inicio:'23:00',fin:'23:30'}]},
    {...base,bloqueos:[{dia:1,inicio:'09:00',fin:'10:00',isAdmin:true}]},
  ])assert.equal((await f.send(value)).statusCode,400)
})
test('clientes PWA anteriores no eliminan las excepciones al guardar agenda',async()=>{
  const f=fixtureHorario()
  const r=await f.send({franjas:CFG.franjas,publicado:true,anticipacionHoras:2})
  assert.equal(r.statusCode,200)
  assert.equal(f.saved().bloqueos[0].inicio,'11:00')
  assert.equal(f.saved().bloqueosPorFecha[0].fecha,'2027-03-15')
})
const fecha=(id,inicio,estado)=>({_id:id,inicio:new Date(inicio),estado,fin:new Date(new Date(inicio).getTime()+3600000),tipo:'seguimiento'})
test('paciente ve Mi próxima cita sólo cuando está confirmada',()=>{
  const now=new Date('2026-11-12T16:00:00Z')
  const ultima=fecha('old','2026-11-01T15:00:00Z','completada')
  const programada=fecha('next','2026-11-28T16:00:00Z','programada')
  const one=resumenCitasPaciente([ultima,programada],{},ZONA,now)
  assert.equal(one.proxima.estado,'programada')
  assert.equal(one.avisos[0].tipo,'programada')
  assert.equal(resumenCitasPaciente([ultima,{...programada,estado:'confirmada'}],{},ZONA,now).avisos[0].tipo,'confirmada')
})
test('un paciente sin próxima cita recibe seguimiento según ciclo del nutriólogo',()=>{
  const now=new Date('2026-11-26T16:00:00Z')
  const ultima=fecha('old','2026-11-01T15:00:00Z','completada')
  const r=resumenCitasPaciente([ultima],{activo:true,cicloDias:30,anticipacionDias:5},ZONA,now)
  assert.equal(r.avisos[0].tipo,'seguimiento')
  assert.equal(r.avisos[0].diasRestantes,5)
  assert.equal(r.avisos[0].fechaSugerida,'2026-12-01')
  assert.equal(resumenCitasPaciente([ultima],{activo:false,cicloDias:30,anticipacionDias:5},ZONA,now).avisos.length,0)
})
const controller=fs.readFileSync(path.join(__dirname,'../src/controllers/perfilPaciente.controller.js'),'utf8')
test('GET de mis citas usa exclusivamente paciente autenticado y no expone notas',async()=>{
  const old=fecha('old','2026-11-01T15:00:00Z','completada')
  const next=fecha('next','2026-12-01T16:00:00Z','confirmada')
  const queries=[]
  const deps={
    '../models/Pacientes':{findOne:(query)=>{
      queries.push(query)
      return {select:()=>({lean:async()=>({_id:PID,nutritionist:ID,active:true})})}
    }},
    '../models/ExpedienteClinico':{},
    '../models/Medicion':{},
    '../models/PlanAlimenticio':{},
    '../models/SeguimientoComida':{},
    '../models/Cita':{find:(query)=>{
      queries.push(query)
      return {select:(fields)=>{
        assert.equal(fields.includes('notas'),false)
        return {sort:()=>({limit:()=>({lean:async()=>[next,old]})})}
      }}
    }},
    '../models/User':{findById:()=>({select:()=>({lean:async()=>({
      name:'Nutrióloga',horarioLaboral:JORNADA,
      recordatoriosSeguimiento:{activo:true,cicloDias:30,anticipacionDias:5},
    })})})},
    '../utils/resumen-citas-paciente':{resumenCitasPaciente},
  }
  const mod={exports:{}}
  vm.runInNewContext(controller,{module:mod,Date,
    require(name){if(!(name in deps))throw Error('unknown '+name);return deps[name]}},
    {filename:'perfilPaciente.controller.js'})
  let body,headers={}
  await mod.exports.obtenerMisCitas({user:{patient:PID}},{
    set(k,v){headers[k]=v;return this},
    json(data){body=data;return this},
  },error=>{throw error})
  assert.equal(String(queries[0]._id),PID)
  assert.equal(String(queries[1].patient),PID)
  assert.equal(String(queries[1].nutritionist),ID)
  assert.equal(body.citas.length,2)
  assert.equal(body.proxima.estado,'confirmada')
  assert.equal(JSON.stringify(body).includes('notas'),false)
  assert.equal(headers['Cache-Control'],'no-store')
})
