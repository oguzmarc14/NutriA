import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  compartirReconocimiento,
  textoPublicoReconocimiento,
  TITULOS_PUBLICOS,
} from '../src/utils/compartirReconocimiento.js'

const hu31 = new URL('../src/components/gamificacion/CompartirReconocimiento.jsx', import.meta.url)
const camino = new URL('../src/components/gamificacion/MiCaminoNutriA.jsx', import.meta.url)
const jsx = readFileSync(hu31, 'utf8')
const caminoJSX = readFileSync(camino, 'utf8')

test('HU-31 comparte solo logros realmente reconocidos y de lista blanca', () => {
  const publico = textoPublicoReconocimiento({
    id: 'primer-paso',
    titulo: 'Medición privada',
    descripcion: 'Peso 70kg, expediente paciente, correo personal',
    nombre: 'Persona Privada',
  })
  assert.match(publico, /Mi primer paso/)
  assert.doesNotMatch(publico, /Medición privada|70kg|expediente|Persona Privada|correo personal/)
  assert.deepEqual(Object.keys(TITULOS_PUBLICOS).sort(),
    ['primer-paso', 'conociendome', 'mi-voz', 'a-mi-ritmo', 'sigo-aprendiendo', 'tres-dias-seguidos', 'siete-dias-seguidos'].sort())
  assert.equal(textoPublicoReconocimiento({ id: 'otro', titulo: 'Título desconocido' }), null)
})
test('HU-31 permite abrir hoja de compartir nativa sin publicar automáticamente', async () => {
  let invocaciones = 0
  const r = await compartirReconocimiento({ id: 'mi-voz' }, {
    share: async payload => {
      invocaciones += 1
      assert.equal(payload.title, 'Mi camino en NutriA')
      assert.match(payload.text, /Mi voz cuenta/)
      assert.doesNotMatch(payload.text, /http|token|paciente/i)
    },
    writeText: () => { throw Error('no debería copiar') },
  })
  assert.equal(invocaciones, 1)
  assert.equal(r.estado, 'seleccionado')
})
test('HU-31 al cancelar no copia ni envía nada', async () => {
  let copias = 0
  const r = await compartirReconocimiento({ id: 'conociendome' }, {
    share: async () => { const e = Error('cancelled'); e.name = 'AbortError'; throw e },
    writeText: async () => { copias++ },
  })
  assert.equal(r.estado, 'cancelado')
  assert.equal(copias, 0)
})
test('HU-31 escritorio usa copiar y deja salida manual sin permisos', async () => {
  let texto = ''
  const copiado = await compartirReconocimiento({ id: 'a-mi-ritmo' }, {
    writeText: async s => { texto = s },
  })
  assert.equal(copiado.estado, 'copiado')
  assert.match(texto, /A mi ritmo/)
  const manual = await compartirReconocimiento({ id: 'sigo-aprendiendo' }, {
    share: async () => { throw Error('not supported') },
    writeText: async () => { throw Error('not allowed') },
  })
  assert.equal(manual.estado, 'manual')
  assert.match(manual.mensaje, /Sigo aprendiendo/)
  assert.deepEqual(await compartirReconocimiento({id:'unrecognized'},{}),
    { estado:'no-disponible', mensaje:'' })
})
test('HU-31 integra botón solo en reconocimientos activos, responsive y accesible', () => {
  assert.match(caminoJSX, /preferencias\.activa && resumen/)
  assert.match(caminoJSX, /resumen\.reconocimientos\.map/)
  assert.match(caminoJSX, /<CompartirReconocimiento logro=\{logro\}/)
  assert.match(jsx, /onClick=\{manejarCompartir\}/)
  assert.match(jsx, /Compartir logro/)
  assert.match(jsx, /role="status"/)
  assert.match(jsx, /onFocus=\{event => event\.target\.select\(\)\}/)
  assert.match(jsx, /min-w-0/)
})

test('HU-30: nuevas rachas se comparten solo mediante título público',()=>{
  const texto=textoPublicoReconocimiento({id:'tres-dias-seguidos',titulo:'Dato privado',descripcion:'Peso privado'})
  assert.match(texto,/Tres momentos seguidos/)
  assert.doesNotMatch(texto,/Dato privado|Peso privado/)
})
