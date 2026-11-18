// Vercel Hobby ejecuta el cron una vez al día; el recordatorio se basa
// en el día calendario local de la cita, no en una ventana de 60 minutos.
// Las citas creadas para el mismo día también se recuerdan si faltan 2h o más.
function fechaLocal(fecha, zonaHoraria) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha)
  const valor = tipo => partes.find(p => p.type === tipo)?.value
  return [valor('year'), valor('month'), valor('day')].join('-')
}

function diaSiguiente(fecha) {
  const d = new Date(fecha + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function debeRecordarse(cita, ahora = new Date()) {
  const inicio = new Date(cita.inicio)
  if (!Number.isFinite(inicio.getTime()) || inicio <= ahora || !cita.zonaHoraria) return false
  try {
    const hoy = fechaLocal(ahora, cita.zonaHoraria)
    const fechaCita = fechaLocal(inicio, cita.zonaHoraria)
    const horasRestantes = (inicio - ahora) / 3600000
    return fechaCita === diaSiguiente(hoy) ||
      (fechaCita === hoy && horasRestantes >= 2)
  } catch {
    return false
  }
}

module.exports = { fechaLocal, diaSiguiente, debeRecordarse }
