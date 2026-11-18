import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { citaCancelable } from '../src/utils/fechasMisCitas.js'

const src = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8')
const page=src('pages/MisCitasPage.jsx')
const modal=src('components/citas/ModalCancelarCitaPaciente.jsx')
const css=src('pages/misCitas.css')
const ahora=new Date('2026-11-18T12:00:00Z')
test('HU-22 botón sólo para citas futuras y no para historial',()=>{
  assert.equal(citaCancelable({estado:'programada',inicio:'2026-11-20T12:00:00Z'},ahora),true)
  assert.equal(citaCancelable({estado:'confirmada',inicio:'2026-11-19T12:00:00Z'},ahora),true)
  for(const estado of ['cancelada','completada']) {
    assert.equal(citaCancelable({estado,inicio:'2026-11-20T12:00:00Z'},ahora),false)
  }
  assert.equal(citaCancelable({estado:'programada',inicio:'2026-11-17T12:00:00Z'},ahora),false)
  assert.equal(citaCancelable({estado:'programada',inicio:'invalida'},ahora),false)
})
test('HU-22 usa endpoint propio y actualiza la lista tras confirmar',()=>{
  assert.match(page,/client\.patch\('\/mi-perfil\/citas\/'/)
  assert.match(page,/await actualizar\(\)/)
  assert.match(page,/ModalCancelarCitaPaciente/)
  assert.match(page,/Cancelar mi próxima cita/)
  assert.match(page,/Historial de citas/)
})
test('HU-22 modal accesible, bloqueo de doble envío y ajuste a móviles',()=>{
  assert.match(modal,/role="alertdialog"/)
  assert.match(modal,/aria-modal="true"/)
  assert.match(modal,/disabled=\{guardando\}/)
  assert.match(modal,/event\.key === 'Escape'/)
  assert.match(modal,/onCerrar/)
  assert.match(modal,/Conservar cita/)
  assert.match(modal,/Sí, cancelar cita/)
  assert.match(css,/\.nutria-mis-citas-dialog/)
  assert.match(modal,/max-w-md min-w-0/)
})
