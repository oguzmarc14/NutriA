const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { z } = require('zod')

const User = require('../models/User')

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
)

const loginPacienteSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

const loginGoogleSchema = z.object({
  credential: z.string().min(1),
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
    {
      sub: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '8h',
    },
  )
}

/*
 * Login exclusivo para pacientes.
 *
 * Los administradores y nutriólogos
 * no deben iniciar sesión con contraseña.
 */
async function loginPaciente(req, res, next) {
  try {
    const parsed =
      loginPacienteSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Correo o contraseña inválidos',
      })
    }

    const user = await User.findOne({
      email: parsed.data.email
        .trim()
        .toLowerCase(),
      role: 'patient',
      authProvider: 'password',
      active: true,
      accountStatus: 'active',
    }).select('+password')

    if (
      !user ||
      !user.password ||
      !(await user.comparePassword(
        parsed.data.password,
      ))
    ) {
      return res.status(401).json({
        message:
          'Correo o contraseña incorrectos',
      })
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

/*
 * Login mediante Google.
 *
 * Exclusivo para:
 * - administradores
 * - nutriólogos
 *
 * La cuenta debe existir previamente
 * en NutriA y estar activa.
 */
async function loginGoogle(req, res, next) {
  try {
    const parsed =
      loginGoogleSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message:
          'Credencial de Google inválida',
      })
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: parsed.data.credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      })

    const payload = ticket.getPayload()

    if (!payload) {
      return res.status(401).json({
        message:
          'No fue posible verificar la cuenta de Google',
      })
    }

    const {
      sub,
      email,
      email_verified: emailVerified,
    } = payload

    if (!email || !emailVerified) {
      return res.status(401).json({
        message:
          'La cuenta de Google no tiene un correo verificado',
      })
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase()

    const user = await User.findOne({
      email: normalizedEmail,
      role: {
        $in: ['admin', 'nutritionist'],
      },
      authProvider: 'google',
      active: true,
      accountStatus: 'active',
    }).select('+googleSub')

    if (!user) {
      return res.status(403).json({
        message:
          'Esta cuenta de Google no está autorizada en NutriA',
      })
    }

    /*
     * Primera vez que el usuario entra con Google:
     * asociamos su identificador estable "sub".
     */
    if (!user.googleSub) {
      user.googleSub = sub
      await user.save()
    }

    /*
     * Si el usuario ya estaba vinculado a Google,
     * el sub debe coincidir.
     */
    if (user.googleSub !== sub) {
      return res.status(403).json({
        message:
          'La cuenta de Google no coincide con el usuario autorizado',
      })
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    })
  } catch (error) {
    /*
     * No exponemos detalles internos
     * de la validación de Google.
     */
    if (
      error.message?.includes(
        'Wrong recipient',
      ) ||
      error.message?.includes(
        'Token used too late',
      ) ||
      error.message?.includes(
        'Invalid token',
      )
    ) {
      return res.status(401).json({
        message:
          'La autenticación con Google no es válida o expiró',
      })
    }

    return next(error)
  }
}

function getCurrentUser(req, res) {
  return res.json({
    user: publicUser(req.user),
  })
}

module.exports = {
  getCurrentUser,
  loginPaciente,
  loginGoogle,
}