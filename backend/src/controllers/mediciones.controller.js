const { z } = require('zod')

const Medicion = require('../models/Medicion')
const Pacientes = require('../models/Pacientes')

const medicionSchema = z.object({
  edad: z.coerce
    .number()
    .int()
    .min(1)
    .max(120),

  nivelActividadFisica: z.coerce
    .number()
    .int()
    .min(1)
    .max(5),

  peso: z.coerce
    .number()
    .positive(),

  estatura: z.coerce
    .number()
    .min(0.5)
    .max(3),

  /*
   * MEDIDAS ANTROPOMÉTRICAS
   * Todas son opcionales.
   *
   * preprocess permite convertir "" en undefined,
   * para que los inputs vacíos no provoquen error.
   */

  grasaCorporal: z.preprocess(
    (valor) =>
      valor === '' ||
      valor === null ||
      valor === undefined
        ? undefined
        : Number(valor),

    z
      .number()
      .min(0)
      .max(100)
      .optional(),
  ),

  grasaVisceral: z.preprocess(
    (valor) =>
      valor === '' ||
      valor === null ||
      valor === undefined
        ? undefined
        : Number(valor),

    z
      .number()
      .min(0)
      .optional(),
  ),

  masaMuscular: z.preprocess(
    (valor) =>
      valor === '' ||
      valor === null ||
      valor === undefined
        ? undefined
        : Number(valor),

    z
      .number()
      .min(0)
      .optional(),
  ),

  masaOsea: z.preprocess(
    (valor) =>
      valor === '' ||
      valor === null ||
      valor === undefined
        ? undefined
        : Number(valor),

    z
      .number()
      .min(0)
      .optional(),
  ),

  proteina: z.preprocess(
    (valor) =>
      valor === '' ||
      valor === null ||
      valor === undefined
        ? undefined
        : Number(valor),

    z
      .number()
      .min(0)
      .max(100)
      .optional(),
  ),

  fecha: z.coerce
    .date()
    .optional(),
})

async function registrarMedicion(req, res, next) {
  try {
    const parsed =
      medicionSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message:
          'Datos de la medición inválidos',

        errors:
          parsed.error.flatten(),
      })
    }

    /*
     * Confirmamos que el paciente pertenece
     * al nutriólogo autenticado.
     */
    const paciente =
      await Pacientes.findOne({
        _id: req.params.pacienteId,
        nutritionist: req.user.id,
        active: true,
      })

    if (!paciente) {
      return res.status(404).json({
        message:
          'Paciente no encontrado',
      })
    }

    /*
     * Verificamos automáticamente si este
     * paciente ya tiene alguna medición.
     *
     * No confiamos en un valor enviado
     * manualmente desde el frontend.
     */
    const existeMedicionAnterior =
      await Medicion.exists({
        paciente: paciente._id,
        nutritionist: req.user.id,
      })

    const esPrimeraMedicion =
      !existeMedicionAnterior

    /*
     * IMC calculado exclusivamente
     * en el backend.
     */
    const imc = Number(
      (
        parsed.data.peso /
        parsed.data.estatura ** 2
      ).toFixed(2),
    )

    const medicion =
      await Medicion.create({
        paciente:
          paciente._id,

        nutritionist:
          req.user.id,

        edad:
          parsed.data.edad,

        esPrimeraMedicion,

        nivelActividadFisica:
          parsed.data
            .nivelActividadFisica,

        peso:
          parsed.data.peso,

        estatura:
          parsed.data.estatura,

        imc,

        /*
         * Antropométricas opcionales
         */
        grasaCorporal:
          parsed.data.grasaCorporal,

        grasaVisceral:
          parsed.data.grasaVisceral,

        masaMuscular:
          parsed.data.masaMuscular,

        masaOsea:
          parsed.data.masaOsea,

        proteina:
          parsed.data.proteina,

        fecha:
          parsed.data.fecha ||
          new Date(),
      })

    return res.status(201).json({
      message:
        esPrimeraMedicion
          ? 'Primera medición registrada correctamente'
          : 'Medición registrada correctamente',

      medicion,
    })
  } catch (error) {
    return next(error)
  }
}

async function obtenerHistorialMediciones(
  req,
  res,
  next,
) {
  try {
    /*
     * Nuevamente verificamos que el paciente
     * pertenezca al nutriólogo autenticado.
     */
    const paciente =
      await Pacientes.findOne({
        _id: req.params.pacienteId,
        nutritionist: req.user.id,
        active: true,
      })

    if (!paciente) {
      return res.status(404).json({
        message:
          'Paciente no encontrado',
      })
    }

    const mediciones =
      await Medicion.find({
        paciente:
          paciente._id,

        nutritionist:
          req.user.id,
      }).sort({
        fecha: -1,
      })

    return res.json({
      paciente,
      mediciones,

      /*
       * Esto también nos servirá en frontend
       * para saber si el paciente ya tiene
       * registros anteriores.
       */
      tieneMediciones:
        mediciones.length > 0,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  registrarMedicion,
  obtenerHistorialMediciones,
}