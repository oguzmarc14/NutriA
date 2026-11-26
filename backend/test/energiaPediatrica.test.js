const test = require('node:test')
const assert = require('node:assert/strict')
const { estimarEnergiaPediatrica, calcularEnergiaPediatrica, edadEnMedicion } = require('../src/utils/energiaPediatrica')

test('la estimación infantil distingue las bandas de edad por fecha y requiere nacimiento antes del año', () => {
  const input = { edad: 0, sexo: 'female', peso: 5, estaturaCm: 57, nacimiento: '2025-01-10' }
  const before = estimarEnergiaPediatrica({ ...input, fechaMedicion: '2025-04-09' })
  const after = estimarEnergiaPediatrica({ ...input, fechaMedicion: '2025-04-10' })
  assert.ok(Math.abs(before - after - 120) < 1)
  assert.equal(estimarEnergiaPediatrica({ ...input, nacimiento: null, fechaMedicion: '2025-04-10' }), null)
})

test('la estimación de escolares y adolescentes aplica actividad y depósito de crecimiento por edad', () => {
  const child = { edad: 9, sexo: 'female', peso: 30, estaturaCm: 135, actividad: 'activa' }
  assert.equal(Math.round(estimarEnergiaPediatrica(child) * 100), 177530)
  const teen = { edad: 14, sexo: 'male', peso: 52, estaturaCm: 163, actividad: 'ligera' }
  assert.equal(Math.round(estimarEnergiaPediatrica(teen) * 100), 255026)
  assert.equal(estimarEnergiaPediatrica({ ...teen, actividad: undefined }), null)
  assert.equal(estimarEnergiaPediatrica({ ...teen, edad: 19 }), null)
})

test('la fecha de medición determina la banda aunque el registro tenga otra edad', () => {
  const datos = { edad: 16, sexo: 'female', peso: 68, estaturaCm: 154, actividad: 'ligera', nacimiento: '2008-05-08' }
  const caso = calcularEnergiaPediatrica({ ...datos, fechaMedicion: '2025-05-08' })
  assert.equal(caso.detalle.edadAnios, 17)
  assert.equal(caso.detalle.rangoEdad, '14 a <19 años')
  assert.equal(Math.round(caso.kcal * 100), 231243)
  assert.match(caso.detalle.ecuacion, /297\.54.*22\.25.*12\.77.*14\.73.*20/)
  assert.equal(calcularEnergiaPediatrica({ ...datos, fechaMedicion: '2027-05-07' }).detalle.rangoEdad, '14 a <19 años')
  assert.equal(calcularEnergiaPediatrica({ ...datos, fechaMedicion: '2027-05-08' }), null)
  assert.equal(edadEnMedicion(17, datos.nacimiento, '2008-05-07'), null)
})
