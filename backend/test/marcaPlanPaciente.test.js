const test = require('node:test')
const assert = require('node:assert/strict')
const Paciente = require('../src/models/Pacientes')
const Plan = require('../src/models/PlanAlimenticio')
const User = require('../src/models/User')
const { obtenerMarcaMiPlan } = require('../src/controllers/perfilPaciente.controller')

const pacienteId = 'a'.repeat(24)
const planId = 'b'.repeat(24)
const autorId = 'c'.repeat(24)

function respuesta() {
  return { statusCode: 200, set() {}, status(code) { this.statusCode = code; return this }, json(data) { this.data = data; return this } }
}

test('marca solo se consulta para una dieta del paciente autenticado', async t => {
  t.mock.method(Paciente, 'exists', async query => {
    assert.deepEqual(query, { _id: pacienteId, active: true })
    return { _id: pacienteId }
  })
  t.mock.method(Plan, 'findOne', query => {
    assert.deepEqual(query, { _id: planId, paciente: pacienteId })
    return { select: () => ({ lean: async () => null }) }
  })
  const autor = t.mock.method(User, 'findById', () => { throw new Error('No debe consultar autor') })
  const res = respuesta()
  await obtenerMarcaMiPlan({ user: { patient: pacienteId }, params: { id: planId } }, res, error => { throw error })
  assert.equal(res.statusCode, 404)
  assert.equal(autor.mock.callCount(), 0)
})

test('marca devuelve únicamente nombre y logo del consultorio de la dieta', async t => {
  t.mock.method(Paciente, 'exists', async () => ({ _id: pacienteId }))
  t.mock.method(Plan, 'findOne', () => ({ select: () => ({ lean: async () => ({ nutritionist: autorId }) }) }))
  t.mock.method(User, 'findById', id => {
    assert.equal(id, autorId)
    return { select: () => ({ lean: async () => ({ name: 'Autor', clinica: { nombre: 'Consultorio', logo: 'logo', campoPrivado: 'no' } }) }) }
  })
  const res = respuesta()
  await obtenerMarcaMiPlan({ user: { patient: pacienteId }, params: { id: planId } }, res, error => { throw error })
  assert.deepEqual(res.data, { clinica: { nombre: 'Consultorio', logo: 'logo' } })
})
