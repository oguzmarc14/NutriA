// Convierte horas devueltas por el backend en etiquetas legibles y no vacías.
export function etiquetaHoraCita(espacio, zonaHoraria) {
  if (typeof espacio?.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(espacio.hora)) {
    return espacio.hora
  }
  const fecha = new Date(espacio?.inicio)
  if (!Number.isFinite(fecha.getTime())) return 'Horario no disponible'
  try {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      timeZone: zonaHoraria || undefined,
    }).format(fecha)
  } catch {
    return 'Horario no disponible'
  }
}
