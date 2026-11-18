import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8')
const app=src('App.jsx')
const login=src('pages/LoginPage.jsx')
const solicitar=src('pages/RecuperarContrasenaPage.jsx')
const cambiar=src('pages/RestablecerContrasenaPage.jsx')
test('HU-03 enlaces públicos y visibles únicamente para recuperar acceso',()=>{
  assert.match(app,/path="\/recuperar-contrasena" element=\{<RecuperarContrasenaPage/)
  assert.match(app,/path="\/restablecer-contrasena" element=\{<RestablecerContrasenaPage/)
  assert.match(login,/to="\/recuperar-contrasena"/)
  assert.match(login,/¿Olvidaste tu contraseña\?/)
})
test('HU-03 formulario de solicitud explica respuesta no reveladora',()=>{
  assert.match(solicitar,/client\.post\('\/auth\/paciente\/recuperar'/)
  assert.match(solicitar,/Si tienes una cuenta de paciente activa/)
  assert.match(solicitar,/type="email"/)
  assert.match(solicitar,/role="alert"/)
})
test('HU-03 restablecer exige token, confirmación y manejo de caducidad',()=>{
  assert.match(cambiar,/searchParams|useSearchParams/)
  assert.match(cambiar,/client\.post\('\/auth\/paciente\/restablecer'/)
  assert.match(cambiar,/password!==confirmacion/)
  assert.match(cambiar,/^[\s\S]*token/)
  assert.match(cambiar,/Solicitar otro enlace/)
})
