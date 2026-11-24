const express = require('express')

const {
  guardarMiSeguimiento,
  obtenerMiProgreso,
  obtenerProgresoPaciente,
} = require('../controllers/seguimientoComida.controller')
const { allowRoles, requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth, (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
router.post('/mi-registro', allowRoles('patient'), guardarMiSeguimiento)
router.get('/mi-progreso', allowRoles('patient'), obtenerMiProgreso)
router.get('/paciente/:pacienteId', allowRoles('nutritionist'), obtenerProgresoPaciente)

module.exports = router
