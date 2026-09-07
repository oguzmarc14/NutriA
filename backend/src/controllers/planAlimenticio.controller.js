const { z } = require('zod')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const Pacientes = require('../models/Pacientes')

const comidaSchema = z.object({
  nombre: z.string().trim().min(2),
  descripcion: z.string().trim().min(2),
})

const planSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre del plan es obligatorio'),
  objetivo: z.string().trim().optional(),
  comidas: z.array(comidaSchema).optional(),
  fechaInicio: z.coerce.date().optional(),
})

async function crearPlanAlimenticio(req, res, next) {
  try {
    const parsed = planSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos del plan alimenticio inválidos',
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

    const plan = await PlanAlimenticio.create({
      paciente: paciente._id,
      nutritionist: req.user.id,
      nombre: parsed.data.nombre,
      objetivo: parsed.data.objetivo || '',
      comidas: parsed.data.comidas || [],
      fechaInicio: parsed.data.fechaInicio || new Date(),
    })

    return res.status(201).json({
      message: 'Plan alimenticio creado correctamente',
      plan,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerPlanesAlimenticios(req, res, next) {
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

    const planes = await PlanAlimenticio.find({
      paciente: paciente._id,
      nutritionist: req.user.id,
    }).sort({ createdAt: -1 })

    return res.json({
      paciente,
      planes,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  crearPlanAlimenticio,
  obtenerPlanesAlimenticios,
}