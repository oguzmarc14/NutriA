// HU-31 — Solo reconocimientos genéricos. Nunca compartir notas, nombres,
// mediciones, expediente ni información del paciente recibida del servidor.
export const TITULOS_PUBLICOS = Object.freeze({
  'primer-paso': 'Mi primer paso',
  conociendome: 'Conociéndome',
  'mi-voz': 'Mi voz cuenta',
  'a-mi-ritmo': 'A mi ritmo',
  'sigo-aprendiendo': 'Sigo aprendiendo',
  'tres-dias-seguidos': 'Tres momentos seguidos',
  'siete-dias-seguidos': 'Una semana de constancia',
})

export function textoPublicoReconocimiento(logro) {
  if (!logro || !Object.prototype.hasOwnProperty.call(TITULOS_PUBLICOS, logro.id)) {
    return null
  }
  return [
    '🌱 ' + TITULOS_PUBLICOS[logro.id],
    '',
    'Quiero celebrar un momento de mi camino en NutriA. Aprendo a mi ritmo, sin compararme con nadie. 💚',
    '',
    '#MiCaminoNutriA',
  ].join('\n')
}

// Las capacidades se inyectan para probar el flujo sin navegador ni cuentas.
// La función nativa share NO publica por su cuenta: el paciente elige el destino.
// Si cancela la hoja nativa no se copia ni se envía nada.
export async function compartirReconocimiento(logro, { share, writeText } = {}) {
  const mensaje = textoPublicoReconocimiento(logro)
  if (!mensaje) return { estado: 'no-disponible', mensaje: '' }

  if (typeof share === 'function') {
    try {
      await share({ title: 'Mi camino en NutriA', text: mensaje })
      return { estado: 'seleccionado', mensaje }
    } catch (error) {
      if (error?.name === 'AbortError') return { estado: 'cancelado', mensaje: '' }
      // Si falla Web Share, intentar copiar; nunca publicar automáticamente.
    }
  }

  if (typeof writeText === 'function') {
    try {
      await writeText(mensaje)
      return { estado: 'copiado', mensaje }
    } catch {
      // Algunos navegadores/PWA no permiten portapapeles sin permisos.
    }
  }
  return { estado: 'manual', mensaje }
}
