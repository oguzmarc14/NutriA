// Reglas de dominio puras y comprobables sin acceder a datos de pacientes.
function fechaProgramable(nuevoInicio, inicioOriginal = null, ahora = new Date()) {
  const nuevo = new Date(nuevoInicio).getTime()
  if (!Number.isFinite(nuevo)) return false
  const original = inicioOriginal == null ? NaN : new Date(inicioOriginal).getTime()
  return nuevo > new Date(ahora).getTime() || nuevo === original
}

function requiereReiniciarRecordatorios(cita, cambios) {
  return new Date(cita.inicio).getTime() !== new Date(cambios.inicio).getTime() ||
    cita.estado !== cambios.estado
}

function estadoPermitidoEnFecha(estado, inicio, ahora = new Date()) {
  const t = new Date(inicio).getTime()
  if (!Number.isFinite(t)) return false
  if (estado === 'completada') return t <= new Date(ahora).getTime()
  if (estado === 'programada' || estado === 'confirmada') return t > new Date(ahora).getTime()
  return estado === 'cancelada'
}

function solapamiento(aInicio, aFin, bInicio, bFin) {
  return new Date(aInicio) < new Date(bFin) && new Date(aFin) > new Date(bInicio)
}

module.exports = {
  fechaProgramable,
  requiereReiniciarRecordatorios,
  estadoPermitidoEnFecha,
  solapamiento,
}
