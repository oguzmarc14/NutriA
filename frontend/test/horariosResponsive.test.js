import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { etiquetaHoraCita } from '../src/utils/horariosCitas.js'

const selector = readFileSync(new URL('../src/components/citas/SelectorDisponibilidad.jsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/CitasCrearPage.jsx', import.meta.url), 'utf8')
const publicPage = readFileSync(new URL('../src/pages/AgendaPublicaPage.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/components/citas/agenda.css', import.meta.url), 'utf8')
const global = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('la API conserva las etiquetas de hora legibles', () => {
  assert.equal(etiquetaHoraCita({hora:'09:00',inicio:'2026-11-12T15:00:00.000Z'},'America/Mexico_City'),'09:00')
  assert.equal(etiquetaHoraCita({hora:'17:30'},'America/Mexico_City'),'17:30')
})
test('si falta la hora del backend, se muestra en la zona del consultorio', () => {
  assert.equal(etiquetaHoraCita({inicio:'2026-11-12T15:00:00.000Z'},'America/Mexico_City'),'09:00')
  assert.equal(etiquetaHoraCita({inicio:'2026-11-12T15:00:00.000Z'},'America/Los_Angeles'),'07:00')
  assert.equal(etiquetaHoraCita({},'America/Mexico_City'),'Horario no disponible')
})
test('grid de horas móvil tiene columnas reducidas sin desbordarse', () => {
  assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'))
  assert.ok(css.includes('.nutria-agenda-hora-text'))
  assert.ok(selector.includes('nutria-agenda-hora-text'))
  assert.ok(page.includes('grid-cols-[minmax(0,1fr)]'))
  assert.ok(publicPage.includes('min-w-0 max-w-full'))
})
test('carrusel de fechas usa scroll propio sin bloquear gestos horizontales', () => {
  assert.ok(css.includes('overflow-x:auto'))
  assert.ok(css.includes('touch-action:pan-x pan-y'))
  assert.ok(global.includes('html, body, #root { touch-action: pan-x pan-y pinch-zoom; }'))
  assert.ok(selector.includes('Desliza hacia los lados'))
})
test('las horas seleccionables tienen texto y aria-label visibles', () => {
  assert.ok(selector.includes("aria-label={'Seleccionar cita a las ' + hora}"))
  assert.ok(selector.includes("onSelect({ ...espacio, hora, fecha: actual.fecha })"))
  assert.ok(selector.includes('aria-pressed={seleccion?.inicio === espacio.inicio}'))
})
