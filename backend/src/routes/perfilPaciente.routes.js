const express = require('express')

const { obtenerMiPerfil, obtenerMisCitas } = require('../controllers/perfilPaciente.controller')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('patient'))

router.get('/', obtenerMiPerfil)
router.get('/citas', obtenerMisCitas)

module.exports = router
