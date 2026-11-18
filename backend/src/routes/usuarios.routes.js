const express = require('express')

const {
  obtenerUsuarios,
  crearUsuario,
  actualizarEstadoUsuario,
  actualizarRolUsuario,
} = require('../controllers/usuarios.controller')

const {
  allowRoles,
  requireAuth,
} = require('../middleware/auth.middleware')

const router = express.Router()

/*
 * Todas las rutas de gestión de usuarios
 * requieren sesión iniciada.
 */
router.use(requireAuth)

/*
 * Solo los administradores pueden:
 *
 * - consultar usuarios
 * - autorizar administradores
 * - autorizar nutriólogos
 * - activar/desactivar accesos
 */
router.use(allowRoles('admin'))

/*
 * GET /api/usuarios
 *
 * Devuelve:
 * {
 *   administradores: [],
 *   nutriologos: []
 * }
 */
router.get('/', obtenerUsuarios)

/*
 * POST /api/usuarios
 *
 * Body:
 * {
 *   name: "Ana López",
 *   email: "ana@gmail.com",
 *   role: "admin"
 * }
 *
 * o:
 *
 * {
 *   name: "Ricardo",
 *   email: "ricardo@gmail.com",
 *   role: "nutritionist"
 * }
 */
router.post('/', crearUsuario)

/*
 * PATCH /api/usuarios/:id/estado
 *
 * Body:
 * {
 *   active: false
 * }
 */
router.patch(
  '/:id/estado',
  actualizarEstadoUsuario,
)

router.patch('/:id/rol', actualizarRolUsuario)

module.exports = router