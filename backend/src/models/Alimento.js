const mongoose = require('mongoose')

/*
 * ----------------------------------------------------
 * FUENTE DE INFORMACIÓN
 * ----------------------------------------------------
 */

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

    identificador: {
      type: String,
      trim: true,
      default: '',
    },

    tipoDato: {
      type: String,
      enum: [
        'equivalencia',
        'composicion',
        'complementaria',
        'general',
      ],
      default: 'general',
    },
  },
  {
    _id: false,
  },
)

/*
 * ----------------------------------------------------
 * PORCIÓN / EQUIVALENTE
 * ----------------------------------------------------
 */

const porcionSchema = new mongoose.Schema(
  {
    cantidad: {
      type: Number,
      default: 1,
      min: 0,
    },

    unidad: {
      type: String,
      trim: true,
      default: 'porción',
    },

    gramos: {
      type: Number,
      default: null,
      min: 0,
    },

    mililitros: {
      type: Number,
      default: null,
      min: 0,
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

/*
 * ----------------------------------------------------
 * NUTRIMENTOS
 * ----------------------------------------------------
 *
 * null = dato todavía no disponible/verificado
 * 0    = valor conocido igual a cero
 */

const nutrimentosSchema = new mongoose.Schema(
  {
    /*
     * Energía y macronutrimentos
     */

    kcal: {
      type: Number,
      default: null,
      min: 0,
    },

    proteina: {
      type: Number,
      default: null,
      min: 0,
    },

    carbohidratos: {
      type: Number,
      default: null,
      min: 0,
    },

    grasas: {
      type: Number,
      default: null,
      min: 0,
    },

    fibra: {
      type: Number,
      default: null,
      min: 0,
    },

    azucares: {
      type: Number,
      default: null,
      min: 0,
    },

    azucaresAgregados: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Perfil de grasas
     */

    grasasSaturadas: {
      type: Number,
      default: null,
      min: 0,
    },

    grasasMonoinsaturadas: {
      type: Number,
      default: null,
      min: 0,
    },

    grasasPoliinsaturadas: {
      type: Number,
      default: null,
      min: 0,
    },

    grasasTrans: {
      type: Number,
      default: null,
      min: 0,
    },

    colesterol: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Minerales
     */

    sodio: {
      type: Number,
      default: null,
      min: 0,
    },

    potasio: {
      type: Number,
      default: null,
      min: 0,
    },

    calcio: {
      type: Number,
      default: null,
      min: 0,
    },

    hierro: {
      type: Number,
      default: null,
      min: 0,
    },

    magnesio: {
      type: Number,
      default: null,
      min: 0,
    },

    fosforo: {
      type: Number,
      default: null,
      min: 0,
    },

    zinc: {
      type: Number,
      default: null,
      min: 0,
    },

    selenio: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Vitaminas
     */

    vitaminaA: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaC: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaD: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaE: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaK: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB1: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB2: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB3: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB6: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB9: {
      type: Number,
      default: null,
      min: 0,
    },

    vitaminaB12: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Otros
     */

    alcohol: {
      type: Number,
      default: null,
      min: 0,
    },

    agua: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    _id: false,
  },
)

/*
 * ----------------------------------------------------
 * ALIMENTO
 * ----------------------------------------------------
 */

const alimentoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    nombreNormalizado: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    /*
     * Clasificación SMAE / NutriA
     */

    grupo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    subgrupo: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    /*
     * Porción utilizada como referencia
     */

    porcion: {
      type: porcionSchema,
      default: () => ({}),
    },

    /*
     * Número de equivalentes SMAE que representa
     * la porción registrada.
     */

    equivalentes: {
      type: Number,
      default: 1,
      min: 0,
    },

    nutrimentos: {
      type: nutrimentosSchema,
      default: () => ({}),
    },

    /*
     * Información adicional
     */

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
      type: [
        String,
      ],
      default: [],
    },

    /*
     * Procedencia
     */

    fuentes: {
      type: [
        fuenteSchema,
      ],
      default: [],
    },

    origen: {
      type: String,
      enum: [
        'manual',
        'importado',
        'smae_referencia',
        'incmnsz',
        'imss',
        'usda',
        'mixto',
        'otra_fuente',
      ],
      default: 'manual',
      index: true,
    },

    /*
     * Si utilizamos FoodData Central,
     * conservamos el identificador original.
     */

    fdcId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    /*
     * Control de calidad
     */

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

    fechaRevision: {
      type: Date,
      default: null,
    },

    notasRevision: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

/*
 * ----------------------------------------------------
 * ÍNDICE DE BÚSQUEDA
 * ----------------------------------------------------
 */

alimentoSchema.index({
  nombre: 'text',
  nombreNormalizado: 'text',
  grupo: 'text',
  subgrupo: 'text',
  tags: 'text',
})

/*
 * ----------------------------------------------------
 * NORMALIZACIÓN
 * ----------------------------------------------------
 */

alimentoSchema.pre(
  'save',
  function normalizarAlimento() {
    if (this.nombre) {
      this.nombreNormalizado =
        this.nombre
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            '',
          )
    }

    if (
      Array.isArray(
        this.tags,
      )
    ) {
      this.tags = [
        ...new Set(
          this.tags
            .filter(Boolean)
            .map(
              (tag) =>
                tag
                  .trim()
                  .toLowerCase(),
            ),
        ),
      ]
    }
  },
)

module.exports =
  mongoose.model(
    'Alimento',
    alimentoSchema,
  )