const jwt = require('jsonwebtoken')
const { z } = require('zod')
const User = require('../models/User')

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Correo o contraseña inválidos' })
    }

    const user = await User.findOne({
      email: parsed.data.email.toLowerCase(),
      active: true,
    }).select('+password')

    if (!user || !(await user.comparePassword(parsed.data.password))) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' })
    }

    return res.json({ token: createToken(user), user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

function getCurrentUser(req, res) {
  return res.json({ user: publicUser(req.user) })
}

module.exports = { getCurrentUser, login }
