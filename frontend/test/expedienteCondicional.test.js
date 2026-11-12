import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CAMPOS_DESCRIPTIVOS, camposActivosDesdeExpediente } from '../src/utils/camposCondicionalesExpediente.js'

const page = readFileSync(new URL('../src/pages/ExpedientePage.jsx',import.meta.url),'utf8')
const model = readFileSync(new URL('../../backend/src/models/ExpedienteClinico.js',import.meta.url),'utf8')

test('16 campos de texto opcionales usan el selector No / Sí, con editor condicional',()=>{
  assert.equal(CAMPOS_DESCRIPTIVOS.length,16)
  assert.equal((page.match(/activo=\{camposConDetalle\.includes\('/g)||[]).length,16)
  assert.match(page,/onClick=\{\(\) => onActivo\(false\)\}/)
  assert.match(page,/onClick=\{\(\) => onActivo\(true\)\}/)
  assert.match(page,/aria-pressed=\{!activo\}/)
  assert.match(page,/aria-pressed=\{activo\}/)
  assert.match(page,/multilinea\s*\?\s*<textarea/)
  assert.match(page,/const payload = \{\s*\.\.\.expediente,\s*camposConDetalle/s)
})

test('expedientes existentes con alergias o medicación siguen mostrando Sí',()=>{
  const antiguo = {
    alergias:'Lactosa',
    antecedentesPersonales:'Antecedente antiguo',
    nutricion:{comidaFavorita:'Tacos',comidaDisgusta:''},
    deporte:{ejercicioRealizar:'Caminata'},
    observaciones:'Revisar evolución',
  }
  const activos = camposActivosDesdeExpediente(antiguo)
  for(const campo of ['alergias','antecedentesPersonales','nutricion.comidaFavorita',
    'deporte.ejercicioRealizar','observaciones']) assert.ok(activos.includes(campo))
  assert.equal(activos.includes('nutricion.comidaDisgusta'),false)
  assert.match(page,/setCamposConDetalle\(camposActivosDesdeExpediente\(data\.expediente\)\)/)
})

test('Sí permanece guardado aunque no se escriba todavía una descripción',()=>{
  const actual={camposConDetalle:['alergias','nutricion.bebidasAzucaradasSemana'],
    alergias:'',nutricion:{bebidasAzucaradasSemana:''}}
  assert.deepEqual(camposActivosDesdeExpediente(actual),
    ['alergias','nutricion.bebidasAzucaradasSemana'])
  assert.match(model,/camposConDetalle: \{/)
  assert.match(page,/setCamposConDetalle\(actual => activo/)
})

test('las horas y número de comidas no reciben la pregunta No/Sí',()=>{
  for(const label of ['Hora de primera comida','Hora de última comida',
    'Número de comidas al día','Días de entrenamiento por semana']) {
    const idx=page.indexOf('label="'+label+'"')
    assert.ok(idx>0, 'Falta '+label)
    assert.doesNotMatch(page.slice(idx,idx+110),/activo=\{camposConDetalle/)
  }
  assert.match(page,/if \(!siempreVisible && type === 'text'\)/)
  assert.match(page,/type === 'text'/)
  assert.match(page,/label="Describe el objetivo"\s+siempreVisible/)
  assert.match(page,/label="Otro lugar"\s+siempreVisible/)
})

test('elegir No limpia el texto local, no borra información al abrir el expediente',()=>{
  assert.match(page,/if \(!activo\) \{/)
  assert.match(page,/if \(campo\) manejarGrupo\(grupo,campo,''\)/)
  assert.match(page,/else manejarCampo\(grupo,''\)/)
  assert.match(page,/valor === false && detalles\[grupo\]\?\.\[0\] === campo/)
  assert.match(page,/const \{ data \} = await client\.put/)
  assert.match(page,/Guardar expediente/)
})
