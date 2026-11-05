const mongoose = require('mongoose')
const citaSchema = new mongoose.Schema({
  nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  inicio: { type: Date, required: true },
  fin: { type: Date, required: true },
  zonaHoraria: { type: String, required: true },
  tipo: { type: String, enum: ['primera', 'seguimiento', 'otra'], default: 'seguimiento' },
  estado: { type: String, enum: ['programada', 'confirmada', 'cancelada', 'completada'], default: 'programada' },
  notas: { type: String, trim: true, maxlength: 500, default: '' },
  calendarEventId: { type: String, default: null, select: false },
  recordatorio24hEnviado: { type: Date, default: null },
  recordatorio2hEnviado: { type: Date, default: null },
}, { timestamps: true })
citaSchema.index({ nutritionist: 1, inicio: 1 })
module.exports = mongoose.model('Cita', citaSchema)
