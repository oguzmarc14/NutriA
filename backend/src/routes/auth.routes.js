const express = require('express')

const {
  getCurrentUser,
  loginGoogle,
  loginPaciente,
  activarCuentaPaciente,
} = require('../controllers/auth.controller')

const {
  requireAuth,
} = require('../middleware/auth.middleware')
const {
  solicitarRestablecimiento,
  restablecerContrasena,
} = require('../controllers/recuperacion.controller')

const router = express.Router()

// Administradores y nutriólogos
router.post('/google', loginGoogle)

// Pacientes
router.post('/paciente/login', loginPaciente)
router.post('/paciente/activar', activarCuentaPaciente)
router.post('/paciente/recuperar', solicitarRestablecimiento)
router.post('/paciente/restablecer', restablecerContrasena)

// Usuario autenticado actual
router.get('/me', requireAuth, getCurrentUser)

module.exports = router
