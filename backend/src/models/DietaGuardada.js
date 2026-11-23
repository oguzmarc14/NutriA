const mongoose = require('mongoose')

/** Copia privada reutilizable. No guarda ni expone datos identificables del paciente. */
const schema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nombre: { type: String, trim: true, required: true, minlength: 3, maxlength: 100 },
  origenPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanAlimenticio', required: true },
  fechaGuardado: { type: Date, default: Date.now },
  comidasCount: { type: Number, min: 0, default: 0 },
  metaEnergiaKcal: { type: Number, default: null },
  plan: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true })
schema.index({ autor: 1, fechaGuardado: -1 })
module.exports = mongoose.model('DietaGuardada', schema)
