const express = require('express')

const {
  crearPlanAlimenticio,
  obtenerPlanesAlimenticios,
  actualizarPlanAlimenticio,
  eliminarPlanAlimenticio,
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
router.put('/:pacienteId/:planId', actualizarPlanAlimenticio)
router.delete('/:pacienteId/:planId', eliminarPlanAlimenticio)

module.exports = router
