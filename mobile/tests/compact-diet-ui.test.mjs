import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL('../src/features/nutrition/plans/' + path, import.meta.url), 'utf8')
const search = source('InlineFoodSearch.tsx')
const editor = source('MealEditor.tsx')

test('mobile search uses accessible compact add action instead of full-width result buttons', () => {
  assert.match(search, /accessibilityLabel=\{\x60Agregar \$\{food\.nombre\} a la preparación\x60\}/)
  assert.match(search, /width: 44, height: 44/)
  assert.doesNotMatch(search, /label="Agregar alimento"/)
})
test('meal preparations stay in horizontal scroll with accessible selected states', () => {
  assert.match(editor, /<ScrollView horizontal/)
  assert.match(editor, /accessibilityState=\{\{ selected \}\}/)
  assert.match(editor, /Platillos y bebidas/)
})
test('portions are compact, validate minimum and keep optional notes collapsed', () => {
  assert.match(editor, /function adjustPortion\(/)
  assert.match(editor, /Math\.max\(0\.1,/)
  assert.match(editor, /Notas y cantidad exacta/)
  assert.match(editor, /\{expanded && <View/)
  assert.match(editor, /accessibilityLabel=\{\x60Reducir porciones de/)
})
test('removal is explicit and destructive meal removal requires confirmation', () => {
  assert.match(editor, /Alert\.alert\('Eliminar comida'/)
  assert.match(editor, /accessibilityLabel=\{\x60Quitar \$\{food\.nombre\}\x60\}/)
  assert.match(editor, /Alert\.alert\('Eliminar preparación'/)
})
