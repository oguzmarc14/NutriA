import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buscarAvisosAlimento, criteriosAlimentarios } from '../src/utils/avisosAlimentos.js'

test('detecta huevo y fresa del catálogo al registrar alergias en texto libre', () => {
  for (const alergias of ['huevo, fresas', 'Alergias alimentarias: huevo y fresas', 'Huevo como alérgico; fresas', 'Alérgica al huevo • Fresas']) {
    const criterios = criteriosAlimentarios({ alergias })
    assert.equal(buscarAvisosAlimento('Clara de huevo', criterios)[0]?.tipo, 'Posible alergia', alergias)
    assert.equal(buscarAvisosAlimento('Fresa entera', criterios)[0]?.tipo, 'Posible alergia', alergias)
    assert.deepEqual(buscarAvisosAlimento('Fresadora', criterios), [])
  }
})

test('distingue intolerancias, disgustos y campos sin datos', () => {
  const criterios = criteriosAlimentarios({
    alergias: null,
    nutricion: { intoleranciasAlimentarias: 'Lactosa', comidaDisgusta: 'No le gusta el pollo' },
  })
  assert.equal(buscarAvisosAlimento('Pollo asado', criterios)[0]?.tipo, 'Disgusto registrado')
  assert.equal(buscarAvisosAlimento('Leche con lactosa', criterios)[0]?.tipo, 'Posible intolerancia')
  assert.deepEqual(buscarAvisosAlimento('Arroz', criterios), [])
})
