const { z } = require('zod')
const crypto = require('crypto')

const Pacientes = require('../models/Pacientes')
const Medicion = require('../models/Medicion')
const ExpedienteClinico = require('../models/ExpedienteClinico')
const PlanAlimenticio = require('../models/PlanAlimenticio')
const User = require('../models/User')
const { enviarInvitacionPaciente } = require('../services/email.service')

const crearPacienteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      'El nombre es obligatorio',
    ),

  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .optional(),

  birthDate: z.coerce
    .date()
    .optional(),

  sex: z
    .enum([
      'male',
      'female',
      'other',
      'unspecified',
    ])
    .optional(),

  notes: z
    .string()
    .trim()
    .optional(),
})

const nuevoPacienteSchema = crearPacienteSchema.extend({
  email: z.string().trim().email('Ingresa un correo válido'),
})

function crearTokenActivacion() {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(token).digest('hex')

  return { token, hash }
}

async function crearPaciente(
  req,
  res,
  next,
) {
  try {
    const parsed =
      nuevoPacienteSchema.safeParse(
        req.body,
      )

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          message:
            'Datos del paciente inválidos',

          errors:
            parsed.error.flatten(),
        })
    }

    const normalizedEmail = parsed.data.email.toLowerCase()

    const usuarioExistente = await User.exists({ email: normalizedEmail })

    if (usuarioExistente) {
      return res.status(409).json({
        message: 'Ya existe una cuenta registrada con este correo',
      })
    }

    let paciente
    let usuario

    try {
      paciente = await Pacientes.create({
        ...parsed.data,
        email: normalizedEmail,
        nutritionist: req.user.id,
      })

      const { token, hash } = crearTokenActivacion()

      usuario = await User.create({
        name: paciente.name,
        email: normalizedEmail,
        role: 'patient',
        authProvider: 'password',
        patient: paciente._id,
        accountStatus: 'pending',
        activationToken: hash,
        activationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      await enviarInvitacionPaciente({
        email: normalizedEmail,
        name: paciente.name,
        nutritionistName: req.user.name,
        activationToken: token,
      })
    } catch (error) {
      if (usuario?._id) {
        await User.findByIdAndDelete(usuario._id)
      }

      if (paciente?._id) {
        await Pacientes.findByIdAndDelete(paciente._id)
      }

      if (error?.code === 11000) {
        return res.status(409).json({
          message: 'Ya existe una cuenta registrada con este correo',
        })
      }

      throw error
    }

    return res
      .status(201)
      .json({
        message:
          'Paciente registrado. La invitación fue enviada a su correo.',

        paciente: {
          ...paciente.toObject(),
          accountStatus: 'pending',
        },
      })
  } catch (error) {
    return next(error)
  }
}

async function obtenerPacientes(
  req,
  res,
  next,
) {
  try {
    const pacientes =
      await Pacientes.find({
        nutritionist:
          req.user.id,

        active: true,
      })
        .sort({
          createdAt: -1,
        })
        .lean()

    /*
     * Para cada paciente buscamos
     * solamente su medición más reciente.
     */

    const usuariosPaciente = await User.find({
      patient: { $in: pacientes.map((paciente) => paciente._id) },
      role: 'patient',
    }).select('patient accountStatus').lean()

    const estadosPorPaciente = new Map(
      usuariosPaciente.map((usuario) => [
        usuario.patient.toString(),
        usuario.accountStatus,
      ]),
    )

    const pacientesConMedicion =
      await Promise.all(
        pacientes.map(
          async (paciente) => {
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
                  'peso estatura imc fecha',
                )
                .lean()

            return {
              ...paciente,

              accountStatus:
                estadosPorPaciente.get(paciente._id.toString()) || null,

              ultimaMedicion:
                ultimaMedicion ||
                null,
            }
          },
        ),
      )

    return res.json({
      pacientes:
        pacientesConMedicion,
    })
  } catch (error) {
    return next(error)
  }
}

async function reenviarInvitacion(req, res, next) {
  try {
    const paciente = await Pacientes.findOne({
      _id: req.params.id,
      nutritionist: req.user.id,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    const usuario = await User.findOne({
      patient: paciente._id,
      role: 'patient',
      accountStatus: 'pending',
      active: true,
    }).select('+activationToken +activationTokenExpiresAt')

    if (!usuario) {
      return res.status(409).json({
        message: 'La cuenta ya está activa o no tiene una invitación pendiente',
      })
    }

    const previousToken = usuario.activationToken
    const previousExpiration = usuario.activationTokenExpiresAt
    const { token, hash } = crearTokenActivacion()
    usuario.activationToken = hash
    usuario.activationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await usuario.save()

    try {
      await enviarInvitacionPaciente({
        email: usuario.email,
        name: usuario.name,
        nutritionistName: req.user.name,
        activationToken: token,
      })
    } catch (error) {
      usuario.activationToken = previousToken
      usuario.activationTokenExpiresAt = previousExpiration
      await usuario.save()
      throw error
    }

    return res.json({ message: 'Invitación reenviada correctamente' })
  } catch (error) {
    return next(error)
  }
}

async function obtenerPacientePorId(
  req,
  res,
  next,
) {
  try {
    const paciente =
      await Pacientes.findOne({
        _id: req.params.id,

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

    return res.json({
      paciente,
    })
  } catch (error) {
    return next(error)
  }
}

async function actualizarPaciente(
  req,
  res,
  next,
) {
  try {
    const parsed =
      crearPacienteSchema.safeParse(
        req.body,
      )

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          message:
            'Datos del paciente inválidos',

          errors:
            parsed.error.flatten(),
        })
    }

    const paciente =
      await Pacientes.findOneAndUpdate(
        {
          _id: req.params.id,

          nutritionist:
            req.user.id,

          active: true,
        },

        parsed.data,

        {
          new: true,
          runValidators: true,
        },
      )

    if (!paciente) {
      return res
        .status(404)
        .json({
          message:
            'Paciente no encontrado',
        })
    }

    return res.json({
      message:
        'Paciente actualizado correctamente',

      paciente,
    })
  } catch (error) {
    return next(error)
  }
}

async function eliminarPaciente(req, res, next) {
  try {
    const paciente = await Pacientes.findOne({
      _id: req.params.id,
      nutritionist: req.user.id,
      active: true,
    })

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }

    await Promise.all([
      Medicion.deleteMany({ paciente: paciente._id }),
      ExpedienteClinico.deleteMany({ paciente: paciente._id }),
      PlanAlimenticio.deleteMany({ paciente: paciente._id }),
      User.deleteMany({ patient: paciente._id, role: 'patient' }),
    ])

    await paciente.deleteOne()

    return res.json({ message: 'Paciente eliminado correctamente' })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  eliminarPaciente,
  reenviarInvitacion,
}
