const { z } = require('zod')
const Pacientes = require('../models/Pacientes')

const crearPacienteSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
  sex: z.enum(['male', 'female', 'other', 'unspecified']).optional(),
  notes: z.string().trim().optional(),
})

async function crearPaciente(req, res, next) {
  try {
    const parsed = crearPacienteSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos del paciente inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const paciente = await Pacientes.create({
      ...parsed.data,
      nutritionist: req.user.id,
    })

    return res.status(201).json({
      message: 'Paciente registrado correctamente',
      paciente,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerPacientes(req, res, next) {
  try {
    const pacientes = await Pacientes.find({
      nutritionist: req.user.id,
      active: true,
    }).sort({ createdAt: -1 })

    return res.json({ pacientes })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  crearPaciente,
  obtenerPacientes,
}