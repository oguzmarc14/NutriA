const express = require('express')

const {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  reenviarInvitacion,
} = require('../controllers/pacientes.controller')

const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('nutritionist'))

router.post('/', crearPaciente)
router.post('/:id/reenviar-invitacion', reenviarInvitacion)
router.get('/', obtenerPacientes)

router.get('/:id', obtenerPacientePorId)
router.put('/:id', actualizarPaciente)

module.exports = router
