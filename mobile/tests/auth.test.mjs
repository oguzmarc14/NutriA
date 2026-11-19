import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { googleLoginError } from '../src/features/auth/googleLoginError.ts'

test('Google configuration errors give actionable Spanish copy', () => {
  assert.match(googleLoginError(Object.assign(new Error('native error'), { code: 10 })), /paquete y la firma/)
  assert.match(googleLoginError(new Error('DEVELOPER_ERROR: https:\/\/example.com')), /Google Cloud/)
  assert.doesNotMatch(googleLoginError(new Error('DEVELOPER_ERROR: https:\/\/example.com')), /https:/)
  assert.match(googleLoginError({ code: 'PLAY_SERVICES_NOT_AVAILABLE' }), /Servicios de Google Play/)
  assert.match(googleLoginError({ code: 'NETWORK_ERROR' }), /conexión/)
})

test('mobile sources have valid Spanish encoding', () => {
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (/\.tsx?$/.test(entry.name)) assert.doesNotMatch(readFileSync(path, 'utf8'), /Ã.|Â.|â€|�/, path)
    }
  }
  visit(fileURLToPath(new URL('../src', import.meta.url)))
})
