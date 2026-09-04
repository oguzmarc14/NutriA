const express = require('express')
const {
  crearPaciente,
  obtenerPacientes,
} = require('../controllers/pacientes.controller')
const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('admin', 'nutritionist'))

router.post('/', crearPaciente)
router.get('/', obtenerPacientes)

module.exports = router