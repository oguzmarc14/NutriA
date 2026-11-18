const express = require('express')

const { obtenerMiPerfil, obtenerMisCitas } = require('../controllers/perfilPaciente.controller')
const { cancelarMiCita } = require('../controllers/cancelarCitaPaciente.controller')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('patient'))

router.get('/', obtenerMiPerfil)
router.get('/citas', obtenerMisCitas)
router.patch('/citas/:id/cancelar', cancelarMiCita)

module.exports = router
