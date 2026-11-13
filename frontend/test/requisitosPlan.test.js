import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluarRequisitosPlan, medicionListaParaPlan } from '../src/utils/requisitosPlan.js'

const src = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8')
const page = src('pages/PlanesAlimenticiosPage.jsx')
const modal = src('components/planes/ModalRequisitosPlan.jsx')
const medicion = {peso:70,estatura:1.73,edad:30,nivelActividadFisica:3}
const expediente = {_id:'507f1f77bcf86cd799439011', nutricion:{numeroComidasDia:4}}

test('un paciente sin expediente ni medidas recibe alerta y no puede crear plan',()=>{
  assert.deepEqual(evaluarRequisitosPlan({expediente:null,ultimaMedicion:null}),{
    estado:'incompleto',tipo:'ambos',faltantes:['expediente','mediciones'],
  })
})
test('la alerta distingue si solo falta expediente o solo mediciones',()=>{
  assert.equal(evaluarRequisitosPlan({expediente:null,ultimaMedicion:medicion}).tipo,'expediente')
  assert.equal(evaluarRequisitosPlan({expediente,ultimaMedicion:null}).tipo,'mediciones')
  assert.deepEqual(evaluarRequisitosPlan({expediente,ultimaMedicion:medicion}),{
    estado:'listo',faltantes:[],
  })
})
test('medición tiene peso, estatura, edad y nivel de actividad reales',()=>{
  assert.equal(medicionListaParaPlan(medicion),true)
  for(const campo of ['peso','estatura','edad','nivelActividadFisica']){
    assert.equal(medicionListaParaPlan({...medicion,[campo]:null}),false,campo)
  }
  assert.equal(medicionListaParaPlan({...medicion,peso:0}),false)
  assert.equal(medicionListaParaPlan({...medicion,estatura:0.3}),false)
  assert.equal(medicionListaParaPlan({...medicion,nivelActividadFisica:6}),false)
})
test('editor no aparece si faltan requisitos y guardar está protegido',()=>{
  assert.match(page,/pacienteId && \(planEditandoId \|\| requisitosPlan.estado === 'listo'\)/)
  assert.match(page,/if \(!planEditandoId && requisitosPlan.estado !== 'listo'\)/)
  assert.match(page,/if \(requisitosPlan.estado !== 'listo'\)/)
  assert.match(page,/client\.get\('\/expedientes\/' \+ pacienteId\)/)
  assert.match(page,/evaluarRequisitosPlan\(respuesta\)/)
  assert.match(page,/setRequisitosPlan\(\{estado:'error'\}\)/)
  assert.match(page,/setAlertaRequisitos\('error'\)/)
})
test('en Crear dieta se retira la biblioteca de recetas sin borrar alimentos y platillos',()=>{
  assert.doesNotMatch(page,/RecetasDietasPanel|Biblioteca de recetas y platillos|Ver recetas/)
  assert.match(page,/Platillos y bebidas/)
  assert.match(page,/Consultar dietas/)
  assert.match(page,/ModalRequisitosPlan/)
})
test('alerta ofrece las rutas reales y Cancelar, con accesibilidad de teclado',()=>{
  assert.match(page,/navigate\('\/pacientes\/' \+ encodeURIComponent\(pacienteId\) \+ '\/expediente'\)/)
  assert.match(page,/navigate\('\/mediciones\?paciente=' \+ encodeURIComponent\(pacienteId\)\)/)
  assert.match(modal,/role="alertdialog"/)
  assert.match(modal,/aria-modal="true"/)
  assert.match(modal,/onExpediente/)
  assert.match(modal,/onMediciones/)
  assert.match(modal,/onReintentar/)
  assert.match(modal,/onCancelar/)
  assert.match(modal,/Cancelar/)
  assert.match(modal,/Ir a mediciones/)
  assert.match(modal,/Abrir expediente/)
  assert.match(modal,/createPortal/)
  assert.match(modal,/document\.body\.style\.overflow/)
})
test('círculos y botones del selector de modalidad se centran',()=>{
  const seccion = page.slice(page.indexOf('id="modal-modalidad-plan"'))
  assert.equal((seccion.match(/w-full items-center gap-3 rounded-2xl border-2/g)||[]).length,3)
  assert.equal((seccion.match(/size=\{21\} className="shrink-0 self-center/g)||[]).length,6)
  assert.match(seccion,/className="mt-5 flex flex-wrap items-center justify-center gap-3"/)
  assert.match(seccion,/min-h-11 min-w-\[125px\]/)
  assert.match(seccion,/min-h-11 min-w-\[175px\]/)
})
