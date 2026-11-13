import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GRUPOS_AVISOS, grupoDeAviso, claveRevisionAviso, resumenDeAvisos, filtrarAvisos,
} from '../src/utils/avisosPacienteVista.js'

const read=relative=>readFileSync(new URL('../src/'+relative,import.meta.url),'utf8')
const modal=read('components/pacientes/AvisosPaciente.jsx')
const modalCss=read('components/pacientes/avisosPaciente.css')
const citas=read('components/citas/ResumenCitas.jsx')
const citasCss=read('components/citas/resumenCitas.css')
const citasPage=read('pages/CitasPage.jsx')

const avisos=[
  {id:'invitacion',categoria:'Cuenta',titulo:'Invitación pendiente'},
  {id:'expediente',categoria:'Organización clínica',titulo:'Expediente por iniciar',accion:'expediente'},
  {id:'plan',categoria:'Organización clínica',titulo:'Plan por preparar',accion:'plan'},
  {id:'mediciones',categoria:'Seguimiento',titulo:'Sin mediciones',accion:'mediciones'},
]
test('clasifica cada aviso en categorías reales, sin inventar urgencias',()=>{
  assert.deepEqual(GRUPOS_AVISOS.map(g=>g.id),['cuenta','clinica','seguimiento','datos'])
  assert.equal(grupoDeAviso(avisos[0]),'cuenta')
  assert.equal(grupoDeAviso(avisos[1]),'clinica')
  assert.equal(grupoDeAviso(avisos[3]),'seguimiento')
  assert.equal(grupoDeAviso({id:'telefono',categoria:'Datos generales'}),'datos')
  assert.deepEqual(resumenDeAvisos(avisos),{
    total:4,pendientes:4,vistos:0,cuenta:1,clinica:2,seguimiento:1,datos:0,
  })
})
test('marcar revisado no elimina ni modifica avisos, y se puede revertir',()=>{
  const id=claveRevisionAviso(avisos[1])
  const resumen=resumenDeAvisos(avisos,[id])
  assert.equal(resumen.total,4)
  assert.equal(resumen.pendientes,3)
  assert.equal(resumen.vistos,1)
  assert.deepEqual(filtrarAvisos(avisos,[id],'pendientes').map(a=>a.id),
    ['invitacion','plan','mediciones'])
  assert.deepEqual(filtrarAvisos(avisos,[id],'vistos').map(a=>a.id),['expediente'])
  assert.deepEqual(filtrarAvisos(avisos,[id],'todos','clinica').map(a=>a.id),['expediente','plan'])
  assert.equal(filtrarAvisos(avisos,[id],'todos').length,4)
})
test('la fecha cambia el identificador de seguimiento sin guardar su descripción',()=>{
  const a={id:'seguimiento-cita',detalle:'Juan necesita seguimiento',fecha:'2026-12-15'}
  const b={...a,fecha:'2027-01-15'}
  assert.notEqual(claveRevisionAviso(a),claveRevisionAviso(b))
  assert.doesNotMatch(claveRevisionAviso(a),/Juan/)
})
test('modal mantiene accesibilidad, acciones existentes y revisados locales',()=>{
  assert.match(modal,/role="dialog"/)
  assert.match(modal,/aria-modal="true"/)
  assert.match(modal,/createPortal/)
  assert.match(modal,/handleKey/)
  assert.match(modal,/document\.body\.style\.overflow/)
  assert.match(modal,/onAccion\(aviso\)/)
  assert.match(modal,/aria-expanded=\{expandido\}/)
  assert.match(modal,/aria-pressed=\{revisado\}/)
  assert.match(modal,/setEstado\('todos'\)/)
  assert.match(modal,/onClick=\{marcarTodos\}/)
  assert.match(modal,/nutria-avisos-revisados-v2:/)
  assert.match(modal,/window\.localStorage\.setItem/)
  assert.match(modal,/Marcar como revisado no elimina tareas|Marcar como revisado no elimina/i)
  for(const title of ['Editar datos','Abrir expediente','Preparar plan','Registrar medición','Programar seguimiento']){
    assert.ok(modal.includes(title),'Acción ausente: '+title)
  }
})
test('modal respeta responsive y modo oscuro, no presenta categorías ficticias',()=>{
  assert.match(modal,/grid-cols-2 gap-2 sm:grid-cols-4/)
  assert.match(modal,/max-h-\[96dvh\]/)
  assert.match(modal,/Filtrar avisos por categoría/)
  assert.match(modalCss,/@media\(max-width:420px\)/)
  assert.match(modalCss,/html\[data-theme="dark"\]/)
  assert.doesNotMatch(modal,/urgente|urgencia alta|prioridad alta/i)
})
test('Ver citas tiene KPIs separados, buscador, estado, ficha vacía y acciones intactas',()=>{
  assert.match(citas,/nutria-resumen-kpi-icon/)
  assert.match(citas,/sm:gap-4/)
  assert.match(citas,/text-3xl/)
  assert.match(citas,/role="tablist"/)
  assert.match(citas,/aria-selected=\{tab===item\.id\}/)
  assert.match(citas,/client\.get\('\/citas'/)
  assert.match(citas,/Buscar cita por paciente/)
  assert.match(citas,/Filtrar por estado/)
  assert.match(citas,/Quitar filtros/)
  assert.match(citas,/Ver historial/)
  assert.match(citas,/onAbrir\(c\)/)
  assert.match(citas,/hasta 500 citas por periodo/)
  assert.match(citasCss,/@media\(max-width:430px\)/)
  assert.match(citasCss,/html\[data-theme="dark"\]/)
})
test('mantiene el calendario con vistas y sin reintroducir el encabezado retirado',()=>{
  assert.match(citasPage,/VIEWS = \[\['mes', 'Mes'\], \['semana', 'Semana'\], \['dia', 'Día'\], \['lista', 'Lista'\]\]/)
  assert.match(citasPage,/<ResumenCitas revision=\{reload\}/)
  assert.match(citasPage,/MiniCalendar focus=\{focus\}/)
  assert.doesNotMatch(citasPage,/Configurar agenda<\/button>/)
  assert.match(citasCss,/\[aria-label="Calendario de citas"\]/)
})
