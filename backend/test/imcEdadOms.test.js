const test = require('node:test')
const assert = require('node:assert/strict')
const { evaluarImcParaEdad } = require('../src/utils/imcEdadOms')

const registro = (fecha, peso, sex = 'male', birthDate = '2020-01-01') =>
  evaluarImcParaEdad({ fecha, peso, estatura: 1, edad: 0 }, { birthDate, sex })

test('medianas de las tablas OMS producen P50 en ambos grupos de edad', () => {
  assert.deepEqual(registro('2022-01-01', 16.0189), {
    estado: 'disponible', percentil: '50', z: 0, referencia: 'OMS 2006',
  })
  assert.deepEqual(registro('2030-01-01', 16.6133, 'female'), {
    estado: 'disponible', percentil: '50', z: 0, referencia: 'OMS 2007',
  })
})

test('la transición diaria a mensual conserva las dos fechas contiguas', () => {
  const fecha = dias => new Date(Date.UTC(2020, 0, 1 + dias))
  assert.equal(registro(fecha(1856), 15.184).referencia, 'OMS 2006')
  assert.equal(registro(fecha(1857), 15.2641).referencia, 'OMS 2007')
})

test('el sexo cambia el percentil y la edad sale de la fecha de medición', () => {
  assert.notEqual(registro('2030-01-01', 20).percentil, registro('2030-01-01', 20, 'female').percentil)
  assert.equal(registro('2038-01-01', 20), null)
})

test('los datos insuficientes, lactantes y valores implausibles no generan percentil', () => {
  assert.equal(registro('2021-12-31', 12).estado, 'requiere-peso-longitud')
  assert.equal(registro('2019-12-31', 12).estado, 'fechas-invalidas')
  assert.equal(registro(null, 15).estado, 'faltan-fechas')
  assert.equal(registro('2030-01-01', 16.6, 'unknown').estado, 'falta-sexo')
  assert.equal(registro('2030-01-01', 85).estado, 'revisar-medicion')
})

test('los límites +1 y +2 de la tabla OMS 2007 coinciden con la CDF normal', () => {
  assert.equal(registro('2025-02-01', 16.645).percentil, '84.1')
  assert.equal(registro('2025-02-01', 18.259).percentil, '97.7')
})
