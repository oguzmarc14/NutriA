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

    /*
     * INFORMACIÓN GENERAL
     */

    edad: {
      type: Number,
      required: [true, 'La edad es obligatoria'],
      min: [1, 'La edad no es válida'],
      max: [120, 'La edad no es válida'],
    },

    /*
     * Indica si esta fue la primera medición
     * registrada para el paciente.
     *
     * Más adelante el controlador será quien
     * determine automáticamente este valor.
     */
    esPrimeraMedicion: {
      type: Boolean,
      required: true,
      default: false,
    },

    /*
     * NIVEL DE ACTIVIDAD FÍSICA
     *
     * 1 = Sedentario
     * 2 = Ligero
     * 3 = Moderado
     * 4 = Activo
     * 5 = Muy activo
     */
    nivelActividadFisica: {
      type: Number,
      required: [
        true,
        'El nivel de actividad física es obligatorio',
      ],
      min: [
        1,
        'El nivel de actividad física debe estar entre 1 y 5',
      ],
      max: [
        5,
        'El nivel de actividad física debe estar entre 1 y 5',
      ],
    },

    /*
     * MEDIDAS CORPORALES
     */

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

    /*
     * MEDIDAS ANTROPOMÉTRICAS
     *
     * Todos estos campos son opcionales.
     */

    grasaCorporal: {
      type: Number,
      min: [0, 'La grasa corporal no puede ser negativa'],
      default: undefined,
    },

    grasaVisceral: {
      type: Number,
      min: [0, 'La grasa visceral no puede ser negativa'],
      default: undefined,
    },

    masaMuscular: {
      type: Number,
      min: [0, 'La masa muscular no puede ser negativa'],
      default: undefined,
    },

    masaOsea: {
      type: Number,
      min: [0, 'La masa ósea no puede ser negativa'],
      default: undefined,
    },

    proteina: {
      type: Number,
      min: [0, 'La proteína no puede ser negativa'],
      default: undefined,
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

module.exports = mongoose.model(
  'Medicion',
  medicionSchema,
)