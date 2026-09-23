const mongoose =
  require('mongoose')

const { z } =
  require('zod')

const PlanAlimenticio =
  require('../models/PlanAlimenticio')

const Pacientes =
  require('../models/Pacientes')

const Alimento =
  require('../models/Alimento')

const SeguimientoComida =
  require('../models/SeguimientoComida')

/*
 * ----------------------------------------------------
 * VALIDACIÓN DE ALIMENTO PERSONALIZADO
 * ----------------------------------------------------
 */

const nutrimentosSchema =
  z.object({
    kcal:
      z.coerce
        .number()
        .min(0)
        .default(0),

    proteina:
      z.coerce
        .number()
        .min(0)
        .default(0),

    carbohidratos:
      z.coerce
        .number()
        .min(0)
        .default(0),

    grasas:
      z.coerce
        .number()
        .min(0)
        .default(0),

    fibra:
      z.coerce
        .number()
        .min(0)
        .nullable()
        .optional(),

    sodio:
      z.coerce
        .number()
        .min(0)
        .nullable()
        .optional(),
  })

const porcionSchema =
  z.object({
    cantidad:
      z.coerce
        .number()
        .min(0)
        .default(1),

    unidad:
      z.string()
        .trim()
        .optional(),

    gramos:
      z.coerce
        .number()
        .min(0)
        .nullable()
        .optional(),

    descripcion:
      z.string()
        .trim()
        .optional(),
  })

/*
 * ----------------------------------------------------
 * ALIMENTO DEL CATÁLOGO
 * ----------------------------------------------------
 */

const alimentoCatalogoSchema =
  z.object({
    tipo:
      z.literal(
        'catalogo',
      ),

    alimentoId:
      z.string()
        .min(
          1,
          'El alimento es obligatorio',
        ),

    cantidad:
      z.coerce
        .number()
        .min(0.1)
        .default(1),

    notas:
      z.string()
        .trim()
        .optional(),
  })

/*
 * ----------------------------------------------------
 * ALIMENTO PERSONALIZADO
 * ----------------------------------------------------
 */

const alimentoPersonalizadoSchema =
  z.object({
    tipo:
      z.literal(
        'personalizado',
      ),

    nombre:
      z.string()
        .trim()
        .min(
          2,
          'El nombre del alimento es obligatorio',
        ),

    grupo:
      z.string()
        .trim()
        .optional(),

    porcion:
      porcionSchema
        .optional(),

    nutrimentos:
      nutrimentosSchema,

    cantidad:
      z.coerce
        .number()
        .min(0.1)
        .default(1),

    notas:
      z.string()
        .trim()
        .optional(),
  })

/*
 * ----------------------------------------------------
 * ALIMENTO
 * ----------------------------------------------------
 */

const alimentoPlanSchema =
  z.discriminatedUnion(
    'tipo',
    [
      alimentoCatalogoSchema,
      alimentoPersonalizadoSchema,
    ],
  )

/*
 * ----------------------------------------------------
 * COMIDA
 * ----------------------------------------------------
 */

const comidaSchema =
  z.object({
    _id:
      z.string()
        .regex(/^[a-f\d]{24}$/i)
        .optional(),

    nombre:
      z.string()
        .trim()
        .min(2),

    platillo:
      z.string()
        .trim()
        .optional(),

    descripcion:
      z.string()
        .trim()
        .optional(),

    hora:
      z.string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .or(z.literal(''))
        .optional(),

    alimentos:
      z.array(
        alimentoPlanSchema,
      )
        .optional(),
  })

/*
 * ----------------------------------------------------
 * PLAN
 * ----------------------------------------------------
 */

const planSchema =
  z.object({
    nombre:
      z.string()
        .trim()
        .min(
          2,
          'El nombre del plan es obligatorio',
        ),

    objetivo:
      z.string()
        .trim()
        .optional(),

    comidas:
      z.array(
        comidaSchema,
      )
        .optional(),

    fechaInicio:
      z.coerce
        .date(),
  })

/*
 * ----------------------------------------------------
 * CONVERTIR ALIMENTOS PARA GUARDAR
 * ----------------------------------------------------
 */

async function prepararComidas(
  comidas = [],
) {
  const comidasPreparadas = []

  for (const comida of comidas) {
    const alimentosPreparados = []

    for (
      const item of
      comida.alimentos || []
    ) {
      /*
       * ------------------------------------------------
       * ALIMENTO DEL CATÁLOGO
       * ------------------------------------------------
       */

      if (
        item.tipo ===
        'catalogo'
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            item.alimentoId,
          )
        ) {
          const error =
            new Error(
              'ID de alimento inválido',
            )

          error.status = 400

          throw error
        }

        const alimento =
          await Alimento.findOne({
            _id:
              item.alimentoId,

            activo: true,
          })

        if (!alimento) {
          const error =
            new Error(
              'Uno de los alimentos seleccionados no existe',
            )

          error.status = 404

          throw error
        }

        /*
         * IMPORTANTE:
         *
         * copiamos al plan los valores actuales.
         * No dependemos únicamente del ObjectId.
         */

        alimentosPreparados.push({
          tipo:
            'catalogo',

          alimento:
            alimento._id,

          nombre:
            alimento.nombre,

          grupo:
            alimento.grupo,

          porcion: {
            cantidad:
              alimento.porcion
                ?.cantidad ??
              1,

            unidad:
              alimento.porcion
                ?.unidad ||
              '',

            gramos:
              alimento.porcion
                ?.gramos ??
              null,

            descripcion:
              alimento.porcion
                ?.descripcion ||
              '',
          },

          nutrimentos: {
            kcal:
              alimento.nutrimentos
                ?.kcal ??
              0,

            proteina:
              alimento.nutrimentos
                ?.proteina ??
              0,

            carbohidratos:
              alimento.nutrimentos
                ?.carbohidratos ??
              0,

            grasas:
              alimento.nutrimentos
                ?.grasas ??
              0,

            fibra:
              alimento.nutrimentos
                ?.fibra ??
              null,

            sodio:
              alimento.nutrimentos
                ?.sodio ??
              null,
          },

          cantidad:
            item.cantidad ??
            1,

          notas:
            item.notas ||
            '',
        })

        continue
      }

      /*
       * ------------------------------------------------
       * ALIMENTO PERSONALIZADO
       * ------------------------------------------------
       */

      alimentosPreparados.push({
        tipo:
          'personalizado',

        alimento:
          null,

        nombre:
          item.nombre,

        grupo:
          item.grupo ||
          '',

        porcion: {
          cantidad:
            item.porcion
              ?.cantidad ??
            1,

          unidad:
            item.porcion
              ?.unidad ||
            '',

          gramos:
            item.porcion
              ?.gramos ??
            null,

          descripcion:
            item.porcion
              ?.descripcion ||
            '',
        },

        nutrimentos: {
          kcal:
            item.nutrimentos
              ?.kcal ??
            0,

          proteina:
            item.nutrimentos
              ?.proteina ??
            0,

          carbohidratos:
            item.nutrimentos
              ?.carbohidratos ??
            0,

          grasas:
            item.nutrimentos
              ?.grasas ??
            0,

          fibra:
            item.nutrimentos
              ?.fibra ??
            null,

          sodio:
            item.nutrimentos
              ?.sodio ??
            null,
        },

        cantidad:
          item.cantidad ??
          1,

        notas:
          item.notas ||
          '',
      })
    }

    comidasPreparadas.push({
      ...(comida._id
        ? { _id: comida._id }
        : {}),

      nombre:
        comida.nombre,

      platillo:
        comida.platillo || '',

      hora:
        comida.hora || '',

      descripcion:
        comida.descripcion ||
        '',

      alimentos:
        alimentosPreparados,
    })
  }

  return comidasPreparadas
}

/*
 * ----------------------------------------------------
 * CREAR PLAN ALIMENTICIO
 * ----------------------------------------------------
 */

async function crearPlanAlimenticio(
  req,
  res,
  next,
) {
  try {
    const parsed =
      planSchema.safeParse(
        req.body,
      )

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          message:
            'Datos del plan alimenticio inválidos',

          errors:
            parsed.error.flatten(),
        })
    }

    /*
     * Verificamos que el paciente
     * pertenezca al nutriólogo.
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
     * Preparamos alimentos del catálogo
     * y personalizados.
     */

    const comidas =
      await prepararComidas(
        parsed.data.comidas ||
          [],
      )

    const plan =
      await PlanAlimenticio.create(
        {
          paciente:
            paciente._id,

          nutritionist:
            req.user.id,

          nombre:
            parsed.data.nombre,

          objetivo:
            parsed.data.objetivo ||
            '',

          comidas,

          fechaInicio:
            parsed.data
              .fechaInicio ||
            new Date(),
        },
      )

    return res
      .status(201)
      .json({
        message:
          'Plan alimenticio creado correctamente',

        plan,
      })
  } catch (error) {
    /*
     * Errores controlados
     * generados al preparar alimentos.
     */

    if (error.status) {
      return res
        .status(
          error.status,
        )
        .json({
          message:
            error.message,
        })
    }

    return next(error)
  }
}

/*
 * ----------------------------------------------------
 * OBTENER PLANES DEL PACIENTE
 * ----------------------------------------------------
 */

async function obtenerPlanesAlimenticios(
  req,
  res,
  next,
) {
  try {
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

    const planes =
      await PlanAlimenticio.find(
        {
          paciente:
            paciente._id,

          nutritionist:
            req.user.id,
        },
      )
        .sort({
          fechaInicio: -1,
          createdAt: -1,
        })
        .lean()

    return res.json({
      paciente,
      planes,
    })
  } catch (error) {
    return next(error)
  }
}

async function actualizarPlanAlimenticio(req, res, next) {
  try {
    const parsed = planSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos del plan alimenticio inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const paciente = await Pacientes.findOne({
      _id: req.params.pacienteId,
      nutritionist: req.user.id,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    const comidas = await prepararComidas(parsed.data.comidas || [])
    const plan = await PlanAlimenticio.findOneAndUpdate(
      {
        _id: req.params.planId,
        paciente: paciente._id,
        nutritionist: req.user.id,
      },
      {
        nombre: parsed.data.nombre,
        objetivo: parsed.data.objetivo || '',
        comidas,
        fechaInicio: parsed.data.fechaInicio,
      },
      { new: true, runValidators: true },
    )

    if (!plan) {
      return res.status(404).json({ message: 'Plan alimenticio no encontrado' })
    }

    await SeguimientoComida.deleteMany({
      plan: plan._id,
      comida: {
        $nin: plan.comidas.map((comida) => comida._id),
      },
    })

    const fechaSeguimiento = plan.fechaInicio.toISOString().slice(0, 10)

    await Promise.all(
      plan.comidas.map((comida) =>
        SeguimientoComida.updateMany(
          { plan: plan._id, comida: comida._id },
          {
            fecha: fechaSeguimiento,
            nombreComida: comida.nombre,
            platillo: comida.platillo || '',
          },
        ),
      ),
    )

    return res.json({ message: 'Plan alimenticio actualizado correctamente', plan })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    return next(error)
  }
}

async function eliminarPlanAlimenticio(req, res, next) {
  try {
    const plan = await PlanAlimenticio.findOneAndDelete({
      _id: req.params.planId,
      paciente: req.params.pacienteId,
      nutritionist: req.user.id,
    })

    if (!plan) {
      return res.status(404).json({ message: 'Plan alimenticio no encontrado' })
    }

    await SeguimientoComida.deleteMany({
      plan: plan._id,
      paciente: plan.paciente,
    })

    return res.json({ message: 'Plan alimenticio eliminado correctamente' })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  crearPlanAlimenticio,
  obtenerPlanesAlimenticios,
  actualizarPlanAlimenticio,
  eliminarPlanAlimenticio,
}
