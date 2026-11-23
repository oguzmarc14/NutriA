import test from 'node:test'
import assert from 'node:assert/strict'
import { agruparPreparaciones } from '../src/utils/agruparPreparaciones.js'

test('drink and dish show their own ingredients, no duplicates',()=>{
  const groups=agruparPreparaciones({preparaciones:[
    {id:'p',nombre:'Huevos',tipo:'platillo'},{id:'b',nombre:'Licuado',tipo:'bebida'},
  ],alimentos:[{nombre:'Huevo',preparacionId:'p'},{nombre:'Leche',preparacionId:'b'}]})
  assert.deepEqual(groups.map(g=>[g.nombre,g.alimentos.map(f=>f.nombre)]),[
    ['Huevos',['Huevo']],['Licuado',['Leche']],
  ])
})
test('legacy food without preparation remains visible in first group',()=>{
  const groups=agruparPreparaciones({platillo:'Almuerzo',
    alimentos:[{nombre:'Tortilla',cantidad:1}]})
  assert.equal(groups[0].nombre,'Almuerzo')
  assert.equal(groups[0].alimentos[0].nombre,'Tortilla')
  assert.deepEqual(agruparPreparaciones({preparaciones:[{id:'a',nombre:'Sin alimentos',tipo:'platillo'}],alimentos:[]}),[])
})
