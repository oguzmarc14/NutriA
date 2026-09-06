const mongoose = require('mongoose')

const expedienteClinicoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true,
    },

    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    antecedentesPersonales: {
      type: String,
      trim: true,
      default: '',
    },

    antecedentesFamiliares: {
      type: String,
      trim: true,
      default: '',
    },

    alergias: {
      type: String,
      trim: true,
      default: '',
    },

    medicamentos: {
      type: String,
      trim: true,
      default: '',
    },

    padecimientos: {
      type: String,
      trim: true,
      default: '',
    },

    observaciones: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model(
  'ExpedienteClinico',
  expedienteClinicoSchema,
)