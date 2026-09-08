const { z } = require('zod')
const User = require('../models/User')

const crearUsuarioSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre es obligatorio'),

  email: z
    .string()
    .trim()
    .email('El correo electrónico no es válido'),

  role: z.enum(['admin', 'nutritionist'], {
    errorMap: () => ({
      message:
        'El rol debe ser administrador o nutriólogo',
    }),
  }),
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

    // Si existe googleSub, significa que el usuario
    // ya inició sesión correctamente con Google.
    googleVerified: Boolean(usuario.googleSub),

    createdAt: usuario.createdAt,
  }
}

async function obtenerUsuarios(req, res, next) {
  try {
    const usuarios = await User.find({
      role: {
        $in: ['admin', 'nutritionist'],
      },

      authProvider: 'google',
    })
      .select('+googleSub')
      .sort({ createdAt: -1 })

    const administradores = usuarios
      .filter(
        (usuario) => usuario.role === 'admin',
      )
      .map(usuarioPublico)

    const nutriologos = usuarios
      .filter(
        (usuario) =>
          usuario.role === 'nutritionist',
      )
      .map(usuarioPublico)

    return res.json({
      administradores,
      nutriologos,
    })
  } catch (error) {
    return next(error)
  }
}

async function crearUsuario(req, res, next) {
  try {
    const parsed =
      crearUsuarioSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          'Los datos del usuario no son válidos',
      })
    }

    const name = parsed.data.name.trim()

    const email = parsed.data.email
      .trim()
      .toLowerCase()

    const role = parsed.data.role

    const usuarioExistente = await User.findOne({
      email,
    })

    if (usuarioExistente) {
      return res.status(409).json({
        message:
          'Ya existe una cuenta registrada con este correo',
      })
    }

    const usuario = await User.create({
      name,
      email,
      role,

      // Administradores y nutriólogos
      // utilizan Google para autenticarse.
      authProvider: 'google',

      active: true,
      accountStatus: 'active',
    })

    return res.status(201).json({
      message:
        role === 'admin'
          ? 'Administrador autorizado correctamente'
          : 'Nutriólogo autorizado correctamente',

      usuario: usuarioPublico(usuario),
    })
  } catch (error) {
    return next(error)
  }
}

async function actualizarEstadoUsuario(
  req,
  res,
  next,
) {
  try {
    const parsed =
      actualizarEstadoSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message:
          'El estado de la cuenta no es válido',
      })
    }

    const usuario = await User.findOne({
      _id: req.params.id,

      role: {
        $in: ['admin', 'nutritionist'],
      },

      authProvider: 'google',
    }).select('+googleSub')

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      })
    }

    const nuevoEstado = parsed.data.active

    /*
     * PROTECCIÓN 1
     *
     * Un administrador no puede desactivar
     * su propia cuenta.
     */
    if (
      usuario.role === 'admin' &&
      usuario.id === req.user.id &&
      nuevoEstado === false
    ) {
      return res.status(400).json({
        message:
          'No puedes desactivar tu propia cuenta',
      })
    }

    /*
     * PROTECCIÓN 2
     *
     * No permitimos desactivar al último
     * administrador activo.
     */
    if (
      usuario.role === 'admin' &&
      usuario.active === true &&
      nuevoEstado === false
    ) {
      const administradoresActivos =
        await User.countDocuments({
          role: 'admin',
          authProvider: 'google',
          active: true,
        })

      if (administradoresActivos <= 1) {
        return res.status(400).json({
          message:
            'Debe existir al menos un administrador activo',
        })
      }
    }

    usuario.active = nuevoEstado

    await usuario.save()

    return res.json({
      message: usuario.active
        ? 'Acceso activado correctamente'
        : 'Acceso desactivado correctamente',

      usuario: usuarioPublico(usuario),
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarEstadoUsuario,
}