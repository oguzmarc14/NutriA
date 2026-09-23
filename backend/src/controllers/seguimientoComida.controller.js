const { z } = require('zod')

const Medicion = require('../models/Medicion')
const Paciente = require('../models/Pacientes')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const SeguimientoComida = require('../models/SeguimientoComida')

const seguimientoSchema = z.object({
  planId: z.string().regex(/^[a-f\d]{24}$/i),
  comidaId: z.string().regex(/^[a-f\d]{24}$/i),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estado: z.enum(['completada', 'parcial', 'omitida']),
  agrado: z.enum(['gusto', 'neutral', 'no_gusto']),
  comentario: z.string().trim().max(500).optional().default(''),
})

function construirResumen(registros, mediciones, planes = []) {
  const total = registros.length
  const totalProgramadas = planes.reduce(
    (suma, plan) => suma + (plan.comidas?.length || 0),
    0,
  )
  const completadas = registros.filter((item) => item.estado === 'completada').length
  const parciales = registros.filter((item) => item.estado === 'parcial').length
  const omitidas = registros.filter((item) => item.estado === 'omitida').length
  const gustaron = registros.filter((item) => item.agrado === 'gusto').length
  const noGustaron = registros.filter((item) => item.agrado === 'no_gusto').length
  const ordenadas = [...mediciones].sort(
    (a, b) => new Date(a.fecha || a.createdAt) - new Date(b.fecha || b.createdAt),
  )
  const primera = ordenadas[0] || null
  const ultima = ordenadas.at(-1) || null

  return {
    total,
    totalProgramadas,
    pendientes: Math.max(totalProgramadas - total, 0),
    completadas,
    parciales,
    omitidas,
    gustaron,
    noGustaron,
    cumplimiento: totalProgramadas
      ? Math.round(((completadas + parciales * 0.5) / totalProgramadas) * 100)
      : 0,
    satisfaccion: total ? Math.round((gustaron / total) * 100) : 0,
    pesoInicial: primera?.peso ?? null,
    pesoActual: ultima?.peso ?? null,
    cambioPeso:
      primera?.peso != null && ultima?.peso != null
        ? Number((ultima.peso - primera.peso).toFixed(2))
        : null,
  }
}

async function guardarMiSeguimiento(req, res, next) {
  try {
    const parsed = seguimientoSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos de seguimiento invalidos',
        errors: parsed.error.flatten(),
      })
    }

    const paciente = await Paciente.findOne({
      _id: req.user.patient,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    const plan = await PlanAlimenticio.findOne({
      _id: parsed.data.planId,
      paciente: paciente._id,
    })

    if (!plan) {
      return res.status(404).json({ message: 'Plan alimenticio no encontrado' })
    }

    const fechaPlan = plan.fechaInicio.toISOString().slice(0, 10)

    if (parsed.data.fecha !== fechaPlan) {
      return res.status(400).json({
        message: 'La fecha no corresponde al plan alimenticio',
      })
    }

    const comida = plan.comidas.id(parsed.data.comidaId)

    if (!comida) {
      return res.status(404).json({ message: 'Comida no encontrada en el plan' })
    }

    const registro = await SeguimientoComida.findOneAndUpdate(
      {
        paciente: paciente._id,
        plan: plan._id,
        comida: comida._id,
        fecha: parsed.data.fecha,
      },
      {
        nutritionist: paciente.nutritionist,
        nombreComida: comida.nombre,
        platillo: comida.platillo || '',
        estado: parsed.data.estado,
        agrado: parsed.data.agrado,
        comentario: parsed.data.comentario,
      },
      { new: true, runValidators: true, upsert: true },
    )

    return res.json({
      message: 'Seguimiento de comida guardado correctamente',
      registro,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerMiProgreso(req, res, next) {
  try {
    const paciente = await Paciente.findOne({ _id: req.user.patient, active: true }).lean()

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    const [registros, mediciones, planes] = await Promise.all([
      SeguimientoComida.find({ paciente: paciente._id }).sort({ fecha: -1, updatedAt: -1 }).lean(),
      Medicion.find({ paciente: paciente._id }).sort({ fecha: 1, createdAt: 1 }).lean(),
      PlanAlimenticio.find({ paciente: paciente._id }).sort({ fechaInicio: -1 }).select('nombre objetivo fechaInicio activo comidas._id').lean(),
    ])

    return res.json({
      paciente,
      registros,
      mediciones,
      planes,
      resumen: construirResumen(registros, mediciones, planes),
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerProgresoPaciente(req, res, next) {
  try {
    const paciente = await Paciente.findOne({
      _id: req.params.pacienteId,
      nutritionist: req.user.id,
      active: true,
    }).lean()

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    const [registros, mediciones, planes] = await Promise.all([
      SeguimientoComida.find({ paciente: paciente._id }).sort({ fecha: -1, updatedAt: -1 }).lean(),
      Medicion.find({ paciente: paciente._id }).sort({ fecha: 1, createdAt: 1 }).lean(),
      PlanAlimenticio.find({ paciente: paciente._id }).sort({ fechaInicio: -1 }).select('nombre objetivo fechaInicio activo comidas._id').lean(),
    ])

    return res.json({
      paciente,
      registros,
      mediciones,
      planes,
      resumen: construirResumen(registros, mediciones, planes),
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  guardarMiSeguimiento,
  obtenerMiProgreso,
  obtenerProgresoPaciente,
}
