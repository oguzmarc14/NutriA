const { z } = require('zod')
const User = require('../models/User')

const crearNutriologoSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().email('El correo electrónico no es válido'),
})

const actualizarEstadoSchema = z.object({
  active: z.boolean(),
})

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role,
    active: usuario.active,
    accountStatus: usuario.accountStatus,
    createdAt: usuario.createdAt,
  }
}

async function obtenerNutriologos(req, res, next) {
  try {
    const nutriologos = await User.find({
      role: 'nutritionist',
      authProvider: 'google',
    }).sort({ createdAt: -1 })

    return res.json({
      nutriologos: nutriologos.map(usuarioPublico),
    })
  } catch (error) {
    return next(error)
  }
}

async function crearNutriologo(req, res, next) {
  try {
    const parsed = crearNutriologoSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          'Los datos del nutriólogo no son válidos',
      })
    }

    const name = parsed.data.name.trim()
    const email = parsed.data.email.trim().toLowerCase()

    const usuarioExistente = await User.findOne({ email })

    if (usuarioExistente) {
      return res.status(409).json({
        message: 'Ya existe una cuenta registrada con este correo',
      })
    }

    const nutriologo = await User.create({
      name,
      email,
      role: 'nutritionist',
      authProvider: 'google',
      active: true,
      accountStatus: 'active',
    })

    return res.status(201).json({
      message: 'Nutriólogo autorizado correctamente',
      nutriologo: usuarioPublico(nutriologo),
    })
  } catch (error) {
    return next(error)
  }
}

async function actualizarEstadoNutriologo(req, res, next) {
  try {
    const parsed = actualizarEstadoSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'El estado de la cuenta no es válido',
      })
    }

    const nutriologo = await User.findOne({
      _id: req.params.id,
      role: 'nutritionist',
      authProvider: 'google',
    })

    if (!nutriologo) {
      return res.status(404).json({
        message: 'Nutriólogo no encontrado',
      })
    }

    nutriologo.active = parsed.data.active

    await nutriologo.save()

    return res.json({
      message: nutriologo.active
        ? 'Nutriólogo activado correctamente'
        : 'Nutriólogo desactivado correctamente',
      nutriologo: usuarioPublico(nutriologo),
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  actualizarEstadoNutriologo,
  crearNutriologo,
  obtenerNutriologos,
}