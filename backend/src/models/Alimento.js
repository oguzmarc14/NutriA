const mongoose = require('mongoose')

const fuenteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    edicion: {
      type: String,
      trim: true,
      default: '',
    },

    referencia: {
      type: String,
      trim: true,
      default: '',
    },

    url: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  },
)

const porcionSchema = new mongoose.Schema(
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

const nutrimentosSchema = new mongoose.Schema(
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

    calcio: {
      type: Number,
      min: 0,
      default: null,
    },

    hierro: {
      type: Number,
      min: 0,
      default: null,
    },

    potasio: {
      type: Number,
      min: 0,
      default: null,
    },

    colesterol: {
      type: Number,
      min: 0,
      default: null,
    },

    azucares: {
      type: Number,
      min: 0,
      default: null,
    },

    grasasSaturadas: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    _id: false,
  },
)

const alimentoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [
        true,
        'El nombre del alimento es obligatorio',
      ],
      trim: true,
      index: true,
    },

    nombreNormalizado: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: '',
    },

    grupo: {
      type: String,
      required: [
        true,
        'El grupo del alimento es obligatorio',
      ],
      trim: true,
      index: true,
    },

    subgrupo: {
      type: String,
      trim: true,
      default: '',
    },

    porcion: {
      type: porcionSchema,
      default: () => ({}),
    },

    equivalentes: {
      type: Number,
      min: 0,
      default: 1,
    },

    nutrimentos: {
      type: nutrimentosSchema,
      default: () => ({}),
    },

    preparacion: {
      type: String,
      trim: true,
      default: '',
    },

    marca: {
      type: String,
      trim: true,
      default: '',
    },

    categoriaNutria: {
      type: String,
      trim: true,
      default: '',
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => {
        if (!Array.isArray(tags)) {
          return []
        }

        return tags
          .map((tag) =>
            String(tag)
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean)
      },
    },

    fuentes: {
      type: [fuenteSchema],
      default: [],
    },

    activo: {
      type: Boolean,
      default: true,
      index: true,
    },

    revisado: {
      type: Boolean,
      default: false,
      index: true,
    },

    origen: {
      type: String,
      enum: [
        'manual',
        'importado',
        'smae_referencia',
        'usda',
        'otra_fuente',
      ],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  },
)

alimentoSchema.index({
  nombre: 'text',
  grupo: 'text',
  subgrupo: 'text',
  tags: 'text',
})

alimentoSchema.pre(
  'save',
  function normalizarNombre() {
    if (!this.nombre) {
      return
    }

    this.nombreNormalizado =
      this.nombre
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
  },
)

module.exports = mongoose.model(
  'Alimento',
  alimentoSchema,
)