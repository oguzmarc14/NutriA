import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const state = file('src/features/patients/PatientWorkProvider.tsx')
const patients = file('src/features/patients/screens/PatientsScreen.tsx')
const menu = file('src/features/navigation/ClinicMenu.tsx')
const home = file('src/features/home/screens/ClinicDashboard.tsx')
test('patient context is per nutritionist and persisted securely', () => {
  assert.match(state, /session\?\.user\.role === 'nutritionist'/)
  assert.match(state, /SecureStore\.getItemAsync/)
  assert.match(state, /SecureStore\.setItemAsync/)
  assert.match(state, /SecureStore\.deleteItemAsync/)
})
test('patient choice confirms changes and keeps context before navigation', () => {
  assert.match(patients, /¿Cambiar de paciente\?/)
  assert.match(patients, /¿Finalizar atención\?/)
  assert.match(patients, /<AppDialog visible=\{!!selection\}/)
  assert.match(patients, /onPress=\{confirmSelection\}/)
  assert.match(patients, /start\(patient\)/)
  assert.match(patients, /pathname: '\/paciente'/)
})
test('clinical menu and dashboard reuse active patient for screens', () => {
  assert.match(menu, /patientDestinations\[item\.intent\]/)
  assert.match(menu, /patient: active\.id/)
  assert.match(home, /PACIENTE EN ATENCIÓN/)
})
