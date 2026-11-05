const express = require('express')
const crypto = require('crypto')
const Cita = require('../models/Cita')
const { enviarCorreoGmail } = require('../services/gmail.service')
const router = express.Router()

router.post('/procesar', async (req,res,next) => {
  try {
    const configured = process.env.CRON_SECRET
    const supplied = req.headers['x-cron-secret']
    if (!configured || typeof supplied !== 'string' || Buffer.byteLength(configured) !== Buffer.byteLength(supplied) ||
      !crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(supplied))) return res.status(401).json({ message: 'No autorizado' })
    const now = new Date()
    const start = new Date(now.getTime() + 23 * 3600000)
    const end = new Date(now.getTime() + 24 * 3600000)
    const candidates = await Cita.find({ estado: { $in: ['programada','confirmada'] }, inicio: { $gte: start, $lte: end }, recordatorio24hEnviado: null }).populate('patient','name email').limit(100)
    let enviados = 0, fallidos = 0
    for (const cita of candidates) {
      if (!cita.patient?.email) continue
      const claimed = await Cita.findOneAndUpdate({ _id: cita._id, recordatorio24hEnviado: null, inicio: cita.inicio, estado: { $in: ['programada','confirmada'] } }, { $set: { recordatorio24hEnviado: now } })
      if (!claimed) continue
      try {
        const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeStyle: 'short', timeZone: cita.zonaHoraria }).format(cita.inicio)
        const texto = 'Hola ' + cita.patient.name + ', te recordamos tu cita de NutriA el ' + fecha + '. Si necesitas cambiarla, comunícate con tu nutriólogo.'
        await enviarCorreoGmail({ to: cita.patient.email, subject: 'Recordatorio de cita NutriA', text: texto, html: '<p>' + texto.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') + '</p>' })
        enviados++
      } catch(e) {
        fallidos++
        console.error('Recordatorio no enviado para cita', String(cita._id), e.message)
        await Cita.updateOne({ _id: cita._id, recordatorio24hEnviado: now }, { $set: { recordatorio24hEnviado: null } })
      }
    }
    res.json({ enviados, fallidos })
  } catch(e) { next(e) }
})
module.exports = router
