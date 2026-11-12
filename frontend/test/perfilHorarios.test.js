import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = path => readFileSync(new URL('../src/' + path, import.meta.url),'utf8')
const verCitas = src('pages/CitasPage.jsx')
const editarPerfil = src('pages/EditarPerfilPage.jsx')
const horario = src('components/HorarioLaboral.jsx')
const configCitas = src('components/citas/ConfiguracionCitas.jsx')
const layout = src('layouts/DashboardLayout.jsx')
const menu = src('components/navigation/MenuMovil.jsx')
const crearCita = src('pages/CitasCrearPage.jsx')

test('Ver citas ya no muestra banner con Configurar agenda y Crear cita', () => {
  assert.doesNotMatch(verCitas,/Configurar agenda/)
  assert.doesNotMatch(verCitas,/<ConfiguracionCitas/)
  assert.doesNotMatch(verCitas,/bg-linear-to-br from-\[#173f34\]/)
  assert.match(verCitas,/<ResumenCitas/)
  assert.match(verCitas,/Calendario de citas/)
})
test('Editar perfil centraliza jornada, días no laborables y horarios de consulta', () => {
  assert.match(editarPerfil,/<HorarioLaboral/)
  assert.match(editarPerfil,/<ConfiguracionCitas/)
  assert.match(editarPerfil,/id:'dias-no-laborables'/)
  assert.match(editarPerfil,/id="horarios-citas"/)
  assert.match(horario,/id="dias-no-laborables"/)
  assert.match(horario,/diasNoLaborables/)
  assert.match(horario,/Festivo, vacaciones, descanso/)
  assert.match(configCitas,/Guardar horarios de citas/)
})
test('acceso al perfil está conectado desde menú de usuario móvil y escritorio', () => {
  const count=(layout.match(/irAEditarPerfil=\{\(\) => navigate\('\/editar-perfil'\)\}/g)||[]).length
  assert.equal(count,2)
  assert.match(menu,/to:'\/editar-perfil', label:'Editar perfil y horario'/)
  assert.doesNotMatch(menu,/to:'\/citas', state:\{abrirConfiguracion:true\}/)
})
test('crear cita redirige configuración al perfil, conservando cancelación de la alerta',()=>{
  assert.match(crearCita,/navigate\('\/editar-perfil#horarios-citas'\)/)
  assert.match(crearCita,/onCancelar=\{\(\) => setMostrarAviso\(false\)\}/)
  assert.match(verCitas,/routerNavigate\('\/editar-perfil#horarios-citas'/)
})
test('cambiar horario recarga franjas y días especiales sin datos personales',()=>{
  assert.match(editarPerfil,/onSaved=\{\(\) => setVersionHorario\(n => n \+ 1\)\}/)
  assert.match(editarPerfil,/<ConfiguracionCitas key=\{versionHorario\}/)
  assert.match(horario,/client\.put\('\/horario', form\)/)
  assert.match(horario,/setForm\(actual =>/)
  assert.match(horario,/dia[sS]NoLaborables/)
})
