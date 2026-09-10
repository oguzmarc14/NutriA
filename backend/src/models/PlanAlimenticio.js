const mongoose = require('mongoose')

const nutrimentosSchema =
  new mongoose.Schema(
    {
      kcal: {
        type: Number,
        min: 0,
        default: 0,
      },

      proteina: {
        type: Number,
        min: 0,
        default: 0,
      },

      carbohidratos: {
        type: Number,
        min: 0,
        default: 0,
      },

      grasas: {
        type: Number,
        min: 0,
        default: 0,
      },

      fibra: {
        type: Number,
        min: 0,
        default: null,
      },

      sodio: {
        type: Number,
        min: 0,
        default: null,
      },
    },
    {
      _id: false,
    },
  )

const porcionSchema =
  new mongoose.Schema(
    {
      cantidad: {
        type: Number,
        min: 0,
        default: 1,
      },

      unidad: {
        type: String,
        trim: true,
        default: '',
      },

      gramos: {
        type: Number,
        min: 0,
        default: null,
      },

      descripcion: {
        type: String,
        trim: true,
        default: '',
      },
    },
    {
      _id: false,
    },
  )

const alimentoPlanSchema =
  new mongoose.Schema(
    {
      /*
       * ----------------------------------------------------
       * TIPO
       * ----------------------------------------------------
       *
       * catalogo:
       * viene de nuestra colección Alimento.
       *
       * personalizado:
       * lo captura manualmente la nutrióloga
       * dentro del plan.
       */

      tipo: {
        type: String,
        enum: [
          'catalogo',
          'personalizado',
        ],
        required: true,
      },

      /*
       * ----------------------------------------------------
       * REFERENCIA AL CATÁLOGO
       * ----------------------------------------------------
       */

      alimento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alimento',
        default: null,
      },

      /*
       * ----------------------------------------------------
       * COPIA DEL ALIMENTO AL MOMENTO DEL PLAN
       * ----------------------------------------------------
       *
       * Guardamos estos datos aunque venga del catálogo.
       * Así si el catálogo cambia después, el plan
       * histórico no cambia.
       */

      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      grupo: {
        type: String,
        trim: true,
        default: '',
      },

      porcion: {
        type: porcionSchema,
        default: () => ({}),
      },

      nutrimentos: {
        type: nutrimentosSchema,
        default: () => ({}),
      },

      /*
       * ----------------------------------------------------
       * CANTIDAD DE EQUIVALENTES / PORCIONES
       * ----------------------------------------------------
       *
       * Ejemplo:
       *
       * tortilla:
       * cantidad = 3
       *
       * Si una porción son 64 kcal:
       * total = 192 kcal
       */

      cantidad: {
        type: Number,
        min: 0.1,
        default: 1,
      },

      notas: {
        type: String,
        trim: true,
        default: '',
      },
    },
    {
      _id: true,
    },
  )

const comidaSchema =
  new mongoose.Schema(
    {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * La dejamos para comentarios generales:
       *
       * "Consumir entre 8:00 y 9:00"
       * "Puede acompañarse con agua"
       */

      descripcion: {
        type: String,
        trim: true,
        default: '',
      },

      alimentos: {
        type: [
          alimentoPlanSchema,
        ],
        default: [],
      },
    },
    {
      _id: true,
    },
  )

const planAlimenticioSchema =
  new mongoose.Schema(
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
        required: [
          true,
          'El nombre del plan es obligatorio',
        ],
        trim: true,
      },

      objetivo: {
        type: String,
        trim: true,
        default: '',
      },

      comidas: {
        type: [
          comidaSchema,
        ],
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

module.exports =
  mongoose.model(
    'PlanAlimenticio',
    planAlimenticioSchema,
  )