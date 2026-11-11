const express = require('express')
const { z } = require('zod')
const User = require('../models/User')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const router = express.Router()
const { minutos, franjaDentroHorario } = require('../utils/agenda-publica.utils')
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
const hora = z.string().regex(/^([01]\d|2[0-3]):(?:00|30)$/)
const franja = z.object({
  dia: z.number().int().min(0).max(6),
  inicio: hora,
  fin: hora,
}).strict().refine(f => minutos(f.fin)-minutos(f.inicio)>=60, {
  message: 'Cada bloque debe permitir una consulta de 60 minutos',
})
const horarioCitasSchema = z.object({
  franjas: z.array(franja).min(1).max(21),
  publicado: z.boolean().default(false),
  anticipacionHoras: z.number().int().min(0).max(72).default(2),
}).strict().superRefine((data, ctx) => {
  for(const [i,actual] of data.franjas.entries()){
    if(data.franjas.some((otro,j)=>j!==i && actual.dia===otro.dia &&
      actual.inicio < otro.fin && actual.fin > otro.inicio)){
      ctx.addIssue({ code:'custom', message:'Los bloques de un mismo día no deben superponerse', path:['franjas',i] })
    }
  }
})

router.get('/citas', async (req,res,next) => {
  try {
    const u = await User.findById(req.user._id).select('horarioCitas horarioLaboral').lean()
    if(!u)return res.status(404).json({message:'Nutriólogo no encontrado'})
    res.json({ horarioCitas: u.horarioCitas || {configurado:false,publicado:false,franjas:[],anticipacionHoras:2},
      horarioLaboral: u.horarioLaboral })
  } catch(e){next(e)}
})
router.put('/citas', async (req,res,next) => {
  try {
    const parsed = horarioCitasSchema.safeParse(req.body)
    if(!parsed.success)return res.status(400).json({message:'Revisa los bloques de consulta',issues:parsed.error.issues})
    const u = await User.findById(req.user._id).select('horarioLaboral horarioCitas')
    if(!u)return res.status(404).json({message:'Nutriólogo no encontrado'})
    if(!franjaDentroHorario(parsed.data.franjas,u.horarioLaboral))
      return res.status(400).json({message:'Los bloques de citas deben estar dentro de los días y horas de trabajo configurados.'})
    u.horarioCitas = {...parsed.data,configurado:true}
    await u.save()
    res.json({horarioCitas:u.horarioCitas})
  } catch(e){next(e)}
})

module.exports = router
