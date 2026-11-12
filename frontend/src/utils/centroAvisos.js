import { obtenerAvisosPaciente } from './avisosPacientes'

// Prepara avisos sin inferir diagnósticos, faltas del paciente ni supuestos de adhesión.
// El recuento corresponde a asuntos por revisar, no a notificaciones sin leer.
export function reunirAvisos(pacientes = [], citas = [], ahora = new Date(),
  configSeguimiento = null, hoy = null, zonaHoraria = null) {
  const inicio = ahora.getTime()
  const fin = inicio + 7 * 24 * 60 * 60 * 1000
  const porPaciente = Array.isArray(pacientes) ? pacientes : []
  const pacientesPorId = new Map(porPaciente.map((p) => [String(p._id), p]))

  const asuntos = porPaciente.flatMap((paciente) =>
    obtenerAvisosPaciente(paciente,configSeguimiento,hoy,zonaHoraria).map((aviso) => ({
      id: `paciente:${paciente._id}:${aviso.id}`,
      tipo: 'seguimiento',
      filtro: aviso.categoria === 'Datos generales' || aviso.categoria === 'Cuenta' ? 'datos' : 'expediente',
      pacienteId: String(paciente._id),
      pacienteNombre: paciente.name || 'Paciente',
      titulo: aviso.titulo,
      detalle: aviso.detalle,
      categoria: aviso.categoria,
      accion: 'ver-avisos',
      fecha: null,
    })),
  )

  const agenda = (Array.isArray(citas) ? citas : []).flatMap((cita) => {
    if (!['programada', 'confirmada'].includes(cita?.estado)) return []
    const fechaMs = new Date(cita.inicio).getTime()
    if (!Number.isFinite(fechaMs) || fechaMs < inicio || fechaMs > fin) return []
    const pacienteId = String(cita.patient?._id || cita.patient || '')
    if (!pacientesPorId.has(pacienteId)) return []

    const paciente = pacientesPorId.get(pacienteId)
    return [{
      id: `cita:${cita._id}`,
      tipo: 'cita',
      filtro: 'citas',
      pacienteId,
      pacienteNombre: paciente.name || 'Paciente',
      titulo: cita.estado === 'confirmada' ? 'Consulta confirmada' : 'Consulta programada',
      detalle: 'Consulta próxima en la agenda.',
      categoria: 'Agenda',
      accion: 'ver-cita',
      fecha: cita.inicio,
      zonaHoraria: cita.zonaHoraria,
    }]
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  return [...agenda, ...asuntos]
}

export function fechaCitaLegible(fecha, zonaHoraria) {
  const fechaValida = new Date(fecha)
  if (!Number.isFinite(fechaValida.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: zonaHoraria || undefined,
    }).format(fechaValida)
  } catch {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(fechaValida)
  }
}
