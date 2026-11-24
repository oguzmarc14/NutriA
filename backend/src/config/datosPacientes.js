const mongoose = require('mongoose')

const modelos = [
  'Patient', 'ExpedienteClinico', 'Medicion', 'CalculoNutricional', 'PlanAlimenticio',
  'SeguimientoComida', 'Cita', 'Pago', 'AgendaCheckout',
]
const marcaColeccion = '_nutria_migraciones'
const marcaId = 'separacion-pacientes-v1'

function validarBase(nombre) {
  if (!/^[a-z][a-z0-9_]{2,59}$/.test(nombre || '') || ['admin', 'config', 'local'].includes(nombre)) {
    throw new Error('Nombre de base privada inválido.')
  }
  return nombre
}

function conexionPacientes() {
  const nombre = process.env.MONGODB_PATIENT_DB
  return nombre ? mongoose.connection.useDb(validarBase(nombre), { useCache: true }) : mongoose.connection
}

function modeloPaciente(nombre, esquema) {
  if (!modelos.includes(nombre)) throw new Error('Modelo clínico no registrado: ' + nombre)
  return conexionPacientes().model(nombre, esquema)
}

async function verificarSeparacion() {
  if (!process.env.MONGODB_PATIENT_DB) return
  const privada = conexionPacientes()
  if (privada.name === mongoose.connection.name) throw new Error('La base general y la privada deben ser distintas.')
  const marca = await privada.db.collection(marcaColeccion).findOne({ _id: marcaId })
  if (!marca || marca.origen !== mongoose.connection.name || marca.destino !== privada.name) {
    throw new Error('La copia clínica no está verificada. NutriA no activó la base privada.')
  }
}

module.exports = { modelos, marcaColeccion, marcaId, validarBase, conexionPacientes, modeloPaciente, verificarSeparacion }
