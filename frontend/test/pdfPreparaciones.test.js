import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const code = readFileSync(new URL('../src/utils/exportarPlanPDF.js',import.meta.url),'utf8')
test('PDF groups ingredients by actual dish or drink, no legacy flat-only list',()=>{
  assert.match(code,/agruparPreparaciones\(comida\)/)
  assert.match(code,/group\.alimentos\.map/)
  assert.match(code,/Bebida/)
  assert.match(code,/Platillo/)
})
