import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = file => readFileSync(new URL('../' + file, import.meta.url),'utf8')

test('after saving a diet, nutritionist may copy it privately with name and date', () => {
  const screen=read('src/features/nutrition/screens/PlanEditorScreen.tsx')
  assert.match(screen,/¿Deseas guardar una copia reutilizable en Mis dietas\?/)
  assert.match(screen,/request\('\/community\/mis-dietas'/)
  assert.match(screen,/body: \{ planId, nombre \}/)
  assert.match(screen,/templateResource\.data\?\.plan/)
  assert.match(screen,/duplicatePlan\(templatePlan\)/)
})
test('Community has a diet library independent from recipes',()=>{
  const c=read('app/comunidad.tsx')
  assert.match(c,/section === 'dietas'/)
  assert.match(c,/\/community\/mis-dietas/)
  assert.match(c,/label="Mis dietas"/)
  assert.match(c,/template: item\._id/)
  assert.match(c,/patient: active\.id/)
})
test('backend stores only author-owned diet copies with source plan scoped to author',()=>{
  const route=read('../backend/src/routes/community.routes.js')
  assert.match(route,/Plan\.findOne\(\{/)
  assert.match(route,/nutritionist: req\.user\._id/)
  assert.match(route,/DietaGuardada\.findOne\(\{ _id: req\.params\.id, autor: req\.user\._id \}/)
})
