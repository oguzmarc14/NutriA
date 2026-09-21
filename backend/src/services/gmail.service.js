const { OAuth2Client } = require('google-auth-library')

class GmailApiError extends Error {
  constructor(message, cause) {
    super(message, { cause })
    this.name = 'GmailApiError'
  }
}

function obtenerConfiguracionGmail() {
  const config = {
    clientId: process.env.GMAIL_CLIENT_ID?.trim(),
    clientSecret: process.env.GMAIL_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GMAIL_REFRESH_TOKEN?.trim(),
    sender: process.env.GMAIL_SENDER?.trim(),
  }
  const nombres = { clientId: 'GMAIL_CLIENT_ID', clientSecret: 'GMAIL_CLIENT_SECRET', refreshToken: 'GMAIL_REFRESH_TOKEN', sender: 'GMAIL_SENDER' }
  const faltantes = Object.entries(config).filter(([, value]) => !value).map(([key]) => nombres[key])

  if (faltantes.length > 0) throw new GmailApiError(`Falta configurar Gmail API: ${faltantes.join(', ')}`)
  return config
}

function codificarBase64Url(value) {
  return Buffer.from(value).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function construirMensaje({ from, to, subject, text, html }) {
  const boundary = `nutria_${Date.now().toString(36)}`
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
  return [
    `From: NutriA <${from}>`, `To: ${to}`, `Subject: ${subjectEncoded}`, 'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`, '', `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', text, '',
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', html, '',
    `--${boundary}--`,
  ].join('\r\n')
}

async function enviarCorreoGmail({ to, subject, text, html }) {
  const { clientId, clientSecret, refreshToken, sender } = obtenerConfiguracionGmail()
  const oauthClient = new OAuth2Client(clientId, clientSecret)
  oauthClient.setCredentials({ refresh_token: refreshToken })

  try {
    const { token } = await oauthClient.getAccessToken()
    if (!token) throw new Error('Google no entregó un token de acceso')
    const raw = codificarBase64Url(construirMensaje({ from: sender, to, subject, text, html }))
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    })
    if (!response.ok) throw new Error(`Gmail API ${response.status}: ${await response.text()}`)
  } catch (error) {
    throw new GmailApiError('Gmail API rechazó el envío. Revisa las credenciales OAuth y el remitente.', error)
  }
}

module.exports = { enviarCorreoGmail }
