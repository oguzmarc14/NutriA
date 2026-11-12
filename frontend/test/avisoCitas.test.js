import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/pages/CitasCrearPage.jsx', import.meta.url), 'utf8')
const aviso = readFileSync(new URL('../src/components/citas/AvisoConfigurarCitas.jsx', import.meta.url), 'utf8')
const vista = readFileSync(new URL('../src/pages/EditarPerfilPage.jsx', import.meta.url), 'utf8')

test('mensaje de horarios sin configurar muestra alerta y botones de acción',()=>{
  assert.match(page,/err\.response\?\.status === 409/)
  assert.match(page,/setMostrarAviso\(requiereConfigurar\)/)
  assert.match(aviso,/Configura los bloques de citas para ver los espacios disponibles/)
  assert.match(aviso,/>\s*Cancelar\s*</)
  assert.match(aviso,/Ir a configurar/)
  assert.match(aviso,/role="alertdialog"/)
})
test('Ir a configurar abre el editor de horarios del perfil y Cancelar no navega',()=>{
  assert.match(page,/navigate\('\/editar-perfil#horarios-citas'\)/)
  assert.match(page,/onCancelar=\{\(\)\s*=>\s*setMostrarAviso\(false\)\}/)
  assert.match(vista,/<ConfiguracionCitas/)
})
test('se puede reabrir el aviso y no se confunde caída de red con horarios sin configurar',()=>{
  assert.match(page,/setSinConfiguracion\(requiereConfigurar\)/)
  assert.match(page,/setMostrarAviso\(true\)/)
  assert.match(page,/if \(!requiereConfigurar\)/)
})
