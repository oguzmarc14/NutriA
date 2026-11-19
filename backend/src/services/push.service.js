const Device = require('../models/PushDevice')
const User = require('../models/User')

async function enviarDispositivo(device) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN && { Authorization: 'Bearer ' + process.env.EXPO_ACCESS_TOKEN }),
        },
        body: JSON.stringify({
          to: device.token,
          title: 'NutriA',
          body: 'Hay una actualización de tus citas. Abre Mis citas para ver los detalles.',
          sound: 'default', channelId: 'appointments',
          data: { kind: 'nutria-appointment', route: '/mis-citas' },
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (response.status === 429 || response.status >= 500) throw new Error('Servicio push temporalmente no disponible')
      if (!response.ok) throw Object.assign(new Error('Configuración push rechazada'), { permanent: true })
      const ticket = (await response.json()).data
      if (ticket?.details?.error === 'DeviceNotRegistered') {
        await Device.deleteOne({ _id: device._id, token: device.token, user: device.user })
        return
      }
      if (ticket?.status !== 'ok') throw Object.assign(new Error('Expo rechazó el aviso'), { permanent: true })
      return
    } catch (error) {
      if (error.permanent || attempt === 2) throw error
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
}

async function notificarCita(cita) {
  if (process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') return
  try {
    const patient = cita.patient?._id || cita.patient
    const users = await User.find({ patient, role: 'patient', active: true }).select('_id').lean()
    const devices = await Device.find({ user: { $in: users.map(user => user._id) } }).limit(50).lean()
    for (const device of devices) {
      try { await enviarDispositivo(device) }
      catch { console.error('No se pudo enviar aviso push de cita', String(cita._id)) }
    }
  } catch { console.error('No se pudieron consultar dispositivos push', String(cita._id)) }
}
module.exports = { notificarCita }
