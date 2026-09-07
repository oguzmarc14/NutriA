const express = require('express')
const {
  obtenerUsuarios,
  actualizarRol,
} = require('../controllers/usuarios.controller')
const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('admin'))

router.get('/', obtenerUsuarios)
router.put('/:id/rol', actualizarRol)

module.exports = router