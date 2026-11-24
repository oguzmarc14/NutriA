const { z } = require('zod')

function enlaceDePago(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash) return false
    if (url.hostname === 'mpago.la') return /^\/[a-zA-Z0-9_-]+$/.test(url.pathname) && !url.search
    return url.hostname === 'link.mercadopago.com.mx' && /^\/[a-zA-Z0-9_-]+$/.test(url.pathname) && !url.search
  } catch { return false }
}

const cobrosSchema = z.object({
  whatsapp: z.string().trim().regex(/^(?:[1-9][0-9]{9,14})?$/, 'Escribe el número de WhatsApp con código de país, solo dígitos.'),
  enlaceMercadoPago: z.string().trim().max(500).refine(enlaceDePago, 'Usa un Link de pago HTTPS de Mercado Pago México.'),
}).strict()

function cobrosPublicos(config) {
  const parsed = cobrosSchema.safeParse({
    whatsapp: config?.whatsapp || '',
    enlaceMercadoPago: config?.enlaceMercadoPago || '',
  })
  return parsed.success ? parsed.data : { whatsapp: '', enlaceMercadoPago: '' }
}

module.exports = { cobrosSchema, cobrosPublicos }
