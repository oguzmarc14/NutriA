const { z } = require('zod')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const Pacientes = require('../models/Pacientes')

const expedienteSchema = z.object({
  antecedentesPersonales: z.string().trim().optional(),
  antecedentesFamiliares: z.string().trim().optional(),
  alergias: z.string().trim().optional(),
  medicamentos: z.string().trim().optional(),
  padecimientos: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
})

async function guardarExpediente(req, res, next) {
  try {
    const parsed = expedienteSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos del expediente inválidos',
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

    const expediente = await ExpedienteClinico.findOneAndUpdate(
      {
        paciente: paciente._id,
        nutritionist: req.user.id,
      },
      {
        ...parsed.data,
        paciente: paciente._id,
        nutritionist: req.user.id,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    )

    return res.json({
      message: 'Expediente clínico guardado correctamente',
      expediente,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerExpediente(req, res, next) {
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

    const expediente = await ExpedienteClinico.findOne({
      paciente: paciente._id,
      nutritionist: req.user.id,
    })

    return res.json({
      paciente,
      expediente,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  guardarExpediente,
  obtenerExpediente,
}