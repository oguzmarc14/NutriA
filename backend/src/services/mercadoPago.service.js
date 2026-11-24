const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const { Seller } = require('../models/AgendaCheckout')

function configured() {
  const { MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI, MP_WEBHOOK_SECRET, MP_ENCRYPTION_KEY, MP_WEBHOOK_URL } = process.env
  return Boolean(MP_CLIENT_ID && MP_CLIENT_SECRET && MP_WEBHOOK_SECRET &&
    /^https:\/\//.test(MP_REDIRECT_URI || '') && /^https:\/\//.test(MP_WEBHOOK_URL || '') &&
    /^[a-f0-9]{64}$/i.test(MP_ENCRYPTION_KEY || ''))
}

function key() {
  if (!configured()) throw Object.assign(new Error('Mercado Pago aún no está configurado en NutriA.'), { status: 503 })
  return Buffer.from(process.env.MP_ENCRYPTION_KEY, 'hex')
}

function seal(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map(item => item.toString('base64url')).join('.')
}

function unseal(value) {
  const [iv, tag, data] = value.split('.').map(item => Buffer.from(item, 'base64url'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString())
}

async function provider(path, { access, body, idempotency } = {}) {
  const response = await fetch('https://api.mercadopago.com' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      ...(body && { 'Content-Type': 'application/json' }),
      ...(access && { Authorization: 'Bearer ' + access }),
      ...(idempotency && { 'X-Idempotency-Key': idempotency }),
    },
    ...(body && { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw Object.assign(new Error('Mercado Pago no pudo completar la solicitud.'), { providerStatus: response.status })
  return response.json()
}

function authorize(nutritionist) {
  key()
  const verifier = crypto.randomBytes(32).toString('base64url')
  const state = jwt.sign({ sub: String(nutritionist), purpose: 'mp-connect', challengeKey: seal(verifier) }, process.env.JWT_SECRET, { expiresIn: '10m' })
  const params = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID, response_type: 'code', platform_id: 'mp',
    redirect_uri: process.env.MP_REDIRECT_URI, state,
    code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  })
  return 'https://auth.mercadopago.com.mx/authorization?' + params
}

async function exchange(fields) {
  const tokens = await provider('/oauth/token', { body: {
    client_id: process.env.MP_CLIENT_ID, client_secret: process.env.MP_CLIENT_SECRET, ...fields,
  } })
  if (!tokens.access_token || !tokens.refresh_token || !tokens.public_key ||
      !tokens.user_id || !Number.isFinite(tokens.expires_in)) throw new Error('Autorización incompleta.')
  return {
    merchant: String(tokens.user_id), publicKey: tokens.public_key,
    credentials: seal({ access: tokens.access_token, refresh: tokens.refresh_token }),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  }
}

async function connect(code, state, canConnect) {
  key()
  const claims = jwt.verify(state, process.env.JWT_SECRET)
  if (claims.purpose !== 'mp-connect' || !await canConnect(claims.sub)) throw new Error('Autorización inválida.')
  const tokens = await exchange({ grant_type: 'authorization_code', code,
    code_verifier: unseal(claims.challengeKey), redirect_uri: process.env.MP_REDIRECT_URI })
  const previous = await Seller.findOne({ nutritionist: claims.sub }).lean()
  if (previous && previous.merchant !== tokens.merchant) throw new Error('El consultorio ya tiene otra cuenta vinculada.')
  await Seller.findOneAndUpdate({ nutritionist: claims.sub }, tokens, { upsert: true })
}

const refreshing = new Map()
async function accessFor(merchant) {
  const seller = await Seller.findOne({ merchant }).select('+credentials').lean()
  if (!seller) throw new Error('Cuenta de Mercado Pago no disponible.')
  const value = unseal(seller.credentials)
  if (+seller.expiresAt > Date.now() + 60000) return value.access
  if (!refreshing.has(merchant)) {
    const refresh = (async () => {
      const updated = await exchange({ grant_type: 'refresh_token', refresh_token: value.refresh })
      if (updated.merchant !== merchant) throw new Error('Cuenta de cobro inválida.')
      await Seller.updateOne({ _id: seller._id, credentials: seller.credentials }, { $set: updated })
      return unseal(updated.credentials).access
    })().finally(() => refreshing.delete(merchant))
    refreshing.set(merchant, refresh)
  }
  return refreshing.get(merchant)
}

function validWebhook({ id, requestId, signature }) {
  if (!configured() || !/^[a-z0-9_-]{1,100}$/i.test(id) || !requestId || !signature) return false
  const parts = Object.fromEntries(signature.split(',').map(item => item.trim().split('=')))
  if (!/^\d{10,13}$/.test(parts.ts || '') || !/^[a-f0-9]{64}$/i.test(parts.v1 || '')) return false
  const timestamp = Number(parts.ts) * (parts.ts.length === 10 ? 1000 : 1)
  if (Math.abs(Date.now() - timestamp) > 10 * 60000) return false
  const expected = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(`id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest()
  return crypto.timingSafeEqual(expected, Buffer.from(parts.v1, 'hex'))
}

module.exports = { configured, authorize, connect, accessFor, provider, validWebhook }
