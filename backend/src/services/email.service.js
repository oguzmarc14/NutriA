const nodemailer = require('nodemailer')

class EmailServiceError extends Error {
  constructor(message, cause) {
    super(message, { cause })
    this.name = 'EmailServiceError'
    this.statusCode = 503
    this.publicMessage = message
  }
}

function obtenerConfiguracionCorreo() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()

  // Google muestra la contraseña de aplicación separada en grupos de cuatro.
  // Aceptamos ambas formas para evitar errores al copiarla al proveedor.
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '')
  const port = Number(process.env.SMTP_PORT?.trim() || 587)

  const missingVariables = [
    ['SMTP_HOST', host],
    ['SMTP_USER', user],
    ['SMTP_PASS', pass],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingVariables.length > 0) {
    throw new EmailServiceError(
      `Falta configurar el correo: ${missingVariables.join(', ')}`,
    )
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new EmailServiceError('SMTP_PORT no es válido')
  }

  return { host, user, pass, port }
}

function createTransporter() {
  const { host, user, pass, port } = obtenerConfiguracionCorreo()

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  })
}

function obtenerMensajeErrorCorreo(error) {
  if (error?.code === 'EAUTH') {
    return 'Gmail rechazó el acceso. Revisa el correo y la contraseña de aplicación.'
  }

  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET'].includes(error?.code)) {
    return 'No fue posible conectarse con Gmail. Verifica SMTP_HOST y SMTP_PORT e inténtalo nuevamente.'
  }

  return 'No fue posible enviar la invitación. Revisa la configuración de Gmail e inténtalo de nuevo.'
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function enviarInvitacionPaciente({
  email,
  name,
  nutritionistName,
  activationToken,
}) {
  const activationUrl = new URL(
    '/activar-cuenta',
    process.env.CLIENT_URL || 'http://localhost:5173',
  )

  activationUrl.searchParams.set('token', activationToken)

  const transporter = createTransporter()
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  const safeName = escapeHtml(name)
  const safeNutritionistName = escapeHtml(nutritionistName)

  try {
    await transporter.sendMail({
      from: `NutriA <${from}>`,
      to: email,
      subject: 'Activa tu cuenta de paciente en NutriA',
      text: [
        `Hola ${name},`,
        '',
        `${nutritionistName} te ha invitado a NutriA.`,
        'Crea tu contraseña usando el siguiente enlace:',
        activationUrl.toString(),
        '',
        'Este enlace vence en 24 horas y solo puede utilizarse una vez.',
      ].join('\n'),
      html: `
      <div style="background:#edf2e7;padding:32px 16px;font-family:Arial,sans-serif;color:#173f34">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;border:1px solid #d5e1db">
          <p style="margin:0 0 8px;color:#718557;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">NutriA</p>
          <h1 style="margin:0 0 16px;font-size:26px">Activa tu cuenta</h1>
          <p style="line-height:1.6">Hola <strong>${safeName}</strong>,</p>
          <p style="line-height:1.6"><strong>${safeNutritionistName}</strong> te ha dado acceso a NutriA para consultar tu seguimiento nutricional.</p>
          <p style="margin:28px 0;text-align:center">
            <a href="${activationUrl.toString()}" style="display:inline-block;background:#246b55;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">Crear mi contraseña</a>
          </p>
          <p style="color:#6c7772;font-size:13px;line-height:1.6">Este enlace vence en 24 horas y solo puede utilizarse una vez. Si no esperabas esta invitación, puedes ignorar este correo.</p>
        </div>
      </div>
    `,
    })
  } catch (error) {
    throw new EmailServiceError(
      obtenerMensajeErrorCorreo(error),
      error,
    )
  }
}

async function verificarConexionCorreo() {
  const transporter = createTransporter()

  try {
    await transporter.verify()
  } catch (error) {
    throw new EmailServiceError(
      obtenerMensajeErrorCorreo(error),
      error,
    )
  }
}

module.exports = {
  enviarInvitacionPaciente,
  verificarConexionCorreo,
}
