import test from 'node:test'
import assert from 'node:assert/strict'
import { measurementDifferences } from '../src/features/progress/MeasurementComparisonModel.ts'
test('comparison excludes missing metrics and preserves signed numeric differences',()=>{
  const before={_id:'1',peso:72,imc:24.3,grasaCorporal:20}
  const after={_id:'2',peso:70.5,imc:23.8}
  const differences=measurementDifferences(before,after)
  assert.deepEqual(differences.map(x=>[x.key,x.difference]),[['peso',-1.5],['imc',-0.5]])
})
