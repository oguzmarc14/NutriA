import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { avisoDestacado } from '../src/utils/cardPaciente.js'
import { obtenerAvisosPaciente } from '../src/utils/avisosPacientes.js'
const card = readFileSync(new URL('../src/components/pacientes/CardPaciente.jsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/components/pacientes/estilosPaciente.css', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/PacientesPage.jsx', import.meta.url), 'utf8')

test('un aviso de medición se destaca antes de datos opcionales', () => {
  const avisos = obtenerAvisosPaciente({
    accountStatus:'active', phone:'',birthDate:null,ultimaMedicion:null,
    tieneExpediente:false,tienePlan:false,
  })
  assert.equal(avisoDestacado(avisos).id,'mediciones')
  assert.equal(avisos.length,5)
})
test('alerta compacta no inventa avisos cuando todo está completo', () => {
  const avisos=obtenerAvisosPaciente({
    accountStatus:'active',phone:'1234567890',birthDate:'1991-01-01',
    ultimaMedicion:{peso:70},tieneExpediente:true,tienePlan:true,
  })
  assert.deepEqual(avisos,[])
  assert.equal(avisoDestacado(avisos),null)
})
test('si sólo existen pendientes de cuenta, muestra el aviso real', () => {
  const avisos=[{id:'invitacion',titulo:'Invitación pendiente',accion:null}]
  assert.equal(avisoDestacado(avisos).id,'invitacion')
  assert.equal(avisoDestacado([{id:'telefono',accion:'editar'}]).id,'telefono')
})
test('menú de tres puntos conserva todas las acciones anteriores',()=>{
  for(const name of ['onEditar','onEliminar','onReenviar','onTrabajar','onDejarTrabajar','onVerAvisos']){
    assert.ok(card.includes(name),'Falta acción '+name)
  }
  assert.match(card,/role="menu"/)
  assert.match(card,/aria-expanded=\{menuAbierto\}/)
  assert.match(card,/Reenviar invitación/)
  assert.match(card,/Ver notas/)
  assert.match(card,/Eliminar paciente/)
  assert.match(card,/enlaceWhatsApp/)
  assert.match(page,/onVerAvisos=\{\(\) => setPacienteConAvisos\(paciente\)\}/)
})
test('sólo hay una alerta prioritaria y los indicadores siguen disponibles',()=>{
  assert.match(card,/const destacado = avisoDestacado\(avisos\)/)
  assert.match(card,/\{destacado && \(/)
  assert.match(card,/Ver \{avisos.length\}/)
  for(const title of ['Cambio de peso','Última consulta','IMC actual','Próxima consulta']){
    assert.ok(card.includes(title),'Falta indicador '+title)
  }
  assert.ok(styles.includes('.nutria-patient-card__dropdown'))
  assert.ok(styles.includes('html[data-theme="dark"] .nutria-patient-card__dropdown'))
  assert.ok(styles.includes('.nutria-patient-card--active'))
})
