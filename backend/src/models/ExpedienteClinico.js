const mongoose = require('mongoose')

const expedienteClinicoSchema =
  new mongoose.Schema(
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

      /*
       * ==========================================
       * ANTECEDENTES PERSONALES PATOLÓGICOS
       * ==========================================
       */

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

      enfermedades: {
        type: String,
        trim: true,
        default: '',
      },

      medicamentos: {
        type: String,
        trim: true,
        default: '',
      },

      cirugias: {
        type: String,
        trim: true,
        default: '',
      },

      lesionesActuales: {
        type: String,
        trim: true,
        default: '',
      },

      padecimientos: {
        type: String,
        trim: true,
        default: '',
      },

      /*
       * ==========================================
       * FARMACOLÓGICO Y HÁBITOS
       * ==========================================
       */

      tratamientoFarmacologico: {
        usa: {
          type: Boolean,
          default: false,
        },

        descripcion: {
          type: String,
          trim: true,
          default: '',
        },
      },

      tabaquismo: {
        fuma: {
          type: Boolean,
          default: false,
        },

        frecuenciaSemanal: {
          type: String,
          trim: true,
          default: '',
        },
      },

      alcohol: {
        consume: {
          type: Boolean,
          default: false,
        },

        frecuencia: {
          type: String,
          trim: true,
          default: '',
        },
      },

      drogas: {
        consume: {
          type: Boolean,
          default: false,
        },

        descripcion: {
          type: String,
          trim: true,
          default: '',
        },
      },

      anabolicos: {
        consume: {
          type: Boolean,
          default: false,
        },

        descripcion: {
          type: String,
          trim: true,
          default: '',
        },
      },

      suplementos: {
        consume: {
          type: Boolean,
          default: false,
        },

        descripcion: {
          type: String,
          trim: true,
          default: '',
        },
      },

      /*
       * ==========================================
       * NUTRICIÓN
       * ==========================================
       */

      nutricion: {
        primeraComida: {
          type: String,
          trim: true,
          default: '',
        },

        ultimaComida: {
          type: String,
          trim: true,
          default: '',
        },

        comidaFavorita: {
          type: String,
          trim: true,
          default: '',
        },

        comidaDisgusta: {
          type: String,
          trim: true,
          default: '',
        },

        numeroComidasDia: {
          type: Number,
          min: 0,
          default: null,
        },

        cafePorDia: {
          type: String,
          trim: true,
          default: '',
        },

        bebidasEnergeticasSemana: {
          type: String,
          trim: true,
          default: '',
        },

        bebidasAzucaradasSemana: {
          type: String,
          trim: true,
          default: '',
        },

        intoleranciasAlimentarias: {
          type: String,
          trim: true,
          default: '',
        },

        objetivoPrincipal: {
          type: String,
          enum: [
            '',
            'perdida_peso',
            'incremento_masa',
            'imagen_personal',
            'salud',
            'rendimiento_deportivo',
            'control_enfermedades',
            'otro',
          ],
          default: '',
        },

        objetivoOtro: {
          type: String,
          trim: true,
          default: '',
        },
      },

      /*
       * ==========================================
       * DEPORTE
       * ==========================================
       */

      deporte: {
        lugarEntrenamiento: {
          type: String,
          enum: [
            '',
            'casa',
            'gym',
            'parque',
            'otro',
          ],
          default: '',
        },

        lugarOtro: {
          type: String,
          trim: true,
          default: '',
        },

        diasPorSemana: {
          type: Number,
          min: 0,
          max: 7,
          default: null,
        },

        ejercicioRealizar: {
          type: String,
          trim: true,
          default: '',
        },

        nivelExperiencia: {
          type: String,
          enum: [
            '',
            'principiante',
            'principiante_intermedio',
            'intermedio',
            'avanzado',
          ],
          default: '',
        },
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