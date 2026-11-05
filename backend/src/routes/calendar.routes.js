const express = require('express')
const { requireAuth, allowRoles } = require('../middleware/auth.middleware')
const Connection = require('../models/CalendarConnection')
const calendar = require('../services/calendar.service')
const router = express.Router()

router.get('/status', requireAuth, allowRoles('nutritionist'), async (req,res,next) => {
  try { res.json({ connected: Boolean(await Connection.exists({ nutritionist: req.user._id })) }) }
  catch(e) { next(e) }
})
router.get('/connect', requireAuth, allowRoles('nutritionist'), (req,res,next) => {
  try { res.json({ url: calendar.authorizationUrl(req.user._id) }) }
  catch(e) { next(e) }
})
router.get('/callback', async (req,res) => {
  const client = process.env.CLIENT_URL || 'http://localhost:5173'
  try {
    if (!req.query.code || !req.query.state) throw new Error('Autorización incompleta')
    await calendar.connect(req.query.code, req.query.state)
    res.redirect(client + '/citas?calendar=connected')
  } catch(e) {
    console.error('Calendar OAuth callback:', e.message)
    res.redirect(client + '/citas?calendar=error')
  }
})
router.delete('/disconnect', requireAuth, allowRoles('nutritionist'), async (req,res,next) => {
  try {
    await Connection.deleteOne({ nutritionist: req.user._id })
    res.json({ connected: false })
  } catch(e) { next(e) }
})
module.exports = router
