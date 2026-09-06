const express = require('express')
const {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
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

router.get('/:id', obtenerPacientePorId)
router.put('/:id', actualizarPaciente)

module.exports = router