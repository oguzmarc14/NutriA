const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { mkdtemp, realpath, rm, writeFile } = require('node:fs/promises')
const { once } = require('node:events')
const { createServer } = require('node:net')
const { randomBytes } = require('node:crypto')
const { tmpdir } = require('node:os')
const { basename, dirname, join } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { migrar, colecciones } = require('../src/scripts/migrarDatosPacientes')
const { MongoClient, ObjectId } = mongoose.mongo

async function run() {
  const executable = process.argv[2]
  if (!executable) throw new Error('Indica la ruta de mongod como primer argumento.')
  const output = process.argv[3]
  const root = await realpath(tmpdir())
  const data = await mkdtemp(join(root, 'nutria-separacion-'))
  const source = 'nutria_general_lab'
  const target = 'nutria_pacientes_lab'
  const checks = []
  let child, childClosed, mongo, http
  try {
    const socket = createServer().listen(0, '127.0.0.1')
    await once(socket, 'listening')
    const address = '127.0.0.1:' + socket.address().port
    await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()))
    child = spawn(executable, ['--dbpath', data, '--bind_ip', '127.0.0.1', '--port', address.split(':')[1],
      '--replSet', 'nutriaLab', '--logpath', join(data, 'mongod.log')], { stdio: 'ignore', windowsHide: true })
    let startupError
    child.on('error', error => { startupError = error })
    childClosed = new Promise(resolve => child.once('close', resolve))
    const base = 'mongodb://' + address
    for (let i = 0; i < 25; i++) {
      if (startupError || child.exitCode !== null) throw startupError || new Error('MongoDB no arrancó.')
      mongo = new MongoClient(base + '/?directConnection=true', { serverSelectionTimeoutMS: 700 })
      try { await mongo.connect(); break }
      catch { await mongo.close(); mongo = null; await delay(150) }
    }
    if (!mongo) throw new Error('MongoDB no respondió.')
    const admin = mongo.db('admin')
    await admin.command({ replSetInitiate: { _id: 'nutriaLab', members: [{ _id: 0, host: address }] } })
    for (let i = 0; i < 60; i++) {
      if ((await admin.command({ hello: 1 })).isWritablePrimary) break
      await delay(200)
      if (i === 59) throw new Error('El servidor de prueba no eligió un primario.')
    }

    const general = mongo.db(source)
    const privado = mongo.db(target)
    const staff = new ObjectId(), another = new ObjectId(), account = new ObjectId()
    const patient = new ObjectId(), otherPatient = new ObjectId(), clinical = new ObjectId()
    await general.collection('users').insertMany([
      { _id: staff, name: 'Nutriólogo ficticio', email: 'nutri@example.invalid', role: 'nutritionist', active: true },
      { _id: another, name: 'Otro consultorio ficticio', email: 'otro@example.invalid', role: 'nutritionist', active: true },
      { _id: account, name: 'Paciente ficticio', email: 'paciente@example.invalid', role: 'patient', patient, active: true },
    ])
    await general.collection('patients').insertMany([
      { _id: patient, name: 'Paciente ficticio', nutritionist: staff, active: true },
      { _id: otherPatient, name: 'Paciente de otro consultorio', nutritionist: another, active: true },
    ])
    await general.collection('expedienteclinicos').insertOne({ _id: clinical, paciente: patient, nutritionist: staff, motivoConsulta: 'Dato ficticio' })
    const inicio = new Date(Date.now() + 86400000)
    await general.collection('citas').insertOne({ nutritionist: staff, patient, inicio,
      fin: new Date(+inicio + 3600000), zonaHoraria: 'America/Mexico_City', estado: 'programada' })

    const plan = new ObjectId()
    const asociados = { paciente: patient, nutritionist: staff }
    for (const [name, document] of Object.entries({
      medicions: { ...asociados, peso: 72, fecha: new Date() },
      calculonutricionals: { ...asociados, resultado: { energia: 1800 } },
      planalimenticios: { _id: plan, ...asociados, nombre: 'Plan ficticio', comidas: [] },
      seguimientocomidas: { ...asociados, plan, comentario: 'Registro ficticio' },
      pagos: { ...asociados, montoCentavos: 50000, moneda: 'MXN' },
    })) await general.collection(name).insertOne(document)

    process.env.MONGODB_URI = base + '/' + source + '?replicaSet=nutriaLab'
    process.env.MONGODB_PATIENT_DB = target
    process.env.JWT_SECRET = randomBytes(32).toString('hex')
    const { connectDatabase } = require('../src/config/database')
    // The API must refuse an empty independent destination.
    await assert.rejects(connectDatabase, /copia clínica no está verificada/)
    await mongoose.disconnect()
    checks.push('Arranque rechazado antes de verificar la copia')

    const conteos = await migrar({ client: mongo, origen: source, destino: target, copiar: true })
    assert.deepEqual(Object.keys(conteos), colecciones)
    assert.equal(conteos.patients, 2)
    assert.equal(conteos.expedienteclinicos, 1)
    assert.equal(conteos.citas, 1)
    assert.equal(Object.values(conteos).reduce((a, b) => a + b, 0), 9)
    await privado.collection('medicions').updateOne({ paciente: patient }, { $set: { peso: 99 } })
    await assert.rejects(() => migrar({ client: mongo, origen: source, destino: target }), /diferencias en medicions/)
    await privado.collection('medicions').updateOne({ paciente: patient }, { $set: { peso: 72 } })
    await migrar({ client: mongo, origen: source, destino: target })
    await assert.rejects(() => migrar({ client: mongo, origen: source, destino: target, copiar: true }), /ya está marcada/)
    checks.push('Copia exacta de documentos e identificadores, con protección contra volver a copiar')

    const app = require('../src/app')
    await connectDatabase()
    const Patient = require('../src/models/Pacientes')
    const User = require('../src/models/User')
    assert.equal(Patient.db.name, target)
    assert.equal(User.db.name, source)
    assert.equal(Patient.db.getClient(), User.db.getClient())
    http = app.listen(0, '127.0.0.1')
    await once(http, 'listening')
    const url = 'http://127.0.0.1:' + http.address().port + '/api'
    async function read(path, id) {
      const token = jwt.sign({ sub: String(id) }, process.env.JWT_SECRET)
      const response = await fetch(url + path, { headers: { Authorization: 'Bearer ' + token } })
      assert.equal(response.status, 200)
      return response.json()
    }

    const perfil = await read('/mi-perfil', account)
    assert.equal(perfil.paciente._id, String(patient))
    assert.equal(perfil.expediente._id, String(clinical))
    assert.equal(perfil.mediciones[0].peso, 72)
    assert.equal(perfil.planes[0]._id, String(plan))
    assert.equal(perfil.paciente.nutritionist.name, 'Nutriólogo ficticio')
    const agenda = await read('/citas', staff)
    assert.equal(agenda.length, 1)
    assert.equal(agenda[0].patient._id, String(patient))
    assert.equal((await read('/citas', another)).length, 0)
    checks.push('API: el paciente lee su expediente y su nutriólogo figura en el perfil')
    checks.push('API: la agenda mantiene el paciente asociado y respeta el aislamiento entre consultorios')

    const { eliminarPacienteConDatos } = require('../src/services/eliminarPaciente.service')
    await eliminarPacienteConDatos({ pacienteId: patient, nutritionistId: staff })
    assert.equal(await privado.collection('patients').countDocuments({ _id: patient }), 0)
    assert.equal(await privado.collection('expedienteclinicos').countDocuments({ _id: clinical }), 0)
    assert.equal(await general.collection('users').countDocuments({ _id: account }), 0)
    assert.equal(await general.collection('patients').countDocuments({ _id: patient }), 1)
    checks.push('Eliminación autorizada conserva su transacción entre las dos bases y la copia de origen queda intacta')

    const result = { entorno: 'MongoDB local con réplica y datos ficticios', origen: source, destino: target, conteos, pruebas: checks }
    const evidence = JSON.stringify(result, null, 2) + '\n'
    if (output) await writeFile(output, evidence, { flag: 'wx' })
    process.stdout.write(evidence)
  } finally {
    if (http) await new Promise(resolve => http.close(resolve))
    await mongoose.disconnect().catch(() => {})
    await mongo?.close()
    if (child?.pid && child.exitCode === null) { child.kill(); await childClosed }
    if (dirname(data) === root && basename(data).startsWith('nutria-separacion-')) {
      await rm(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  }
}
run().catch(error => { console.error('Falló la prueba de separación:', error.message); process.exitCode = 1 })
