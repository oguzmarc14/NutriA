const mongoose = require('mongoose')
const Paciente = require('../models/Pacientes')
const User = require('../models/User')
const Medicion = require('../models/Medicion')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const SeguimientoComida = require('../models/SeguimientoComida')
const CalculoNutricional = require('../models/CalculoNutricional')
const Cita = require('../models/Cita')
const Pago = require('../models/Pago')
const { deleteAppointment } = require('./calendar.service')

class ErrorEliminacionPaciente extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    this.name = 'ErrorEliminacionPaciente'
  }
}

// Toda eliminación en MongoDB es transaccional. Google Calendar es un servicio
// externo: sus eventos se retiran primero y su borrado admite reintentos (404).
// Si Calendar falla NO se inicia el borrado en la base de datos.
async function eliminarPacienteConDatos({ pacienteId, nutritionistId }) {
  const filtroPaciente = { _id: pacienteId, nutritionist: nutritionistId, active: true }
  const existe = await Paciente.exists(filtroPaciente)
  if (!existe) {
    throw new ErrorEliminacionPaciente(404, 'Paciente no encontrado en tu consultorio.')
  }

  const filtroDatos = { paciente: pacienteId, nutritionist: nutritionistId }
  const citas = await Cita.find({ patient: pacienteId, nutritionist: nutritionistId })
    .select('+calendarEventId')
    .lean()

  for (const cita of citas) {
    if (!cita.calendarEventId) continue
    let retirado
    try {
      retirado = await deleteAppointment(cita)
    } catch (error) {
      console.error('No fue posible retirar una cita de Google Calendar:', error.message)
      throw new ErrorEliminacionPaciente(502,
        'Google Calendar no permitió retirar todas las citas. No se eliminó el paciente ni su historial de NutriA. Vuelve a intentar.')
    }
    if (!retirado) {
      throw new ErrorEliminacionPaciente(409,
        'El paciente tiene citas vinculadas con Google Calendar. Reconecta Calendar para retirarlas antes de eliminarlo. No se modificó su historial.')
    }
  }

  const session = await mongoose.startSession()
  try {
    // MongoDB no permite ejecutar operaciones simultáneas (Promise.all)
    // dentro de una misma transacción de Mongoose.
    await session.withTransaction(async () => {
      const orden = [
        [SeguimientoComida, filtroDatos],
        [CalculoNutricional, filtroDatos],
        [Pago, filtroDatos],
        [Cita, { patient: pacienteId, nutritionist: nutritionistId }],
        [PlanAlimenticio, filtroDatos],
        [Medicion, filtroDatos],
        [ExpedienteClinico, filtroDatos],
        [User, { patient: pacienteId, role: 'patient' }],
      ]
      for (const [Modelo, filtro] of orden) {
        await Modelo.deleteMany(filtro).session(session)
      }
      const resultado = await Paciente.deleteOne(filtroPaciente).session(session)
      if (resultado.deletedCount !== 1) {
        throw new ErrorEliminacionPaciente(409,
          'El paciente fue modificado mientras se procesaba la eliminación. No se borró ningún registro. Intenta de nuevo.')
      }
    })
  } catch (error) {
    if (/Transaction numbers are only allowed|replica set|transactions are not supported/i.test(error.message)) {
      throw new ErrorEliminacionPaciente(503,
        'La base de datos debe admitir transacciones. No se eliminó ningún dato de NutriA. Contacta al administrador.')
    }
    throw error
  } finally {
    await session.endSession()
  }

  return { message: 'Paciente, cuenta y registros asociados eliminados correctamente.' }
}

module.exports = { eliminarPacienteConDatos, ErrorEliminacionPaciente }
