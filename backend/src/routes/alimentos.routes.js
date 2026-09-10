const express = require('express')

const {
  obtenerAlimentoPorId,
  obtenerAlimentos,
  obtenerGrupos,
} = require('../controllers/alimentos.controller')

const {
  requireAuth,
  allowRoles,
} = require('../middleware/auth.middleware')

const router = express.Router()

/*
 * ----------------------------------------------------
 * TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
 * ----------------------------------------------------
 */

router.use(requireAuth)

/*
 * ----------------------------------------------------
 * CATÁLOGO DE ALIMENTOS
 *
 * MVP ACTUAL:
 * únicamente el nutriólogo puede consultar alimentos.
 *
 * La administración del catálogo se agregará
 * posteriormente en otro MVP.
 * ----------------------------------------------------
 */

router.get(
  '/',
  allowRoles('nutritionist'),
  obtenerAlimentos,
)

router.get(
  '/grupos',
  allowRoles('nutritionist'),
  obtenerGrupos,
)

router.get(
  '/:id',
  allowRoles('nutritionist'),
  obtenerAlimentoPorId,
)

module.exports = router