const express = require('express')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const {
  obtenerMiResumen,
  actualizarMiPreferencia,
  obtenerConfiguracionPaciente,
  actualizarConfiguracionPaciente,
} = require('../controllers/gamificacion.controller')

const router = express.Router()
router.use(requireAuth)

// Nadie puede activar la participación del paciente en su nombre.
router.get('/mi-resumen', allowRoles('patient'), obtenerMiResumen)
router.patch('/mi-preferencia', allowRoles('patient'), actualizarMiPreferencia)

// El nutriólogo solo puede administrar pacientes de su propia consulta.
router.get('/paciente/:pacienteId', allowRoles('nutritionist'), obtenerConfiguracionPaciente)
router.patch('/paciente/:pacienteId/configuracion', allowRoles('nutritionist'), actualizarConfiguracionPaciente)

module.exports = router
