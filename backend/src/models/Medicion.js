const mongoose = require('mongoose')

const medicionSchema = new mongoose.Schema(
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

    peso: {
      type: Number,
      required: [true, 'El peso es obligatorio'],
      min: [1, 'El peso debe ser mayor a 0'],
    },

    estatura: {
      type: Number,
      required: [true, 'La estatura es obligatoria'],
      min: [0.5, 'La estatura no es válida'],
      max: [3, 'La estatura no es válida'],
    },

    imc: {
      type: Number,
      required: true,
    },

    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Medicion', medicionSchema)