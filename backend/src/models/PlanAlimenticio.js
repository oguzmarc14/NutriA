const mongoose = require('mongoose')

const comidaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
)

const planAlimenticioSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    nombre: {
      type: String,
      required: [true, 'El nombre del plan es obligatorio'],
      trim: true,
    },

    objetivo: {
      type: String,
      trim: true,
      default: '',
    },

    comidas: {
      type: [comidaSchema],
      default: [],
    },

    fechaInicio: {
      type: Date,
      default: Date.now,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model(
  'PlanAlimenticio',
  planAlimenticioSchema,
)