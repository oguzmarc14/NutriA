const Paciente = require('../models/Pacientes')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const Medicion = require('../models/Medicion')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const SeguimientoComida = require('../models/SeguimientoComida')
const Cita = require('../models/Cita')
const User = require('../models/User')
const { resumenCitasPaciente } = require('../utils/resumen-citas-paciente')

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

// Sólo datos mínimos de citas asociadas a la cuenta Patient autenticada.
// Nunca se acepta un patientId de la URL ni se devuelven notas privadas.
async function obtenerMisCitas(req,res,next) {
  try {
    res.set('Cache-Control','no-store')
    if(!req.user.patient) return res.status(404).json({message:'La cuenta no tiene un paciente asociado'})
    const paciente=await Paciente.findOne({_id:req.user.patient,active:true})
      .select('_id nutritionist').lean()
    if(!paciente?.nutritionist) return res.status(404).json({message:'Paciente no encontrado'})
    const [citas,profesional]=await Promise.all([
      Cita.find({patient:paciente._id,nutritionist:paciente.nutritionist})
        .select('_id inicio fin zonaHoraria tipo estado')
        .sort({inicio:-1}).limit(200).lean(),
      User.findById(paciente.nutritionist)
        .select('name clinica recordatoriosSeguimiento horarioLaboral').lean(),
    ])
    const zona=profesional?.horarioLaboral?.zonaHoraria || 'America/Mexico_City'
    const resumen=resumenCitasPaciente(citas,profesional?.recordatoriosSeguimiento,zona)
    res.json({
      citas,proxima:resumen.proxima,ultima:resumen.ultima,
      avisos:resumen.avisos,hoy:resumen.hoy,zonaHoraria:resumen.zonaHoraria,
      profesional:profesional?.clinica?.nombreProfesional || profesional?.name || 'Tu nutriólogo',
    })
  } catch(error) { next(error) }
}
module.exports = { obtenerMiPerfil, obtenerMisCitas }
