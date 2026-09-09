const { z } = require('zod')

const ExpedienteClinico = require('../models/ExpedienteClinico')
const Pacientes = require('../models/Pacientes')
const Medicion = require('../models/Medicion')

/*
 * ----------------------------------------------------
 * SCHEMAS AUXILIARES
 * ----------------------------------------------------
 */

const booleanOptional = z.coerce.boolean().optional()

const stringOptional = z
  .string()
  .trim()
  .optional()

const numeroOpcional = z.preprocess(
  (valor) => {
    if (
      valor === '' ||
      valor === null ||
      valor === undefined
    ) {
      return undefined
    }

    return Number(valor)
  },
  z.number().optional(),
)

/*
 * ----------------------------------------------------
 * VALIDACIÓN DEL EXPEDIENTE
 * ----------------------------------------------------
 */

const expedienteSchema = z.object({
  /*
   * ANTECEDENTES
   */

  antecedentesPersonales:
    stringOptional,

  antecedentesFamiliares:
    stringOptional,

  alergias:
    stringOptional,

  enfermedades:
    stringOptional,

  medicamentos:
    stringOptional,

  cirugias:
    stringOptional,

  lesionesActuales:
    stringOptional,

  padecimientos:
    stringOptional,

  /*
   * FARMACOLÓGICO
   */

  tratamientoFarmacologico: z
    .object({
      usa: booleanOptional,

      descripcion:
        stringOptional,
    })
    .optional(),

  tabaquismo: z
    .object({
      fuma: booleanOptional,

      frecuenciaSemanal:
        stringOptional,
    })
    .optional(),

  alcohol: z
    .object({
      consume: booleanOptional,

      frecuencia:
        stringOptional,
    })
    .optional(),

  drogas: z
    .object({
      consume: booleanOptional,

      descripcion:
        stringOptional,
    })
    .optional(),

  anabolicos: z
    .object({
      consume: booleanOptional,

      descripcion:
        stringOptional,
    })
    .optional(),

  suplementos: z
    .object({
      consume: booleanOptional,

      descripcion:
        stringOptional,
    })
    .optional(),

  /*
   * NUTRICIÓN
   */

  nutricion: z
    .object({
      primeraComida:
        stringOptional,

      ultimaComida:
        stringOptional,

      comidaFavorita:
        stringOptional,

      comidaDisgusta:
        stringOptional,

      numeroComidasDia:
        numeroOpcional,

      cafePorDia:
        stringOptional,

      bebidasEnergeticasSemana:
        stringOptional,

      bebidasAzucaradasSemana:
        stringOptional,

      intoleranciasAlimentarias:
        stringOptional,

      objetivoPrincipal: z
        .enum([
          '',
          'perdida_peso',
          'incremento_masa',
          'imagen_personal',
          'salud',
          'rendimiento_deportivo',
          'control_enfermedades',
          'otro',
        ])
        .optional(),

      objetivoOtro:
        stringOptional,
    })
    .optional(),

  /*
   * DEPORTE
   */

  deporte: z
    .object({
      lugarEntrenamiento: z
        .enum([
          '',
          'casa',
          'gym',
          'parque',
          'otro',
        ])
        .optional(),

      lugarOtro:
        stringOptional,

      diasPorSemana: z.preprocess(
        (valor) => {
          if (
            valor === '' ||
            valor === null ||
            valor === undefined
          ) {
            return undefined
          }

          return Number(valor)
        },
        z
          .number()
          .int()
          .min(0)
          .max(7)
          .optional(),
      ),

      ejercicioRealizar:
        stringOptional,

      nivelExperiencia: z
        .enum([
          '',
          'principiante',
          'principiante_intermedio',
          'intermedio',
          'avanzado',
        ])
        .optional(),
    })
    .optional(),

  /*
   * OBSERVACIONES
   */

  observaciones:
    stringOptional,
})

/*
 * ----------------------------------------------------
 * GUARDAR / ACTUALIZAR EXPEDIENTE
 * ----------------------------------------------------
 */

async function guardarExpediente(
  req,
  res,
  next,
) {
  try {
    const parsed =
      expedienteSchema.safeParse(
        req.body,
      )

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          message:
            'Datos del expediente inválidos',

          errors:
            parsed.error.flatten(),
        })
    }

    /*
     * Verificamos que el paciente
     * pertenezca al nutriólogo actual.
     */

    const paciente =
      await Pacientes.findOne({
        _id:
          req.params.pacienteId,

        nutritionist:
          req.user.id,

        active: true,
      })

    if (!paciente) {
      return res
        .status(404)
        .json({
          message:
            'Paciente no encontrado',
        })
    }

    /*
     * Guardamos o actualizamos un único
     * expediente por paciente.
     */

    const expediente =
      await ExpedienteClinico.findOneAndUpdate(
        {
          paciente:
            paciente._id,

          nutritionist:
            req.user.id,
        },

        {
          ...parsed.data,

          paciente:
            paciente._id,

          nutritionist:
            req.user.id,
        },

        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )

    return res.json({
      message:
        'Expediente clínico guardado correctamente',

      expediente,
    })
  } catch (error) {
    return next(error)
  }
}

/*
 * ----------------------------------------------------
 * OBTENER EXPEDIENTE
 * ----------------------------------------------------
 */

async function obtenerExpediente(
  req,
  res,
  next,
) {
  try {
    /*
     * Verificamos nuevamente propiedad
     * del paciente.
     */

    const paciente =
      await Pacientes.findOne({
        _id:
          req.params.pacienteId,

        nutritionist:
          req.user.id,

        active: true,
      }).lean()

    if (!paciente) {
      return res
        .status(404)
        .json({
          message:
            'Paciente no encontrado',
        })
    }

    /*
     * Expediente clínico existente.
     */

    const expediente =
      await ExpedienteClinico.findOne({
        paciente:
          paciente._id,

        nutritionist:
          req.user.id,
      }).lean()

    /*
     * Última medición registrada.
     *
     * Esto permitirá al frontend mostrar
     * automáticamente:
     * - peso
     * - estatura
     * - IMC
     * - edad registrada
     * - nivel de actividad
     * - antropométricas
     */

    const ultimaMedicion =
      await Medicion.findOne({
        paciente:
          paciente._id,

        nutritionist:
          req.user.id,
      })
        .sort({
          fecha: -1,
          createdAt: -1,
        })
        .select(
          [
            'edad',
            'peso',
            'estatura',
            'imc',
            'nivelActividadFisica',
            'grasaCorporal',
            'grasaVisceral',
            'masaMuscular',
            'masaOsea',
            'proteina',
            'fecha',
          ].join(' '),
        )
        .lean()

    return res.json({
      paciente,

      expediente:
        expediente || null,

      ultimaMedicion:
        ultimaMedicion || null,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  guardarExpediente,
  obtenerExpediente,
}