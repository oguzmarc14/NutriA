const Paciente = require('../models/Pacientes')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const Medicion = require('../models/Medicion')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const SeguimientoComida = require('../models/SeguimientoComida')

/*
 * Devuelve unicamente la informacion asociada
 * al paciente autenticado.
 */
async function obtenerMiPerfil(req, res, next) {
  try {
    const pacienteId = req.user.patient

    if (!pacienteId) {
      return res.status(404).json({
        message: 'La cuenta no tiene un paciente asociado',
      })
    }

    const paciente = await Paciente.findOne({
      _id: pacienteId,
      active: true,
    })
      .populate('nutritionist', 'name email')
      .lean()

    if (!paciente) {
      return res.status(404).json({
        message: 'Paciente no encontrado',
      })
    }

    const [expediente, mediciones, planes, seguimientosComida] = await Promise.all([
      ExpedienteClinico.findOne({ paciente: paciente._id }).lean(),
      Medicion.find({ paciente: paciente._id })
        .sort({ fecha: -1, createdAt: -1 })
        .lean(),
      PlanAlimenticio.find({ paciente: paciente._id })
        .sort({ activo: -1, fechaInicio: -1, createdAt: -1 })
        .lean(),
      SeguimientoComida.find({ paciente: paciente._id })
        .sort({ fecha: -1, updatedAt: -1 })
        .lean(),
    ])

    return res.json({
      paciente,
      expediente: expediente || null,
      mediciones,
      planes,
      seguimientosComida,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { obtenerMiPerfil }
