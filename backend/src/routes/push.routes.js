const express = require('express')
const { z } = require('zod')
const Device = require('../models/PushDevice')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')

const input = z.object({
  token: z.string().max(256).regex(/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/),
  platform: z.enum(['android', 'ios']),
}).strict()
const router = express.Router()
router.use(requireAuth, allowRoles('patient'))
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
