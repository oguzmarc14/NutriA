// Keep native diagnostic details out of patient-facing copy.
export function googleLoginError(cause: unknown): string {
  const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : ''
  const message = cause instanceof Error ? cause.message : ''
  if (code === '10' || /DEVELOPER_ERROR|code: ?10|developer console is not set up/i.test(message)) {
    return 'Google no reconoce la configuración Android de esta versión de NutriA. Es necesario registrar el paquete y la firma de la aplicación en Google Cloud. Tu cuenta no es el problema.'
  }
  if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
    return 'Este dispositivo no tiene Servicios de Google Play disponibles. El acceso de pacientes con correo sigue disponible; para personal, usa NutriA desde el navegador.'
  }
  if (code === 'IN_PROGRESS') return 'Ya hay un inicio de sesión con Google en curso.'
  if (code === 'NETWORK_ERROR' || code === '7') return 'No se pudo conectar con Google. Revisa tu conexión e intenta de nuevo.'
  return message || 'No se pudo iniciar sesión con Google. Intenta de nuevo.'
}
