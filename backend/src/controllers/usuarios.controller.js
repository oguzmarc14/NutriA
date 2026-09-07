const { z } = require('zod')
const User = require('../models/User')

const actualizarRolSchema = z.object({
  role: z.enum(['admin', 'nutritionist', 'patient']),
})

async function obtenerUsuarios(req, res, next) {
  try {
    const usuarios = await User.find({
      active: true,
    })
      .select('-password')
      .sort({ createdAt: -1 })

    return res.json({ usuarios })
  } catch (error) {
    return next(error)
  }
}

async function actualizarRol(req, res, next) {
  try {
    const parsed = actualizarRolSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Rol de usuario inválido',
      })
    }

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: parsed.data.role,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select('-password')

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      })
    }

    return res.json({
      message: 'Rol actualizado correctamente',
      usuario,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  obtenerUsuarios,
  actualizarRol,
}