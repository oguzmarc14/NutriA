import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/pages/CitasCrearPage.jsx', import.meta.url), 'utf8')
const aviso = readFileSync(new URL('../src/components/citas/AvisoConfigurarCitas.jsx', import.meta.url), 'utf8')
const vista = readFileSync(new URL('../src/pages/CitasPage.jsx', import.meta.url), 'utf8')

test('mensaje de horarios sin configurar muestra alerta y botones de acción',()=>{
  assert.match(page,/available\.reason\.response\?\.status === 409/)
  assert.match(page,/setMostrarAviso\(requiereConfigurar\)/)
  assert.match(aviso,/Configura los bloques de citas para ver los espacios disponibles/)
  assert.match(aviso,/>\s*Cancelar\s*</)
  assert.match(aviso,/Ir a configurar/)
  assert.match(aviso,/role="alertdialog"/)
})
test('Ir a configurar llega a la configuración en Ver citas y Cancelar no navega',()=>{
  assert.match(page,/navigate\('\/citas',\{state:\{abrirConfiguracion:true\}\}\)/)
  assert.match(page,/onCancelar=\{\(\)=>setMostrarAviso\(false\)\}/)
  assert.match(vista,/location\.state\?\.abrirConfiguracion/)
})
test('se puede reabrir el aviso y no se confunde caída de red con horarios sin configurar',()=>{
  assert.match(page,/setSinConfiguracion\(requiereConfigurar\)/)
  assert.match(page,/setMostrarAviso\(true\)/)
  assert.match(page,/if \(!requiereConfigurar\)/)
})
