const { isValidObjectId } = require('mongoose')
const Patient = require('../models/Pacientes')
const Plan = require('../models/PlanAlimenticio')

/** Confirmación explícita e idempotente; nunca cambia el seguimiento clínico. */
async function aceptarMiPlan(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store')
    if (!req.user.patient || !isValidObjectId(req.params.id))
      return res.status(404).json({ message: 'Plan no encontrado' })
    const patient = await Patient.findOne({ _id: req.user.patient, active: true })
      .select('_id nutritionist').lean()
    if (!patient) return res.status(404).json({ message: 'Plan no encontrado' })
    const conditions = { _id: req.params.id, paciente: patient._id, nutritionist: patient.nutritionist }
    const plan = await Plan.findOneAndUpdate({
      ...conditions,
      'aceptacionPaciente.estado': { $ne: 'aceptada' },
    }, { $set: { 'aceptacionPaciente.estado': 'aceptada', 'aceptacionPaciente.fecha': new Date() } },
    { new: true, runValidators: true }).select('_id aceptacionPaciente').lean()
    if (plan) {
      // Notificar sólo después de persistir. La actualización atómica evita avisos duplicados.
      void req.app?.locals?.notificarDietaAceptada?.(patient.nutritionist, plan._id)
      return res.json({ aceptacion: plan.aceptacionPaciente, notified: true })
    }
    const current = await Plan.findOne(conditions).select('_id aceptacionPaciente').lean()
    if (!current) return res.status(404).json({ message: 'Plan no encontrado' })
    return res.json({ aceptacion: current.aceptacionPaciente, notified: false })
  } catch (error) { next(error) }
}
module.exports = { aceptarMiPlan }
