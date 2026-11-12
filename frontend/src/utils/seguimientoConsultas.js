// Recordatorios organizativos derivados de consultas realmente completadas.
// No afirman que un plan tenga fecha de caducidad ni que exista un diagnóstico.
export const SEGUIMIENTO_INICIAL = Object.freeze({activo:true,cicloDias:30,anticipacionDias:5})

export function fechaEnZona(value, zonaHoraria = 'America/Mexico_City') {
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return null
  try {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-US',{
      timeZone:zonaHoraria,year:'numeric',month:'2-digit',day:'2-digit',
    }).formatToParts(d).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,p.value]))
    return values.year+'-'+values.month+'-'+values.day
  } catch { return null }
}

export function sumarDiasFecha(fecha, dias) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || !Number.isInteger(dias)) return null
  const d = new Date(fecha+'T12:00:00Z')
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==fecha) return null
  d.setUTCDate(d.getUTCDate()+dias)
  return d.toISOString().slice(0,10)
}

export function diasEntreFechas(desde, hasta) {
  const a = new Date(desde+'T12:00:00Z')
  const b = new Date(hasta+'T12:00:00Z')
  return Number.isFinite(+a) && Number.isFinite(+b)
    ? Math.round((b-a)/86400000) : null
}

export function avisoProximoSeguimiento(paciente, config, hoy, zonaHoraria) {
  if (!paciente || !config?.activo || !/^\d{4}-\d{2}-\d{2}$/.test(hoy || '')) return null
  const ciclo = Number(config.cicloDias)
  const anticipacion = Number(config.anticipacionDias)
  if (!Number.isInteger(ciclo) || ciclo<7 || ciclo>90 ||
      !Number.isInteger(anticipacion) || anticipacion<0 ||
      anticipacion>30 || anticipacion>ciclo) return null

  // Ya existe una próxima cita; no volver a sugerir programar otra.
  if (paciente.proximaConsulta?.inicio) return null
  const fechaUltima = fechaEnZona(paciente.ultimaConsulta?.inicio, zonaHoraria)
  if (!fechaUltima || fechaUltima > hoy) return null
  const proximo = sumarDiasFecha(fechaUltima,ciclo)
  if (!proximo) return null
  const restantes = diasEntreFechas(hoy,proximo)
  // Hasta 7 días después para evitar avisos eternos de consultas muy antiguas.
  if (restantes === null || restantes > anticipacion || restantes < -7) return null
  const nombre = paciente.name || 'Este paciente'
  return {
    id:'seguimiento-cita',
    titulo: restantes>0 ? 'Seguimiento próximo' : 'Seguimiento por revisar',
    detalle: restantes>1
      ? 'A '+nombre+' le faltan '+restantes+' días para su seguimiento sugerido.'
      : restantes===1
        ? 'A '+nombre+' le falta 1 día para su seguimiento sugerido.'
        : restantes===0
          ? 'Hoy corresponde revisar el seguimiento sugerido de '+nombre+'.'
          : 'El seguimiento sugerido de '+nombre+' fue hace '+Math.abs(restantes)+' días.',
    categoria:'Seguimiento',
    accion:'cita',
    fecha:proximo,
    diasRestantes:restantes,
  }
}
