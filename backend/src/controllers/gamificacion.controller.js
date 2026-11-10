const mongoose = require('mongoose')
const { z } = require('zod')
const Paciente = require('../models/Pacientes')
const SeguimientoComida = require('../models/SeguimientoComida')
const { construirReconocimientos, preferenciasDe } = require('../services/gamificacion.service')

const preferenciaPacienteSchema = z.object({ participa: z.boolean() }).strict()
const configuracionNutriologoSchema = z.object({ permitidaPorNutriologo: z.boolean() }).strict()

async function encontrarMiPaciente(req, res) {
  const paciente = req.user.patient && await Paciente.findOne({
    _id: req.user.patient,
    active: true,
  })
  if (!paciente) res.status(404).json({ message: 'Paciente no encontrado' })
  return paciente
}

async function encontrarPacienteDelNutriologo(req, res) {
  if (!mongoose.isValidObjectId(req.params.pacienteId)) {
    res.status(400).json({ message: 'Identificador de paciente inválido' })
    return null
  }
  const paciente = await Paciente.findOne({
    _id: req.params.pacienteId,
    nutritionist: req.user.id,
    active: true,
  })
  if (!paciente) res.status(404).json({ message: 'Paciente no encontrado' })
  return paciente
}

async function obtenerMiResumen(req, res, next) {
  try {
    const paciente = await encontrarMiPaciente(req, res)
    if (!paciente) return
    const preferencias = preferenciasDe(paciente)
    if (!preferencias.activa) {
      return res.json({ preferencias, resumen: null })
    }
    const registros = await SeguimientoComida.find({ paciente: paciente._id })
      .select('fecha comentario')
      .lean()
    return res.json({
      preferencias,
      resumen: construirReconocimientos(registros),
    })
  } catch (error) {
    return next(error)
  }
}

async function actualizarMiPreferencia(req, res, next) {
  try {
    const parsed = preferenciaPacienteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Preferencia inválida' })

    const paciente = await encontrarMiPaciente(req, res)
    if (!paciente) return
    if (parsed.data.participa && !preferenciasDe(paciente).permitidaPorNutriologo) {
      return res.status(409).json({ message: 'Esta función está pausada por tu nutriólogo.' })
    }

    paciente.set('gamificacion.participa', parsed.data.participa)
    await paciente.save()
    return res.json({ preferencias: preferenciasDe(paciente) })
  } catch (error) {
    return next(error)
  }
}

async function obtenerConfiguracionPaciente(req, res, next) {
  try {
    const paciente = await encontrarPacienteDelNutriologo(req, res)
    if (!paciente) return
    return res.json({ preferencias: preferenciasDe(paciente) })
  } catch (error) {
    return next(error)
  }
}

async function actualizarConfiguracionPaciente(req, res, next) {
  try {
    const parsed = configuracionNutriologoSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Configuración inválida' })

    const paciente = await encontrarPacienteDelNutriologo(req, res)
    if (!paciente) return
    paciente.set('gamificacion.permitidaPorNutriologo', parsed.data.permitidaPorNutriologo)
    await paciente.save()
    return res.json({ preferencias: preferenciasDe(paciente) })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  obtenerMiResumen,
  actualizarMiPreferencia,
  obtenerConfiguracionPaciente,
  actualizarConfiguracionPaciente,
}
