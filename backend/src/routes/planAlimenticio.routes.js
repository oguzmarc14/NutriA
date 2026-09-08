const express = require('express')

const {
  crearPlanAlimenticio,
  obtenerPlanesAlimenticios,
} = require('../controllers/planAlimenticio.controller')

const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('nutritionist'))

router.post('/:pacienteId', crearPlanAlimenticio)
router.get('/:pacienteId', obtenerPlanesAlimenticios)

module.exports = router