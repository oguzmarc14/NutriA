import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const leer = ruta => readFileSync(new URL('../src/' + ruta, import.meta.url), 'utf8')
const hook = leer('hooks/useModalAccesible.js')
const creado = leer('components/pacientes/ModalPacienteCreado.jsx')
const lista = leer('pages/PacientesPage.jsx')
const detalle = leer('components/mediciones/ModalDetalleMedicion.jsx')

test('modal accesible permite Escape, Tab, restaura foco y bloquea scroll', () => {
  assert.ok(hook.includes("event.key === 'Escape'"))
  assert.ok(hook.includes("event.key !== 'Tab'"))
  assert.ok(hook.includes('onVolverActual.current?.()'))
  assert.ok(hook.includes('bloqueadoActual.current'))
  assert.ok(hook.includes("document.body.style.overflow = 'hidden'"))
  assert.ok(hook.includes('document.body.style.overflow = overflowAnterior'))
  assert.ok(hook.includes('focoAnterior.focus?.()'))
})
test('paciente creado permite volver a lista sin activar paciente', () => {
  assert.ok(creado.includes('Volver a pacientes'))
  assert.ok(creado.includes('ref={volverRef}'))
  assert.ok(creado.includes('onClick={onVolver}'))
  assert.ok(lista.includes('onVolver={() => setPacienteCreado(null)}'))
  assert.ok(lista.includes('comenzarTrabajo(nuevoPaciente)'))
})
test('detalle de medición tiene salida visible y también Escape', () => {
  assert.ok(detalle.includes('Volver a mediciones'))
  assert.ok(detalle.includes('useModalAccesible('))
  assert.ok(detalle.includes('ref={modalRef}'))
  assert.ok(detalle.includes('ref={volverRef}'))
})

test('guardar o eliminar conserva botón de regreso y control con Escape', () => {
  for (const ruta of [
    'components/pacientes/ModalEliminarPaciente.jsx',
    'components/planes/ModalPlanGuardado.jsx',
    'components/mediciones/ModalMedicionGuardada.jsx',
    'components/expediente/AvisoExpedienteGuardado.jsx',
  ]) {
    const codigo = leer(ruta)
    assert.ok(codigo.includes('useModalAccesible('), ruta)
    assert.ok(codigo.includes('ref={modalRef}'), ruta)
    assert.ok(codigo.includes('ref={volverRef}'), ruta)
  }
  assert.ok(leer('components/pacientes/ModalEliminarPaciente.jsx').includes('bloqueado: eliminando'))
})
