const express = require('express')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))
router.get('/', (req, res) => res.json({ clinica: req.user.clinica || {} }))
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
