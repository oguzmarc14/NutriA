const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const Connection = require('../models/CalendarConnection')
const Cita = require('../models/Cita')

function config() {
  const { GOOGLE_CALENDAR_CLIENT_ID: clientId, GOOGLE_CALENDAR_CLIENT_SECRET: secret, GOOGLE_CALENDAR_REDIRECT_URI: redirect } = process.env
  if (!clientId || !secret || !redirect || !process.env.CALENDAR_ENCRYPTION_KEY) throw new Error('Falta configurar OAuth de Calendar y CALENDAR_ENCRYPTION_KEY')
  const key = Buffer.from(process.env.CALENDAR_ENCRYPTION_KEY, 'hex')
  if (key.length !== 32) throw new Error('CALENDAR_ENCRYPTION_KEY debe contener 64 caracteres hexadecimales')
  return { clientId, secret, redirect, key }
}
function oauth() {
  const { clientId, secret, redirect } = config()
  return new OAuth2Client(clientId, secret, redirect)
}
function encrypt(value) {
  const { key } = config()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), body].map(v => v.toString('base64url')).join('.')
}
function decrypt(value) {
  const { key } = config()
  const [iv, tag, body] = value.split('.').map(v => Buffer.from(v, 'base64url'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')
}
function authorizationUrl(userId) {
  const state = jwt.sign({ sub: String(userId), purpose: 'calendar-connect' }, process.env.JWT_SECRET, { expiresIn: '10m' })
  return oauth().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/calendar.events'], state })
}
async function connect(code, state) {
  const data = jwt.verify(state, process.env.JWT_SECRET)
  if (data.purpose !== 'calendar-connect') throw new Error('Estado OAuth inválido')
  const client = oauth()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) throw new Error('Google no entregó autorización persistente')
  await Connection.findOneAndUpdate({ nutritionist: data.sub }, { refreshTokenEncrypted: encrypt(tokens.refresh_token), connectedAt: new Date() }, { upsert: true })
  return data.sub
}
async function calendarRequest(userId, method, path, body) {
  const conn = await Connection.findOne({ nutritionist: userId }).select('+refreshTokenEncrypted')
  if (!conn) return { connected: false }
  const client = oauth()
  client.setCredentials({ refresh_token: decrypt(conn.refreshTokenEncrypted) })
  const { token } = await client.getAccessToken()
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events' + path, {
    method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) throw new Error('Google Calendar respondió ' + response.status)
  return { connected: true, data: response.status === 204 ? null : await response.json() }
}
async function syncAppointment(cita) {
  const populated = await Cita.findById(cita._id).select('+calendarEventId').populate('patient', 'name')
  if (!populated) return
  const id = populated.calendarEventId
  const canceled = populated.estado === 'cancelada'
  if (canceled && !id) return true
  const body = {
    summary: 'Consulta NutriA',
    description: 'Cita administrada desde NutriA. Revisa los detalles en la aplicación.',
    start: { dateTime: populated.inicio.toISOString(), timeZone: populated.zonaHoraria },
    end: { dateTime: populated.fin.toISOString(), timeZone: populated.zonaHoraria },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
  }
  const path = id ? '/' + encodeURIComponent(id) : ''
  const result = await calendarRequest(populated.nutritionist, canceled ? 'DELETE' : id ? 'PUT' : 'POST', path, canceled ? null : body)
  if (result.connected) {
    if (canceled) populated.calendarEventId = null
    else populated.calendarEventId = result.data.id
    await populated.save()
  }
  return Boolean(result.connected)
}

// Se ejecuta ANTES de borrar la cita local. Si falla Google, el endpoint no
// elimina la cita de MongoDB y se puede reintentar de forma segura.
async function deleteAppointment(cita) {
  if (!cita.calendarEventId) return true
  try {
    const result = await calendarRequest(
      cita.nutritionist,
      'DELETE',
      '/' + encodeURIComponent(cita.calendarEventId),
    )
    return Boolean(result.connected)
  } catch (error) {
    // Si ya se eliminó directamente en Google, el borrado es idempotente.
    if (error.message === 'Google Calendar respondió 404') return true
    throw error
  }
}

module.exports = {
  authorizationUrl,
  connect,
  syncAppointment,
  calendarRequest,
  deleteAppointment,
}
