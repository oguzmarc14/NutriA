import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const account = read('app/cuenta.tsx')
const clinic = read('src/features/clinic/screens/ClinicProfileScreen.tsx')
const config = read('app.config.js')
test('nutritionist account opens clinic and route is role-protected', () => {
  assert.match(account, /session\.user\.role === 'nutritionist'/)
  assert.match(account, /router\.push\('\/mi-clinica'\)/)
  assert.match(read('app/_layout.tsx'), /name="mi-clinica"/)
})
test('clinic profile persists name, professional name and logo in existing API', () => {
  assert.match(clinic, /ImagePicker\.launchImageLibraryAsync/)
  assert.match(clinic, /data:image\/jpeg;base64,/)
  assert.match(clinic, /request<\{ clinica: Clinic \}>\('\/clinica'/)
  assert.match(clinic, /method: 'PUT'/)
  assert.match(clinic, /logo: form\.logo/)
  assert.match(config, /expo-image-picker/)
})
