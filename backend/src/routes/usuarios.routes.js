const express = require('express')

const {
  actualizarEstadoNutriologo,
  crearNutriologo,
  obtenerNutriologos,
} = require('../controllers/usuarios.controller')

const {
  allowRoles,
  requireAuth,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(allowRoles('admin'))

router.get('/nutriologos', obtenerNutriologos)

router.post('/nutriologos', crearNutriologo)

router.patch(
  '/nutriologos/:id/estado',
  actualizarEstadoNutriologo,
)

module.exports = router