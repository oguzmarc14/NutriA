const express = require('express')

const {
  registrarMedicion,
  obtenerHistorialMediciones,
} = require('../controllers/mediciones.controller')

const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('nutritionist'))

router.post('/:pacienteId', registrarMedicion)
router.get('/:pacienteId', obtenerHistorialMediciones)

module.exports = router