const { z } = require('zod')
const Medicion = require('../models/Medicion')
const Pacientes = require('../models/Pacientes')

const medicionSchema = z.object({
  peso: z.coerce.number().positive(),
  estatura: z.coerce.number().min(0.5).max(3),
  fecha: z.coerce.date().optional(),
})

async function registrarMedicion(req, res, next) {
  try {
    const parsed = medicionSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos de la medición inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const paciente = await Pacientes.findOne({
      _id: req.params.pacienteId,
      nutritionist: req.user.id,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({
        message: 'Paciente no encontrado',
      })
    }

    const imc = Number(
      (parsed.data.peso / (parsed.data.estatura ** 2)).toFixed(2),
    )

    const medicion = await Medicion.create({
      paciente: paciente._id,
      nutritionist: req.user.id,
      peso: parsed.data.peso,
      estatura: parsed.data.estatura,
      imc,
      fecha: parsed.data.fecha || new Date(),
    })

    return res.status(201).json({
      message: 'Medición registrada correctamente',
      medicion,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerHistorialMediciones(req, res, next) {
  try {
    const paciente = await Pacientes.findOne({
      _id: req.params.pacienteId,
      nutritionist: req.user.id,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({
        message: 'Paciente no encontrado',
      })
    }

    const mediciones = await Medicion.find({
      paciente: paciente._id,
      nutritionist: req.user.id,
    }).sort({ fecha: -1 })

    return res.json({
      paciente,
      mediciones,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  registrarMedicion,
  obtenerHistorialMediciones,
}