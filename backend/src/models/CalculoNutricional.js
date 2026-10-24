const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicion: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicion', required: true },
  formula: { type: String, enum: ['mifflin'], required: true },
  sexoCalculo: { type: String, enum: ['male', 'female'], required: true },
  edad: { type: Number, required: true },
  peso: { type: Number, required: true },
  estaturaCm: { type: Number, required: true },
  factorActividad: { type: Number, required: true },
  ajusteKcal: { type: Number, required: true },
  porcentajes: {
    carbohidratos: { type: Number, required: true },
    proteinas: { type: Number, required: true },
    grasas: { type: Number, required: true },
  },
  resultado: {
    metabolismoBasal: Number,
    gastoTotal: Number,
    objetivoKcal: Number,
    carbohidratosGramos: Number,
    proteinasGramos: Number,
    grasasGramos: Number,
  },
  observaciones: { type: String, maxlength: 1000, default: '' },
  estado: { type: String, enum: ['borrador'], default: 'borrador' },
  versionMotor: { type: String, default: '1.0.0' },
}, { timestamps: true })
schema.index({ paciente: 1, nutritionist: 1, createdAt: -1 })
module.exports = mongoose.model('CalculoNutricional', schema)
