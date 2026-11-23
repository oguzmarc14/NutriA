const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const { z } = require('zod')
const utils = require('../src/utils/seguimiento-diario.utils')
const PID = 'aaaaaaaaaaaaaaaaaaaaaaaa', PLAN = 'bbbbbbbbbbbbbbbbbbbbbbbb', MEAL = 'cccccccccccccccccccccccc'
function fixture({ owned = true, current = true } = {}) {
  const records = new Map(), calls = []
  const plan = { _id: PLAN, fechaInicio: new Date('2026-11-01T00:00:00Z'), comidas: { id: value => value === MEAL ? { _id: MEAL, nombre: 'Desayuno' } : null } }
  const deps = {
    zod: { z }, '../utils/seguimiento-diario.utils': utils, '../models/Medicion': {},
    '../models/Pacientes': { findOne: async query => { calls.push(query); return owned ? { _id: PID, nutritionist: 'staff' } : null } },
    '../models/PlanAlimenticio': {
      findOne: async query => query._id === PLAN ? plan : null,
      find: query => ({ select: () => ({ lean: async () => {
        assert.ok(query.fechaInicio.$lt instanceof Date)
        return [{ _id: current ? PLAN : PID, fechaInicio: plan.fechaInicio }]
      } }) }),
    },
    '../models/SeguimientoComida': { findOneAndUpdate: async (filter, update) => {
      const key = [filter.paciente, filter.plan, filter.comida, filter.fecha].join(':')
      const registro = { _id: key, ...filter, ...update }; records.set(key, registro); return registro
    } },
  }
  const mod = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/seguimientoComida.controller.js'), 'utf8'), {
    require: name => { if (!(name in deps)) throw Error(name); return deps[name] }, module: mod, Date, Number, Promise, Set, Map, String,
  })
  async function save(overrides = {}) {
    const res = { statusCode: 200, status(value) { this.statusCode = value; return this }, json(value) { this.body = value; return this } }
    let error
    await mod.exports.guardarMiSeguimiento({ user: { patient: PID }, body: {
      planId: PLAN, comidaId: MEAL, fecha: '2026-11-02', estado: 'completada', agrado: 'neutral', ...overrides,
    } }, res, value => { error = value })
    if (error) throw error
    return res
  }
  return { save, records, calls }
}
test('meal records persist on separate days and same-day updates keep one record', async () => {
  const f = fixture()
  assert.equal((await f.save()).statusCode, 200)
  assert.equal((await f.save({ fecha: '2026-11-03' })).statusCode, 200)
  assert.equal(f.records.size, 2)
  await f.save({ estado: 'parcial', comentario: 'Cambio' })
  assert.equal(f.records.size, 2)
  assert.equal([...f.records.values()].find(item => item.fecha === '2026-11-02').estado, 'parcial')
})
test('dates before the plan, impossible dates, and another effective plan cannot be saved', async () => {
  const f = fixture()
  assert.equal((await f.save({ fecha: '2026-10-31' })).statusCode, 400)
  assert.equal((await f.save({ fecha: '2026-02-30' })).statusCode, 400)
  assert.equal(f.records.size, 0)
  const newer = fixture({ current: false })
  assert.equal((await newer.save()).statusCode, 409)
  assert.equal(newer.records.size, 0)
})
test('patient and meal ownership stay enforced and body patient cannot change the owner', async () => {
  const denied = fixture({ owned: false })
  assert.equal((await denied.save()).statusCode, 404)
  const f = fixture()
  assert.equal((await f.save({ comidaId: PID })).statusCode, 404)
  await f.save({ paciente: 'other-patient', nutritionist: 'other-staff' })
  assert.equal([...f.records.values()][0].paciente, PID)
  assert.equal([...f.records.values()][0].nutritionist, 'staff')
})
test('summary counts all meal slots once per additional registered day', () => {
  const planes = [{ _id: PLAN, fechaInicio: '2026-11-01', comidas: [{}, {}] }]
  assert.equal(utils.comidasProgramadas([], planes), 2)
  assert.equal(utils.comidasProgramadas([{ plan: PLAN, fecha: '2026-11-02' }, { plan: PLAN, fecha: '2026-11-02' }], planes), 4)
  assert.equal(utils.comidasProgramadas([{ plan: PLAN, fecha: '2026-11-01' }], planes), 2)
})
test('effective plans compare calendar days and then creation date', () => {
  const result = utils.planVigente([
    { _id: 'older', fechaInicio: '2026-11-01T18:00:00Z', createdAt: '2026-10-30' },
    { _id: 'newer', fechaInicio: '2026-11-01T00:00:00Z', createdAt: '2026-10-31' },
  ])
  assert.equal(result._id, 'newer')
})
test('editing diet labels does not rewrite the dates of tracking history', async () => {
  const history = [{ fecha: '2026-11-02' }, { fecha: '2026-11-03' }]
  const deps = { mongoose: {}, zod: { z }, '../models/ExpedienteClinico': {}, '../models/Medicion': {}, '../models/Alimento': {},
    '../models/Pacientes': { findOne: async () => ({ _id: PID }) },
    '../models/PlanAlimenticio': { findOneAndUpdate: async () => ({ _id: PLAN, fechaInicio: new Date('2026-12-01'), comidas: [{ _id: MEAL, nombre: 'Nuevo desayuno', platillo: '' }] }) },
    '../models/SeguimientoComida': { deleteMany: async () => {}, updateMany: async (filter, update) => {
      assert.equal(Object.hasOwn(update, 'fecha'), false)
      history.forEach(item => Object.assign(item, update))
    } },
  }
  const mod = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/planAlimenticio.controller.js'), 'utf8'), {
    require: name => { if (!(name in deps)) throw Error(name); return deps[name] }, module: mod, Date, Number, Promise, Set,
  })
  let error
  await mod.exports.actualizarPlanAlimenticio({ params: { pacienteId: PID, planId: PLAN }, user: { id: 'staff' }, body: { nombre: 'Plan nuevo', fechaInicio: '2026-12-01', comidas: [{
      _id: MEAL, nombre: 'Nuevo desayuno', alimentos: [{
        tipo: 'personalizado', nombre: 'Tortilla casera', cantidad: 1,
        nutrimentos: { kcal: 70, proteina: 2, carbohidratos: 14, grasas: 1 },
      }],
    }] } },
    { json: () => {}, status: () => { throw Error('unexpected status') } }, value => { error = value })
  if (error) throw error
  assert.deepEqual(history.map(item => item.fecha), ['2026-11-02', '2026-11-03'])
})
