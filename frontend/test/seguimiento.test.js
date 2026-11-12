import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { avisoProximoSeguimiento, fechaEnZona, sumarDiasFecha } from '../src/utils/seguimientoConsultas.js'
import { obtenerAvisosPaciente } from '../src/utils/avisosPacientes.js'
import { reunirAvisos } from '../src/utils/centroAvisos.js'
const perfil=readFileSync(new URL('../src/pages/EditarPerfilPage.jsx',import.meta.url),'utf8')
const tarjetas=readFileSync(new URL('../src/components/pacientes/CardPaciente.jsx',import.meta.url),'utf8')
const pacientesPage=readFileSync(new URL('../src/pages/PacientesPage.jsx',import.meta.url),'utf8')
const centro=readFileSync(new URL('../src/components/avisos/CentroAvisosNutriologo.jsx',import.meta.url),'utf8')
const icono=readFileSync(new URL('../src/components/pacientes/IconoWhatsApp.jsx',import.meta.url),'utf8')
const config=readFileSync(new URL('../src/components/avisos/ConfiguracionSeguimiento.jsx',import.meta.url),'utf8')
const zona='America/Mexico_City'
const opts={activo:true,cicloDias:30,anticipacionDias:5}
const juan={
  _id:'paciente-1',name:'Juan',
  ultimaConsulta:{inicio:'2026-11-01T15:00:00.000Z'},
  proximaConsulta:null,phone:'5551239876',birthDate:'1993-01-01',
  ultimaMedicion:{peso:72},tieneExpediente:true,tienePlan:true,
}
test('una última consulta completada genera aviso cinco días antes del ciclo de 30',()=>{
  const aviso=avisoProximoSeguimiento(juan,opts,'2026-11-26',zona)
  assert.equal(aviso.id,'seguimiento-cita')
  assert.equal(aviso.diasRestantes,5)
  assert.equal(aviso.fecha,'2026-12-01')
  assert.match(aviso.detalle,/A Juan le faltan 5 días/)
  assert.equal(aviso.accion,'cita')
})
test('el nutriólogo puede configurar un ciclo de 15 días y tres días de aviso',()=>{
  const a=avisoProximoSeguimiento({...juan,ultimaConsulta:{inicio:'2026-11-10T18:00:00Z'}},
    {...opts,cicloDias:15,anticipacionDias:3},'2026-11-22',zona)
  assert.equal(a.fecha,'2026-11-25')
  assert.equal(a.diasRestantes,3)
  assert.equal(avisoProximoSeguimiento(juan,{...opts,anticipacionDias:3},'2026-11-26',zona),null)
})
test('si ya hay próxima consulta, se evita avisar para reservar otra',()=>{
  assert.equal(avisoProximoSeguimiento({...juan,proximaConsulta:{inicio:'2026-12-02T15:00:00Z'}},
    opts,'2026-11-26',zona),null)
})
test('no inventa consulta completada ni alarma clínica sin la fecha real',()=>{
  assert.equal(avisoProximoSeguimiento({...juan,ultimaConsulta:null},opts,'2026-11-26',zona),null)
  assert.equal(avisoProximoSeguimiento(juan,{...opts,activo:false},'2026-11-26',zona),null)
  assert.equal(avisoProximoSeguimiento(juan,null,'2026-11-26',zona),null)
})
test('la alerta antigua caduca para evitar recordatorios eternos',()=>{
  assert.equal(avisoProximoSeguimiento(juan,opts,'2027-01-10',zona),null)
  const late=avisoProximoSeguimiento(juan,opts,'2026-12-03',zona)
  assert.equal(late.diasRestantes,-2)
  assert.match(late.detalle,/hace 2 días/)
})
test('las fechas respetan el día local del consultorio',()=>{
  assert.equal(fechaEnZona('2026-11-02T02:00:00Z','America/Mexico_City'),'2026-11-01')
  assert.equal(fechaEnZona('2026-11-02T02:00:00Z','Asia/Tokyo'),'2026-11-02')
  assert.equal(sumarDiasFecha('2027-02-28',1),'2027-03-01')
})
test('la campanita y la tarjeta usan el mismo aviso sin duplicar categorías',()=>{
  const all=obtenerAvisosPaciente(juan,opts,'2026-11-26',zona)
  assert.equal(all.filter(a=>a.id==='seguimiento-cita').length,1)
  const center=reunirAvisos([juan],[],new Date('2026-11-26T16:00:00Z'),
    opts,'2026-11-26',zona)
  assert.equal(center.filter(x=>x.id==='paciente:paciente-1:seguimiento-cita').length,1)
  assert.equal(center.find(x=>x.titulo==='Seguimiento próximo').filtro,'expediente')
})
test('el perfil y la navegación ofrecen ajustes y la alerta puede crear cita',()=>{
  assert.match(perfil,/<ConfiguracionSeguimiento/)
  assert.match(perfil,/id:'recordatorios-seguimiento'/)
  assert.match(config,/client\.put\('\/horario\/seguimiento'/)
  assert.match(pacientesPage,/configSeguimiento=\{preferenciasSeguimiento\}/)
  assert.match(pacientesPage,/navigate\('\/citas\/nueva', \{state:\{pacienteId:paciente\._id\}\}\)/)
  assert.match(centro,/client\.get\('\/horario\/seguimiento'\)/)
  assert.match(tarjetas,/const avisos = obtenerAvisosPaciente\(paciente,configSeguimiento/)
})
test('trabajar usa martillo y mensaje muestra el icono real de WhatsApp',()=>{
  assert.match(tarjetas,/<Hammer size=\{17\}/)
  assert.equal((tarjetas.match(/<IconoWhatsApp size=\{23\}\/>/g)||[]).length,2)
  assert.match(icono,/<svg/)
  assert.match(tarjetas,/https:\/\/wa\.me\//)
  assert.match(tarjetas,/Sin consulta completada/)
})
