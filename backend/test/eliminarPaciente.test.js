const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/services/eliminarPaciente.service.js'), 'utf8')
const UID = '507f1f77bcf86cd799439011'
const PID = '507f191e810c19729de860ea'

function fixture({ found = true, eventId = null, calendarOk = true, calendarError = false,
                   failedModel = null, transactional = true, patientDeleted = true } = {}) {
  const steps = []
  const committed = []
  let sessions = 0
  let ended = 0
  let calendarCalls = 0
  const session = {
    async withTransaction(task) {
      if (!transactional) throw new Error('Transaction numbers are only allowed on a replica set member')
      const pending = []
      this.pending = pending
      await task()
      committed.push(...pending)
    },
    async endSession() { ended++ },
  }
  const deleteModel = name => ({
    deleteMany(filter) {
      return { async session(s) {
        assert.equal(s, session)
        steps.push({ name, filter })
        if (name === failedModel) throw new Error('Error simulado de MongoDB')
        session.pending.push(name)
        return { deletedCount: 1 }
      } }
    },
  })
  const models = {
    '../models/User': deleteModel('User'),
    '../models/Medicion': deleteModel('Medicion'),
    '../models/ExpedienteClinico': deleteModel('ExpedienteClinico'),
    '../models/PlanAlimenticio': deleteModel('PlanAlimenticio'),
    '../models/SeguimientoComida': deleteModel('SeguimientoComida'),
    '../models/CalculoNutricional': deleteModel('CalculoNutricional'),
    '../models/Cita': {
      ...deleteModel('Cita'),
      find(query) {
        assert.equal(query.patient, PID)
        assert.equal(query.nutritionist, UID)
        return { select(field) {
          assert.equal(field, '+calendarEventId')
          return { async lean() { return [{ _id: 'cita', nutritionist: UID, calendarEventId: eventId }] } }
        } }
      },
    },
    '../models/Pago': deleteModel('Pago'),
    '../models/Pacientes': {
      async exists(query) {
        assert.equal(query._id, PID)
        assert.equal(query.nutritionist, UID)
        return found ? { _id: PID } : null
      },
      deleteOne(query) {
        assert.equal(query._id, PID)
        assert.equal(query.nutritionist, UID)
        return { async session(s) {
          assert.equal(s, session)
          steps.push({ name: 'Paciente', filter: query })
          if (failedModel === 'Paciente') throw new Error('Error simulado de MongoDB')
          if (patientDeleted) session.pending.push('Paciente')
          return { deletedCount: patientDeleted ? 1 : 0 }
        } }
      },
    },
  }
  const deps = {
    mongoose: {
      startSession: async () => { sessions++; return session },
    },
    ...models,
    './calendar.service': {
      deleteAppointment: async () => {
        calendarCalls++
        if (calendarError) throw new Error('Google Calendar respondió 503')
        return calendarOk
      },
    },
  }
  const context = {
    module: { exports: {} },
    require(name) {
      assert.ok(Object.hasOwn(deps, name), 'Import inesperado: ' + name)
      return deps[name]
    },
    console: { error() {} },
  }
  vm.runInNewContext(source, context, { filename: 'eliminarPaciente.service.js' })
  return {
    eliminar: () => context.module.exports.eliminarPacienteConDatos({
      pacienteId: PID, nutritionistId: UID,
    }),
    steps, committed,
    get sessions() { return sessions },
    get ended() { return ended },
    get calendarCalls() { return calendarCalls },
  }
}
test('elimina de forma transaccional todos los registros asociados y después al paciente', async () => {
  const f = fixture({ eventId: 'google-evento' })
  const result = await f.eliminar()
  assert.match(result.message, /eliminados correctamente/)
  assert.deepEqual(f.committed, [
    'SeguimientoComida', 'CalculoNutricional', 'Pago', 'Cita',
    'PlanAlimenticio', 'Medicion', 'ExpedienteClinico', 'User', 'Paciente',
  ])
  assert.equal(f.calendarCalls, 1)
  assert.equal(f.sessions, 1)
  assert.equal(f.ended, 1)
  assert.equal(f.steps.find(s => s.name === 'Cita').filter.patient, PID)
  assert.equal(f.steps.find(s => s.name === 'Pago').filter.nutritionist, UID)
  assert.equal(f.steps.find(s => s.name === 'User').filter.role, 'patient')
})
test('sin citas sincronizadas no se requiere Google Calendar', async () => {
  const f = fixture()
  await f.eliminar()
  assert.equal(f.calendarCalls, 0)
})
test('no permite eliminar un paciente que no pertenece al consultorio', async () => {
  const f = fixture({ found: false })
  await assert.rejects(f.eliminar(), e => e.statusCode === 404)
  assert.equal(f.sessions, 0)
  assert.equal(f.committed.length, 0)
})
test('si Google Calendar está desconectado no borra ningún documento', async () => {
  const f = fixture({ eventId: 'evento-externo', calendarOk: false })
  await assert.rejects(f.eliminar(), e => e.statusCode === 409)
  assert.equal(f.sessions, 0)
  assert.deepEqual(f.committed, [])
})
test('si Google falla no se elimina el paciente ni su historial', async () => {
  const f = fixture({ eventId: 'evento-externo', calendarError: true })
  await assert.rejects(f.eliminar(), e => e.statusCode === 502)
  assert.deepEqual(f.committed, [])
  assert.equal(f.sessions, 0)
})
test('una falla durante la transacción revierte la eliminación parcial', async () => {
  const f = fixture({ failedModel: 'CalculoNutricional' })
  await assert.rejects(f.eliminar(), /Error simulado/)
  assert.deepEqual(f.committed, [])
  assert.equal(f.ended, 1)
})
test('si el paciente cambia antes de confirmar se revierte la transacción', async () => {
  const f = fixture({ patientDeleted: false })
  await assert.rejects(f.eliminar(), e => e.statusCode === 409)
  assert.deepEqual(f.committed, [])
})
test('en una base sin transacciones la eliminación se rechaza, no se degrada a borrado parcial', async () => {
  const f = fixture({ transactional: false })
  await assert.rejects(f.eliminar(), e => e.statusCode === 503)
  assert.deepEqual(f.committed, [])
  assert.equal(f.ended, 1)
})
