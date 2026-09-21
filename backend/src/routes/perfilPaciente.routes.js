const express = require('express')

const { obtenerMiPerfil } = require('../controllers/perfilPaciente.controller')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('patient'))

router.get('/', obtenerMiPerfil)

module.exports = router
