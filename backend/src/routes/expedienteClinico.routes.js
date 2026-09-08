const express = require('express')

const {
  guardarExpediente,
  obtenerExpediente,
} = require('../controllers/expedienteClinico.controller')

const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('nutritionist'))

router.get('/:pacienteId', obtenerExpediente)
router.put('/:pacienteId', guardarExpediente)

module.exports = router