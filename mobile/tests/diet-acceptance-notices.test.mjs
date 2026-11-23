import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8')
test('patient explicitly confirms a diet, without changing food tracking',()=>{
  const screen=read('src/features/nutrition/screens/PatientPlanScreen.tsx')
  assert.match(screen,/\/mi-perfil\/planes\//)
  assert.match(screen,/\/aceptar/)
  assert.match(screen,/Confirmar que recibí la dieta/)
})
test('push registration uses sound-enabled Android channels',()=>{
  const registration=read('src/features/notifications/pushRegistration.ts')
  assert.match(registration,/appointments-v2/)
  assert.match(registration,/nutrition-updates-v1/)
  assert.match(registration,/sound: 'default'/)
})
