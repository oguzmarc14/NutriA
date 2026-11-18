import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const leer = ruta => readFileSync(new URL('../' + ruta, import.meta.url), 'utf8')
const vite = leer('vite.config.js')
const paquete = JSON.parse(leer('package.json'))
const lock = JSON.parse(leer('package-lock.json'))
const auditoria = readFileSync(new URL('../../.github/workflows/security.yml', import.meta.url), 'utf8')

test('Vite solo expone dev y preview a la interfaz local por defecto', () => {
  assert.match(vite, /server:\s*\{\s*host: '127\.0\.0\.1',\s*strictPort: true/)
  assert.match(vite, /preview:\s*\{\s*host: '127\.0\.0\.1',\s*strictPort: true/)
  assert.doesNotMatch(vite, /0\.0\.0\.0/)
})

test('Vite, tinyglobby y picomatch no se instalan como dependencias de ejecución', () => {
  assert.equal(lock.packages['node_modules/vite']?.dev, true)
  assert.equal(lock.packages['node_modules/tinyglobby']?.dev, true)
  assert.equal(lock.packages['node_modules/picomatch']?.dev, true)
  assert.equal(paquete.dependencies?.vite, undefined)
  assert.ok(Number(lock.packages['node_modules/vite'].version.split('.')[0]) >= 8)
})

test('la auditoría mantiene chequeos de ejecución y desarrollo sin ocultar alertas', () => {
  assert.ok(auditoria.includes('npm audit --omit=dev --audit-level=high'))
  assert.ok(auditoria.includes('npm audit --audit-level=high'))
  assert.doesNotMatch(auditoria, /continue-on-error:\s*true/)
})
