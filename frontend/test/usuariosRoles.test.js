import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8')
const page=read('pages/UsuariosPage.jsx')
const card=read('components/usuarios/CardUsuario.jsx')
const list=read('components/usuarios/ListaUsuarios.jsx')
test('HU-04 administrador puede cambiar rol de cuentas existentes',()=>{
  assert.match(page,/client\.patch\(\s*'\/usuarios\/'/)
  assert.match(page,/confirmarCambioRol/)
  assert.match(page,/Cambiar rol/)
  assert.match(card,/onSolicitarCambioRol/)
  assert.match(list,/onSolicitarCambioRol/)
})
test('HU-04 confirma acción e impide auto-democión',()=>{
  assert.match(page,/role="alertdialog"/)
  assert.match(page,/El cambio modificará los permisos/)
  assert.match(card,/disabled=\{actualizando \|\| esUsuarioActual\}/)
})
