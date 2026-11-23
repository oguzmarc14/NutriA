import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = f => readFileSync(new URL('../' + f, import.meta.url),'utf8')
test('native progress includes opt-in gamification driven by existing role-scoped API',()=>{
  const panel = read('src/features/gamification/GamificationPanel.tsx')
  assert.match(read('src/features/progress/screens/PatientProgressScreen.tsx'), /<GamificationPanel\s*\/>/)
  assert.match(panel,/\/gamificacion\/mi-resumen/)
  assert.match(panel,/\/gamificacion\/mi-preferencia/)
  assert.match(panel,/method: 'PATCH', body: \{ participa \}/)
  assert.match(panel,/permitidaPorNutriologo/)
  assert.match(panel,/recursos|registros|reconocimientos/i)
})
test('nutritionist may pause, but cannot opt in for the patient',()=>{
  const panel=read('src/features/gamification/NutritionistGamificationControl.tsx')
  assert.match(read('src/features/patients/screens/PatientDetailScreen.tsx'), /<NutritionistGamificationControl/)
  assert.match(panel,/\/gamificacion\/paciente\//)
  assert.match(panel,/permitidaPorNutriologo/)
  assert.doesNotMatch(panel,/body:\s*\{ participa/)
})
