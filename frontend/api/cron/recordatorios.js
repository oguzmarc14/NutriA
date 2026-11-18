import { timingSafeEqual } from 'node:crypto'

// Vercel Hobby: una ejecución diaria a las 06:17 UTC (con margen de
// ejecución dentro de la hora). Nunca hacer pública esta ruta sin secreto.
export const config = { maxDuration: 60 }

export function autorizaCron(authorization, secreto) {
  if (!secreto || typeof authorization !== 'string' ||
    !authorization.startsWith('Bearer ')) return false
  const recibido = authorization.slice('Bearer '.length)
  const a = Buffer.from(recibido)
  const b = Buffer.from(secreto)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function endpointRecordatorios(baseUrl) {
  const url = new URL(baseUrl)
  if (url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('La API debe usar HTTPS.')
  }
  const sinFinal = url.pathname.replace(/\/+$/, '')
  url.pathname = sinFinal.endsWith('/api')
    ? sinFinal + '/recordatorios/procesar'
    : sinFinal + '/api/recordatorios/procesar'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Método no permitido.' })
  }

  const secreto = process.env.CRON_SECRET
  if (!secreto) return res.status(503).json({ message: 'El cron todavía no tiene secreto configurado.' })
  if (!autorizaCron(req.headers.authorization, secreto)) {
    return res.status(401).json({ message: 'No autorizado.' })
  }

  const backendUrl = process.env.NUTRIA_BACKEND_URL || process.env.VITE_API_URL
  if (!backendUrl) return res.status(503).json({ message: 'Falta configurar la URL de la API.' })

  try {
    const respuesta = await fetch(endpointRecordatorios(backendUrl), {
      method: 'POST',
      redirect: 'error',
      headers: { 'x-cron-secret': secreto },
      signal: AbortSignal.timeout(50000),
    })
    if (!respuesta.ok) {
      console.error('NutriA API rechazó procesar recordatorios:', respuesta.status)
      return res.status(502).json({ message: 'El backend no pudo procesar recordatorios.' })
    }
    const datos = await respuesta.json()
    return res.status(200).json({
      enviados: datos.enviados || 0,
      fallidos: datos.fallidos || 0,
      omitidos: datos.omitidos || 0,
      evaluados: datos.evaluados || 0,
    })
  } catch (error) {
    console.error('Error de cron NutriA:', error?.message)
    return res.status(502).json({ message: 'No se pudo comunicar con el backend.' })
  }
}
