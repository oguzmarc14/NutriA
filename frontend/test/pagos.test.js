import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const src=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8')
const page=src('pages/PagosPage.jsx')
const app=src('App.jsx')
const menu=src('layouts/DashboardLayout.jsx')
const dash=src('components/dashboard/DashboardPaciente.jsx')
const css=src('pages/pagos.css')
test('HU-23/24 rutas aisladas según el rol del usuario',()=>{
  assert.match(app,/<ProtectedRoute roles=\{\["patient"\]\}/)
  assert.match(app,/<ProtectedRoute roles=\{\["nutritionist"\]\}/)
  assert.match(app,/path="mis-pagos" element=\{<PagosPage/)
  assert.match(app,/path="pagos" element=\{<PagosPage/)
  assert.match(menu,/to: '\/mis-pagos'/)
  assert.match(menu,/to: '\/pagos'/)
  assert.match(dash,/to: "\/mis-pagos"/)
})
test('HU-23 registra reporte externo y NO procesa tarjeta',()=>{
  assert.match(page,/client\.post\('\/pagos\/mios'/)
  assert.match(page,/monto:importe,metodo,fechaPago:fecha/)
  assert.match(page,/NutriA no cobra ni procesa dinero/)
  assert.doesNotMatch(page,/cardNumber|cvv|creditCard|stripe|checkout/)
})
test('HU-24 historial y verificación por nutriólogo son explícitos',()=>{
  assert.match(page,/client\.get\('\/pagos\/mios'\)/)
  assert.match(page,/client\.get\('\/pagos\/consultorio'/)
  assert.match(page,/client\.patch\('\/pagos\/consultorio\/'/)
  assert.match(page,/Confirmar recepción/)
  assert.match(page,/Por verificar/)
  assert.match(page,/Historial de pagos/)
})
test('HU-23/24 formulario móvil y tema oscuro',()=>{
  assert.match(page,/max-w-5xl/)
  assert.match(page,/sm:grid-cols-2/)
  assert.match(css,/html\[data-theme="dark"\]/)
  assert.match(page,/role="alertdialog"/)
})
