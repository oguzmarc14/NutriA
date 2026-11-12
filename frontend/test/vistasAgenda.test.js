import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  VISTAS_CITAS, inicioSemanaAgenda, rangoVistaAgenda,
  moverFocoAgenda, periodoNavegable, fechasDelRangoAgenda,
} from '../src/utils/vistasAgenda.js'

const pagina = readFileSync(new URL('../src/pages/CitasCrearPage.jsx', import.meta.url), 'utf8')
const selector = readFileSync(new URL('../src/components/citas/SelectorCrearCita.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/components/citas/agenda.css', import.meta.url), 'utf8')
const publico = readFileSync(new URL('../src/pages/AgendaPublicaPage.jsx', import.meta.url), 'utf8')

test('día es la vista inicial; semana y mes son seleccionables', () => {
  assert.deepEqual(VISTAS_CITAS, ['dia', 'semana', 'mes'])
  assert.match(pagina, /const \[vista, setVista\] = useState\('dia'\)/)
  assert.match(pagina, /<SelectorCrearCita/)
  assert.match(selector, /Vista del calendario para crear cita/)
  for (const label of ["dia:'Día'", "semana:'Semana'", "mes:'Mes'"]) {
    assert.ok(selector.includes(label), 'Falta ' + label)
  }
})
test('rangos correctos para el 12 de noviembre de 2026', () => {
  assert.deepEqual(rangoVistaAgenda('dia', '2026-11-12'), {desde:'2026-11-12',dias:1})
  assert.equal(inicioSemanaAgenda('2026-11-12'), '2026-11-09')
  assert.deepEqual(rangoVistaAgenda('semana', '2026-11-12'), {desde:'2026-11-09',dias:7})
  assert.deepEqual(rangoVistaAgenda('mes', '2026-11-12'), {desde:'2026-10-26',dias:42})
  const fechas = fechasDelRangoAgenda(rangoVistaAgenda('mes', '2026-11-12'))
  assert.equal(fechas.length,42)
  assert.equal(fechas.at(-1),'2026-12-06')
})
test('navegación anterior y siguiente conserva la fecha correcta', () => {
  assert.equal(moverFocoAgenda('dia','2026-11-12',1),'2026-11-13')
  assert.equal(moverFocoAgenda('semana','2026-11-12',-1),'2026-11-05')
  assert.equal(moverFocoAgenda('mes','2027-01-31',1),'2027-02-28')
  assert.equal(moverFocoAgenda('mes','2026-12-31',1),'2027-01-31')
  assert.equal(moverFocoAgenda('mes','2026-03-31',-1),'2026-02-28')
})
test('no permite periodos pasados ni navegar más de 180 días', () => {
  assert.equal(periodoNavegable('dia','2026-11-11','2026-11-12'),false)
  assert.equal(periodoNavegable('dia','2026-11-12','2026-11-12'),true)
  assert.equal(periodoNavegable('semana','2026-11-09','2026-11-12'),true)
  assert.equal(periodoNavegable('semana','2026-11-02','2026-11-12'),false)
  assert.equal(periodoNavegable('mes','2026-10-15','2026-11-12'),false)
  assert.equal(periodoNavegable('mes','2026-11-15','2026-11-12'),true)
  assert.equal(periodoNavegable('dia','2027-12-01','2026-11-12'),false)
})
test('todas las vistas mantienen las horas, la selección y la duración', () => {
  assert.match(selector,/const horas = porFecha.get\(foco\) \|\| \[\]/)
  assert.match(selector,/onSelect\(\{ \.\.\.espacio, hora, fecha: foco \}\)/)
  assert.match(selector,/aria-pressed=\{seleccion\?\.inicio === espacio\.inicio\}/)
  assert.match(selector,/Cada cita dura 60 minutos/)
  assert.match(pagina,/params: \{ desde: rango.desde, dias: rango.dias \}/)
  assert.match(pagina,/onSelect=\{valor => \{ setSeleccion\(valor\); setConflicto\(''\) \}\}/)
  assert.match(pagina,/setSeleccion\(null\)/)
  assert.match(publico,/SelectorDisponibilidad/)
})
test('la cuadrícula semanal y mensual caben en pantallas pequeñas', () => {
  assert.match(css,/\.nutria-agenda-semana,\.nutria-agenda-mes\s*\{[^}]*repeat\(7,minmax\(0,1fr\)\)/s)
  assert.match(css,/\.nutria-agenda-cal-dia--mes\{min-height:49px\}/)
  assert.match(css,/\.nutria-agenda-vistas\s*\{[^}]*repeat\(3,minmax\(0,1fr\)\)/s)
  assert.match(selector,/nutria-agenda-cal-dia--mes/)
  assert.match(selector,/disabled=\{pasado \|\| sinEspacios\}/)
})
