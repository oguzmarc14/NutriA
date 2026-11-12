// Fechas calendario sin depender de la zona horaria del teléfono.
// Las horas de cada consulta siguen siendo calculadas por el backend en la zona del consultorio.
export const VISTAS_CITAS = ['dia', 'semana', 'mes']
const fechaUTC = iso => new Date(iso + 'T12:00:00Z')
const isoUTC = fecha => fecha.toISOString().slice(0, 10)

export function sumarDiasAgenda(fecha, cantidad) {
  const d = fechaUTC(fecha)
  d.setUTCDate(d.getUTCDate() + cantidad)
  return isoUTC(d)
}

export function inicioSemanaAgenda(fecha) {
  const dia = fechaUTC(fecha).getUTCDay()
  return sumarDiasAgenda(fecha, -(dia === 0 ? 6 : dia - 1))
}

export function inicioMesAgenda(fecha) {
  return fecha.slice(0, 7) + '-01'
}

export function rangoVistaAgenda(vista, foco) {
  if (vista === 'semana') return { desde: inicioSemanaAgenda(foco), dias: 7 }
  if (vista === 'mes') return { desde: inicioSemanaAgenda(inicioMesAgenda(foco)), dias: 42 }
  return { desde: foco, dias: 1 }
}

export function moverFocoAgenda(vista, foco, pasos) {
  if (vista === 'dia') return sumarDiasAgenda(foco, pasos)
  if (vista === 'semana') return sumarDiasAgenda(foco, 7 * pasos)
  const d = fechaUTC(foco)
  const diaOriginal = d.getUTCDate()
  // Cambiar al día uno antes de cambiar de mes evita saltar de enero 31 a marzo.
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + pasos)
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(diaOriginal, ultimoDia))
  return isoUTC(d)
}

export function fechaActualDispositivo() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')].join('-')
}

export function ultimoDiaVistaAgenda(vista, foco) {
  const r = rangoVistaAgenda(vista, foco)
  return sumarDiasAgenda(r.desde, r.dias - 1)
}

export function periodoNavegable(vista, foco, hoy, maxDias = 180) {
  if (!hoy) return true
  return ultimoDiaVistaAgenda(vista, foco) >= hoy &&
    rangoVistaAgenda(vista, foco).desde <= sumarDiasAgenda(hoy, maxDias)
}

export function fechasDelRangoAgenda(rango) {
  return Array.from({ length: rango.dias }, (_, i) => sumarDiasAgenda(rango.desde, i))
}

export function formatearPeriodoAgenda(vista, foco) {
  const dt = fechaUTC(foco)
  if (vista === 'mes') {
    return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt)
  }
  if (vista === 'semana') {
    const inicio = inicioSemanaAgenda(foco)
    const fin = sumarDiasAgenda(inicio, 6)
    const formato = iso => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(fechaUTC(iso))
    return formato(inicio) + ' – ' + formato(fin)
  }
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt)
}
