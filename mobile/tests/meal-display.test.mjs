import test from 'node:test'
import assert from 'node:assert/strict'
import {mealPreparationGroups} from '../src/features/nutrition/plans/mealDisplay.ts'
import {planDocument} from '../src/features/nutrition/plans/planDocument.ts'
const food=(name,id)=>({nombre:name,preparacionId:id,cantidad:1,tipo:'personalizado',nutrimentos:{kcal:50,proteina:1,carbohidratos:1,grasas:1}})
const meal={nombre:'Desayuno',platillo:'',preparaciones:[
  {id:'plate',nombre:'Huevos',tipo:'platillo'}, {id:'drink',nombre:'Licuado',tipo:'bebida'},
],alimentos:[food('Huevo','plate'),food('Leche','drink'),food('Plátano','drink')]}
test('each dish or drink lists only its own ingredients',()=>{
  const groups=mealPreparationGroups(meal)
  assert.deepEqual(groups.map(g=>[g.nombre,g.alimentos.map(x=>x.nombre)]),[
    ['Huevos',['Huevo']],['Licuado',['Leche','Plátano']],
  ])
  assert.equal(meal.alimentos.length,3)
})
test('legacy orphan food is shown, not dropped or duplicated',()=>{
  const groups=mealPreparationGroups({...meal,alimentos:[food('Tortilla','old-missing')]})
  assert.deepEqual(groups.map(g=>g.alimentos.map(f=>f.nombre)),[['Tortilla']])
})
test('PDF contains drink ingredients, not empty placeholder, and escapes patient content',()=>{
  const html=planDocument({_id:'a',nombre:'Dieta de prueba',fechaInicio:'2026-11-22',
    createdAt:'2026-11-22',comidas:[meal]},'<test>')
  assert.match(html,/Huevos/)
  assert.match(html,/Licuado/)
  assert.match(html,/Plátano/)
  assert.match(html,/&lt;test&gt;/)
  assert.doesNotMatch(html,/requiere revisión/)
})
