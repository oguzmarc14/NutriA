import assert from 'node:assert/strict'
import test from 'node:test'
import { clinicalForm, clinicalUpdate } from '../src/features/nutrition/clinicalRecordModel.ts'

test('partial clinical updates preserve untouched sections and explicit flags without transmitting server fields', () => {
  const base = { _id: 'owned', nutritionist: 'staff', alergias: '', observaciones: 'Anterior',
    nutricion: { aguaPorDia: 2 }, deporte: { tipo: 'Caminar' }, camposConDetalle: ['alergias', 'nutricion.intoleranciasAlimentarias'] }
  const before = structuredClone(base)
  const form = clinicalForm(base); form.observaciones = 'Actualizada'
  assert.deepEqual(clinicalUpdate(base, form), { observaciones: 'Actualizada',
    camposConDetalle: ['alergias', 'nutricion.intoleranciasAlimentarias', 'observaciones'] })
  assert.deepEqual(base, before)
})
test('clearing an edited clinical field removes its flag and leaves unrelated flags intact', () => {
  const base = { alergias: 'Detalle anterior', camposConDetalle: ['alergias', 'deporte.ejercicioRealizar'] }
  const form = clinicalForm(base); form.alergias = ''
  assert.deepEqual(clinicalUpdate(base, form), { alergias: '', camposConDetalle: ['deporte.ejercicioRealizar'] })
})
test('an empty form cannot create a placeholder clinical record', () => {
  assert.throws(() => clinicalUpdate(null, clinicalForm(null)), /datos clínicos/)
  const form = clinicalForm(null); form.observaciones = '  Datos revisados  '
  assert.deepEqual(clinicalUpdate(null, form), { observaciones: 'Datos revisados', camposConDetalle: ['observaciones'] })
})

test('positive optional clinical fields retain a Sí without forcing free text',()=>{
  const form=clinicalForm(null)
  const result=clinicalUpdate(null,form,['alergias'])
  assert.deepEqual(result,{camposConDetalle:['alergias']})
})
test('changing Sí to No clears hidden notes and preserves unrelated clinical history',()=>{
  const base={alergias:'Pólen',camposConDetalle:['alergias','antecedentesFamiliares'],
    tratamientoFarmacologico:{usa:true,descripcion:'Anterior'}}
  const form=clinicalForm(base)
  form.alergias=''
  form['tratamientoFarmacologico.usa']='false'
  form['tratamientoFarmacologico.descripcion']=''
  const result=clinicalUpdate(base,form,['antecedentesFamiliares'])
  assert.equal(result.alergias,'')
  assert.deepEqual(result.tratamientoFarmacologico,{usa:false,descripcion:''})
  assert.deepEqual(result.camposConDetalle,['antecedentesFamiliares'])
})
test('goals and training choices are transmitted with backend enum keys',()=>{
  const form=clinicalForm(null)
  form['nutricion.objetivos']='salud,incremento_masa'
  form['nutricion.objetivoPrincipal']='salud'
  form['deporte.nivelExperiencia']='intermedio'
  const update=clinicalUpdate(null,form)
  assert.deepEqual(update.nutricion.objetivos,['salud','incremento_masa'])
  assert.equal(update.nutricion.objetivoPrincipal,'salud')
  assert.equal(update.deporte.nivelExperiencia,'intermedio')
})
