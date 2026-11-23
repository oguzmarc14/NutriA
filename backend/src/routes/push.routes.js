const express = require('express')
const { z } = require('zod')
const Device = require('../models/PushDevice')
const Notice = require('../models/Notification')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const input = z.object({
  token: z.string().max(256).regex(/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/),
  platform: z.enum(['android', 'ios']),
}).strict()
const router = express.Router()
router.use(requireAuth, allowRoles('patient', 'nutritionist', 'admin'))
router.get('/notices',async(req,res,next)=>{try{
  res.set('Cache-Control','no-store')
  const notices=await Notice.find({user:req.user._id||req.user.id,expiresAt:{$gt:new Date()}}).sort({createdAt:-1}).limit(100).select('_id titulo detalle route seenAt createdAt').lean()
  res.json({notices:notices.map(n=>({id:String(n._id),titulo:n.titulo,detalle:n.detalle,route:n.route,seen:!!n.seenAt,createdAt:n.createdAt}))})
}catch(error){next(error)}})
router.post('/notices/seen',async(req,res,next)=>{try{
  const parsed=z.object({ids:z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(100)}).strict().safeParse(req.body)
  if(!parsed.success)return res.status(400).json({message:'Avisos inválidos'})
  await Notice.updateMany({_id:{$in:parsed.data.ids},user:req.user._id||req.user.id,seenAt:null},{$set:{seenAt:new Date()}})
  res.json({seen:true})
}catch(error){next(error)}})
router.get('/status',async(req,res,next)=>{try{res.set('Cache-Control','no-store');res.json({enabled:process.env.PUSH_NOTIFICATIONS_ENABLED==='true',registered:!!await Device.exists({user:req.user._id||req.user.id})})}catch(error){next(error)}})
router.post('/devices', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store')
    const parsed = input.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Dispositivo de notificaciones inválido' })
    if (process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') return res.status(503).json({ message: 'El consultorio aún no ha habilitado las notificaciones remotas.' })
    const { token, platform } = parsed.data
    try {
      await Device.updateOne({ token }, { $set: { user: req.user._id || req.user.id, platform } }, { upsert: true, runValidators: true })
    } catch (error) {
      if (error.code !== 11000) throw error
      await Device.updateOne({ token }, { $set: { user: req.user._id || req.user.id, platform } })
    }
    return res.json({ registered: true })
  } catch (error) { next(error) }
})
router.post('/devices/remove', async (req, res, next) => {
  try {
    const parsed = input.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Dispositivo de notificaciones inválido' })
    await Device.deleteOne({ token: parsed.data.token, user: req.user._id || req.user.id })
    return res.json({ removed: true })
  } catch (error) { next(error) }
})
module.exports = router
