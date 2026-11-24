const { cobrosSchema, cobrosPublicos } = require('../utils/cobrosAgenda')
const Patient = require('../models/Pacientes')
const Medicion = require('../models/Medicion')
const { clinicSummary } = require('../utils/clinicSummary')
const express = require('express')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))
router.get('/resumen', async (req, res, next) => {
  try {
    const patients = await Patient.find({ nutritionist: req.user._id, active: true }).select('_id createdAt').lean()
    const measurements = await Medicion.aggregate([
      { $match: { nutritionist: req.user._id, paciente: { $in: patients.map(p => p._id) }, peso: { $gt: 0 } } },
      { $sort: { fecha: 1, createdAt: 1, _id: 1 } },
      { $group: { _id: '$paciente', count: { $sum: 1 }, firstWeight: { $first: '$peso' }, lastWeight: { $last: '$peso' } } },
    ])
    return res.json({ resumen: clinicSummary(patients, measurements) })
  } catch (error) { return next(error) }
})
router.get('/cobros', (req, res) => res.json({ cobros: cobrosPublicos(req.user.cobrosAgenda) }))
router.put('/cobros', async (req, res, next) => {
  try {
    const parsed = cobrosSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message })
    if (parsed.data.enlaceMercadoPago && !parsed.data.whatsapp)
      return res.status(400).json({ message: 'Agrega el WhatsApp del consultorio para confirmar el horario antes de cobrar.' })
    req.user.cobrosAgenda = parsed.data
    await req.user.save()
    return res.json({ cobros: cobrosPublicos(req.user.cobrosAgenda) })
  } catch (error) { next(error) }
})
router.get('/',  (req, res) => res.json({ clinica: req.user.clinica || {} }))
router.put('/', async (req, res, next) => {
  try {
    const { nombre, nombreProfesional, logo } = req.body || {}
    if (typeof nombre !== 'string' || nombre.trim().length > 80 ||
        typeof nombreProfesional !== 'string' || nombreProfesional.trim().length > 100 ||
        typeof logo !== 'string' || logo.length > 950000 ||
        (logo && !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(logo))) {
      return res.status(400).json({ message: 'Datos de clínica inválidos. Utiliza un logo PNG, JPG o WebP pequeño.' })
    }
    req.user.clinica = { nombre: nombre.trim(), nombreProfesional: nombreProfesional.trim(), logo }
    await req.user.save()
    return res.json({ clinica: req.user.clinica })
  } catch (error) { return next(error) }
})
module.exports = router
