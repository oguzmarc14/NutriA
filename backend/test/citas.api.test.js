// Contratos REST ejecutados sobre el controlador real con dependencias aisladas.
// Ningún caso se conecta a MongoDB, Render ni a Google Calendar.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { z } = require('zod')
const utils = require('../src/utils/citas.utils')

const source = fs.readFileSync(path.join(__dirname, '../src/routes/citas.routes.js'), 'utf8')
const UID = '507f1f77bcf86cd799439011'
const PID = '507f191e810c19729de860ea'
const AID = '507f191e810c19729de860eb'
const ISO = () => new Date(Date.now() + 72 * 3600_000).toISOString()
const ORIGEN = () => new Date(Date.now() - 72 * 3600_000).toISOString()

function fixture({ calendarSync = true, deleteError = null, existing = true, inicio = ISO(),
                   estado = 'confirmada', conEvento = true, conflicto = false } = {}) {
  const handlers = new Map()
  const calls = { deleted: false, saved: false, scoped: false, synced: false, created: false, reminderReset: false }

  const record = {
    _id: AID, nutritionist: UID, patient: PID,
    inicio: new Date(inicio), fin: new Date(new Date(inicio).getTime() + 3600_000),
    estado, tipo: 'seguimiento', notas: '',
    zonaHoraria: 'America/Mexico_City',
    calendarEventId: conEvento ? 'google-event-test' : null,
    recordatorio24hEnviado: new Date('2026-01-01T00:00:00Z'),
    recordatorio2hEnviado: new Date('2026-01-01T00:00:00Z'),
    async deleteOne() { calls.deleted = true },
    async save() {
      calls.saved = true
      calls.reminderReset = this.recordatorio24hEnviado === null
      return this
    },
    toObject() { return { _id: this._id, estado: this.estado, notas: this.notas, inicio: this.inicio } },
  }

  const routes = {
    use() {},
    get(name, fn) { handlers.set('GET ' + name, fn) },
    post(name, fn) { handlers.set('POST ' + name, fn) },
    put(name, fn) { handlers.set('PUT ' + name, fn) },
    patch(name, fn) { handlers.set('PATCH ' + name, fn) },
    delete(name, fn) { handlers.set('DELETE ' + name, fn) },
  }
  const Cita = {
    findOne(query) {
      calls.scoped = query.nutritionist === UID && query._id === AID
      const response = existing ? record : null
      return {
        select: async () => response,
        then(resolve, reject) { return Promise.resolve(response).then(resolve, reject) },
      }
    },
    exists: async () => conflicto ? { _id: 'otra' } : null,
    async create(data) {
      calls.created = true
      Object.assign(record, data)
      return record
    },
  }
  const deps = {
    express: { Router: () => routes },
    mongoose: { isValidObjectId: (id) => /^[a-f\d]{24}$/i.test(id) },
    zod: { z },
    '../middleware/auth.middleware': { requireAuth() {}, allowRoles: () => () => {} },
    '../models/Pacientes': { exists: async () => true },
    '../models/Cita': Cita,
    '../models/User': {
      findById: () => ({ select: () => ({ lean: async () => ({
        horarioLaboral: { configurado: false },
      }) }) }),
    },
    '../services/calendar.service': {
      syncAppointment: async () => { calls.synced = true; return true },
      deleteAppointment: async () => {
        if (deleteError) throw deleteError
        return calendarSync
      },
    },
    '../utils/citas.utils': utils,
    '../utils/agenda-publica.utils': { horarioAdmite: () => true },
  }
  const scope = {
    require(specifier) {
      assert.ok(Object.prototype.hasOwnProperty.call(deps, specifier), 'Dependencia inesperada ' + specifier)
      return deps[specifier]
    },
    module: { exports: {} },
    console: { error() {} },
    Date,
    Intl,
  }
  vm.runInNewContext(source, scope, { filename: 'citas.routes.js' })

  async function invoke(method, route, { body = {}, id = AID } = {}) {
    const handler = handlers.get(method + ' ' + route)
    assert.equal(typeof handler, 'function', 'No existe ' + method + ' ' + route)
    const req = { user: { _id: UID }, params: { id }, body, query: {} }
    const res = {
      statusCode: 200, body: null,
      status(n) { this.statusCode = n; return this },
      json(value) { this.body = value; return this },
    }
    let thrown = null
    await handler(req, res, (e) => { thrown = e })
    if (thrown) throw thrown
    return res
  }
  return { invoke, calls, record }
}

test('DELETE elimina la cita sólo después de confirmar Calendar', async () => {
  const f = fixture({ calendarSync: true })
  const res = await f.invoke('DELETE', '/:id')
  assert.equal(res.statusCode, 200)
  assert.equal(f.calls.scoped, true)
  assert.equal(f.calls.deleted, true)
  assert.equal(res.body.calendarSynced, true)
})

test('DELETE NO borra la cita si Google Calendar está desconectado y conserva un evento', async () => {
  const f = fixture({ calendarSync: false })
  const res = await f.invoke('DELETE', '/:id')
  assert.equal(res.statusCode, 409)
  assert.equal(f.calls.deleted, false)
  assert.match(res.body.message, /Reconecta Calendar/)
})

test('DELETE NO borra la cita si Calendar devuelve error', async () => {
  const f = fixture({ deleteError: new Error('Google Calendar respondió 500') })
  const res = await f.invoke('DELETE', '/:id')
  assert.equal(res.statusCode, 502)
  assert.equal(f.calls.deleted, false)
})

test('DELETE valida el ID y no puede borrar citas de otro nutriólogo', async () => {
  const invalid = fixture()
  const r1 = await invalid.invoke('DELETE', '/:id', { id: 'invalido' })
  assert.equal(r1.statusCode, 400)
  assert.equal(invalid.calls.deleted, false)
  const missing = fixture({ existing: false })
  const r2 = await missing.invoke('DELETE', '/:id')
  assert.equal(r2.statusCode, 404)
  assert.equal(missing.calls.deleted, false)
})

test('PATCH permite cancelar una cita sin modificar su fecha', async () => {
  const f = fixture()
  const original = f.record.inicio.getTime()
  const res = await f.invoke('PATCH', '/:id/estado', { body: { estado: 'cancelada' } })
  assert.equal(res.statusCode, 200)
  assert.equal(f.record.estado, 'cancelada')
  assert.equal(f.record.inicio.getTime(), original)
  assert.equal(f.calls.saved, true)
  assert.equal(f.calls.reminderReset, true)
  assert.equal(f.calls.synced, true)
})

test('PATCH impide completar una cita futura', async () => {
  const f = fixture()
  const res = await f.invoke('PATCH', '/:id/estado', { body: { estado: 'completada' } })
  assert.equal(res.statusCode, 400)
  assert.equal(f.record.estado, 'confirmada')
  assert.equal(f.calls.saved, false)
})

test('PUT permite corregir notas de una cita pasada sin reprogramarla', async () => {
  const fecha = ORIGEN()
  const f = fixture({ inicio: fecha })
  const body = { patient: PID, inicio: fecha, zonaHoraria: 'America/Mexico_City',
    tipo: 'seguimiento', estado: 'confirmada', notas: 'Revisar historial' }
  const res = await f.invoke('PUT', '/:id', { body })
  assert.equal(res.statusCode, 200)
  assert.equal(f.record.notas, 'Revisar historial')
  assert.equal(f.record.inicio.toISOString(), fecha)
  assert.equal(f.calls.reminderReset, false)
})

test('POST bloquea horarios ocupados y no crea duplicados', async () => {
  const fecha = ISO()
  const body = { patient: PID, inicio: fecha, zonaHoraria: 'America/Mexico_City',
    tipo: 'seguimiento', estado: 'programada', notas: '' }
  const conflict = fixture({ conflicto: true })
  const res = await conflict.invoke('POST', '/', { body })
  assert.equal(res.statusCode, 409)
  assert.equal(conflict.calls.created, false)
  const free = fixture()
  const ok = await free.invoke('POST', '/', { body })
  assert.equal(ok.statusCode, 201)
  assert.equal(free.calls.created, true)
})
