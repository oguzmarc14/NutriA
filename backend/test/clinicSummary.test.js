const { test } = require('node:test')
const assert = require('node:assert/strict')
const { clinicSummary } = require('../src/utils/clinicSummary')
test('clinic summary excludes foreign histories and compares only two valid weights', () => {
  const patients = [{ _id: 'a', createdAt: '2026-01-10' }, { _id: 'b', createdAt: '2025-12-10' }, { _id: 'c', createdAt: '2025-08-10' }]
  const result = clinicSummary(patients, [{ _id: 'a', count: 2, firstWeight: 80, lastWeight: 78 }, { _id: 'b', count: 1, firstWeight: 70, lastWeight: 70 }, { _id: 'foreign', count: 3, firstWeight: 90, lastWeight: 60 }], new Date('2026-01-20T12:00:00Z'))
  assert.equal(result.totalPacientes, 3)
  assert.equal(result.bajaron, 1)
  assert.equal(result.sinHistorialComparable, 2)
  assert.equal(result.nuevosMes, 1)
  assert.equal(result.nuevosAnterior, 1)
  assert.deepEqual(result.meses.map(m => m.cantidad), [1, 0, 0, 0, 1, 1])
})
test('month boundaries follow Mexico City and empty charts keep six months', () => {
  const result = clinicSummary([{ _id: 'a', createdAt: '2026-02-01T02:00:00Z' }], [], new Date('2026-02-02T12:00:00Z'))
  assert.equal(result.nuevosMes, 0)
  assert.equal(result.nuevosAnterior, 1)
  assert.equal(clinicSummary([], []).meses.length, 6)
})
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path')
test('summary endpoint scopes both patient and measurement queries to the authenticated clinic', async () => {
  const routes = {}, guards = [], owner = { marker: 'ObjectId' }, id = { marker: 'patientId' }
  const deps = {
    express: { Router: () => ({ use: (...args) => guards.push(...args), get: (url, handler) => routes[url] = handler, put() {} }) },
    '../middleware/auth.middleware': { requireAuth: 'auth', allowRoles: (...roles) => roles.join(',') },
    '../utils/clinicSummary': require('../src/utils/clinicSummary'),
    '../models/Pacientes': { find: query => {
      assert.equal(query.nutritionist, owner); assert.equal(query.active, true)
      return { select: () => ({ lean: async () => [{ _id: id, createdAt: new Date() }] }) }
    } },
    '../models/Medicion': { aggregate: async pipeline => {
      assert.equal(pipeline[0].$match.nutritionist, owner)
      assert.equal(pipeline[0].$match.paciente.$in.length, 1)
      assert.equal(pipeline[0].$match.paciente.$in[0], id)
      assert.equal(pipeline[0].$match.peso.$gt, 0)
      return []
    } },
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/routes/clinica.routes.js'), 'utf8'), {
    require: name => { if (!(name in deps)) throw Error(name); return deps[name] }, module: { exports: {} },
  })
  assert.deepEqual(guards, ['auth', 'nutritionist'])
  let result
  await routes['/resumen']({ user: { _id: owner } }, { json: value => result = value }, error => { throw error })
  assert.equal(result.resumen.totalPacientes, 1)
})
