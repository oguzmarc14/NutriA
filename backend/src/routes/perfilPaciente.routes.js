const express = require('express')

const { obtenerMiPerfil, obtenerMisCitas, confirmarMiCita } = require('../controllers/perfilPaciente.controller')
const { cancelarMiCita } = require('../controllers/cancelarCitaPaciente.controller')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('patient'))

router.get('/', obtenerMiPerfil)
router.get('/citas', obtenerMisCitas)
router.patch('/planes/:id/aceptar', require('../controllers/aceptarPlanPaciente.controller').aceptarMiPlan)
router.patch('/citas/:id/confirmar', confirmarMiCita)
router.patch('/citas/:id/cancelar', cancelarMiCita)

module.exports = router
