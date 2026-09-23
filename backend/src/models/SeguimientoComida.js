const mongoose = require('mongoose')

const seguimientoComidaSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlanAlimenticio',
      required: true,
      index: true,
    },
    comida: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    nombreComida: {
      type: String,
      required: true,
      trim: true,
    },
    platillo: {
      type: String,
      trim: true,
      default: '',
    },
    fecha: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    estado: {
      type: String,
      enum: ['completada', 'parcial', 'omitida'],
      required: true,
    },
    agrado: {
      type: String,
      enum: ['gusto', 'neutral', 'no_gusto'],
      required: true,
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true },
)

seguimientoComidaSchema.index(
  { paciente: 1, plan: 1, comida: 1, fecha: 1 },
  { unique: true },
)

module.exports = mongoose.model('SeguimientoComida', seguimientoComidaSchema)
