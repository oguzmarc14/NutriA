const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema(
  {
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    birthDate: {
      type: Date,
      default: null,
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'other', 'unspecified'],
      default: 'unspecified',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Voluntaria y separada de los datos clínicos. El paciente debe optar por participar.
    gamificacion: {
      permitidaPorNutriologo: { type: Boolean, default: true },
      participa: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Patient', patientSchema)