import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const vista = readFileSync(new URL('../src/pages/CitasPage.jsx',import.meta.url),'utf8')
const resumen = readFileSync(new URL('../src/components/citas/ResumenCitas.jsx',import.meta.url),'utf8')

test('en lista de citas el CTA dice Ver, nunca Ver o editar',()=>{
  assert.match(resumen,/>\s*Ver<ArrowUpRight/)
  assert.doesNotMatch(resumen,/Ver o editar/)
  assert.match(resumen,/onClick=\{\(\)=>onAbrir\(c\)\}/)
})
test('citas pasadas abren detalles de solo lectura, nunca un formulario editable',()=>{
  assert.match(vista,/const citaPasada = Boolean\(editing/)
  assert.match(vista,/Date\.parse\(originalStart\) <= now\.getTime\(\)/)
  assert.match(vista,/\{citaPasada \? \(/)
  assert.match(vista,/aria-label="Detalles de la cita"/)
  assert.match(vista,/No puedes cambiar sus datos ni eliminarla/)
  assert.match(vista,/\) : \(\s*<form onSubmit=\{save\}/)
  assert.match(vista,/if \(citaPasada\) \{setError\('Una cita pasada es de solo lectura/)
  assert.match(vista,/if \(!editing \|\| saving \|\| citaPasada\) return/)
})
test('marcar completada sigue disponible para cerrar seguimiento clínico pasado',()=>{
  assert.match(vista,/\['programada','confirmada'\]\.includes\(form\.estado\)/)
  assert.match(vista,/cambiarEstadoCita\('completada'\)/)
  assert.match(vista,/if \(citaPasada && !\(estado === 'completada'/)
  assert.match(vista,/Ver cita/)
  assert.match(vista,/Editar cita/)
})
