import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { rutasRapidas } from '../src/utils/navigationMovil.js'

const source = readFileSync(new URL('../src/components/navigation/MenuMovil.jsx', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../src/layouts/DashboardLayout.jsx', import.meta.url), 'utf8')

test('nutriólogo sin paciente activo tiene accesos a Ver y Crear citas', () => {
  const rutas = rutasRapidas('nutritionist',null)
  assert.ok(rutas.includes('/citas'))
  assert.ok(rutas.includes('/citas/nueva'))
  assert.ok(rutas.includes('/pacientes'))
})
test('nutriólogo con paciente activo conserva Ver y Crear citas', () => {
  const rutas = rutasRapidas('nutritionist',{id:'paciente_demo',name:'Paciente demo'})
  assert.ok(rutas.includes('/citas'))
  assert.ok(rutas.includes('/citas/nueva'))
  assert.ok(rutas.includes('/pacientes/paciente_demo/expediente'))
  assert.ok(rutas.includes('/pacientes'))
})
test('navegación de paciente y administrador conserva apartados de su rol', () => {
  assert.ok(rutasRapidas('patient',null).includes('/mi-expediente'))
  assert.ok(rutasRapidas('patient',null).includes('/mi-plan'))
  assert.ok(rutasRapidas('admin',null).includes('/usuarios'))
  assert.ok(rutasRapidas('admin',null).includes('/community/moderacion'))
})
test('menú completo usa la misma fuente que escritorio y no filtra rutas por paciente activo', () => {
  assert.match(layout,/MenuMovil enlaces=\{navigationVisible\}/)
  assert.doesNotMatch(layout,/const navegacionMovil = user\.role/)
  assert.match(source,/\{enlaces\.map\(/)
  assert.match(source,/Todos los apartados/)
  assert.match(layout,/Abrir todos los apartados/)
  assert.match(source,/Versión de NutriA/)
})
test('configuración de agenda y clínicas también son accesibles desde Más', () => {
  assert.match(source,/Configurar agenda y horarios/)
  assert.match(source,/Editar perfil y horario laboral/)
  assert.match(source,/Mi clínica/)
})

test('el menú del nutriólogo conserva los módulos de citas y dietas',()=>{
  for (const title of ["label: 'Ver citas'","label: 'Crear cita'","label: 'Crear dieta'","label: 'Consultar dietas'","label: 'Cálculo nutricional'"]) {
    assert.ok(layout.includes(title),'Falta apartado '+title)
  }
  assert.match(source,/Buscar actualización y recargar NutriA/)
})
