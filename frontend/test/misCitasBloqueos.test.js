import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {rutasRapidas} from '../src/utils/navigationMovil.js'
import {formatearCitaPaciente,estadoCitaPaciente} from '../src/utils/fechasMisCitas.js'
const src = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8')
const config=src('components/citas/ConfiguracionCitas.jsx')
const css=src('components/citas/agenda.css')
const perfil=src('pages/EditarPerfilPage.jsx')
const app=src('App.jsx')
const layout=src('layouts/DashboardLayout.jsx')
const page=src('pages/MisCitasPage.jsx')
const bell=src('components/avisos/CentroAvisosPaciente.jsx')
const dashboard=src('components/dashboard/DashboardPaciente.jsx')
const back=readFileSync(new URL('../../backend/src/routes/perfilPaciente.routes.js',import.meta.url),'utf8')

test('configuración permite bloquear una hora semanal o una fecha específica',()=>{
  assert.match(config,/Bloquear hora semanal/)
  assert.match(config,/Bloquear horas de una fecha específica/)
  assert.match(config,/Agregar bloqueo de fecha/)
  assert.match(config,/client\.put\('\/horario\/citas',payload\)/)
  assert.match(config,/bloqueosPorFecha/)
  assert.match(config,/bloqueos:/)
  assert.match(config,/Guardar horarios de citas/)
})
test('responsive de etiquetas y fechas en móvil no desborda',()=>{
  assert.match(css,/\.nutria-agenda-config \.nutria-agenda-time-row/)
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) 42px/)
  assert.match(css,/@media\(max-width:374px\)/)
  assert.match(css,/\.nutria-agenda-config \.nutria-agenda-fecha-grid/)
  assert.match(config,/min-w-0/)
  assert.match(perfil,/overflow-x-clip/)
})
test('mis citas pertenece sólo al rol paciente, incluye próxima e historial',()=>{
  assert.match(app,/<ProtectedRoute roles=\{\["patient"\]\}/)
  assert.match(app,/path="mis-citas" element=\{<MisCitasPage \/>/)
  assert.match(layout,/label: 'Mis citas'/)
  assert.ok(rutasRapidas('patient',null).includes('/mis-citas'))
  assert.match(page,/Mi próxima cita/)
  assert.match(page,/Historial de citas/)
  assert.match(page,/Cita pendiente de confirmar/)
  assert.match(back,/router\.use\(allowRoles\('patient'\)\)/)
  assert.match(back,/router\.get\('\/citas', obtenerMisCitas\)/)
})
test('notificaciones a paciente y dashboard reflejan el estado real',()=>{
  assert.match(layout,/CentroAvisosPaciente modo="movil"/)
  assert.match(layout,/CentroAvisosPaciente modo="escritorio"/)
  assert.match(bell,/nutria-avisos-paciente-v1-/)
  assert.match(bell,/Marcar como vistos/)
  assert.match(bell,/window\.localStorage\.setItem/)
  assert.match(dashboard,/citasPaciente\?\.proxima\?\.estado==='confirmada'/)
  assert.match(dashboard,/navigate\('\/mis-citas'\)/)
})
test('las fechas del consultorio y los estados se muestran correctamente',()=>{
  assert.match(formatearCitaPaciente('2026-11-12T16:00:00Z','America/Mexico_City'),/10:00/)
  assert.equal(estadoCitaPaciente('confirmada'),'Confirmada')
  assert.equal(estadoCitaPaciente('programada'),'Por confirmar')
})
