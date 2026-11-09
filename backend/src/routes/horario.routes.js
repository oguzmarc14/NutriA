const express = require('express')
const { z } = require('zod')
const User = require('../models/User')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const router = express.Router()
router.use(requireAuth, allowRoles('nutritionist'))
const schema = z.object({
  dias: z.array(z.number().int().min(0).max(6)).min(1).max(7).refine(d => new Set(d).size === d.length),
  inicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  fin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  zonaHoraria: z.string().min(3).max(80),
}).strict().refine(d => d.fin > d.inicio, { message: 'La hora final debe ser posterior al inicio', path: ['fin'] })
router.get('/', async (req,res,next) => {
  try {
    const u = await User.findById(req.user._id).select('horarioLaboral')
    res.json({ horario: u.horarioLaboral })
  } catch(e) { next(e) }
})
router.put('/', async (req,res,next) => {
  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Revisa los días y horas de trabajo', issues: parsed.error.issues })
    try { new Intl.DateTimeFormat('es-MX',{timeZone:parsed.data.zonaHoraria}) }
    catch { return res.status(400).json({message:'Zona horaria inválida'}) }
    const u = await User.findByIdAndUpdate(req.user._id, { $set: { horarioLaboral: {...parsed.data, configurado:true} } }, { new:true, runValidators:true }).select('horarioLaboral')
    res.json({horario:u.horarioLaboral})
  } catch(e) { next(e) }
})
module.exports = router
