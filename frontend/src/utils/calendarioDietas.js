export const inicioDieta = plan => (plan.fechaInicio || plan.createdAt || '').slice(0, 10)
const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
})

export function fechaDietaLegible(fecha) {
  return fecha ? formatoFecha.format(new Date(fecha + 'T12:00:00Z')) : 'Sin fecha'
}

export function ordenarDietas(planes) {
  return [...planes].filter(inicioDieta).sort((a, b) =>
    inicioDieta(b).localeCompare(inicioDieta(a)) ||
    (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0) ||
    String(b._id).localeCompare(String(a._id)),
  )
}

export function dietaParaFecha(ordenadas, fecha) {
  return ordenadas.find(plan => inicioDieta(plan) <= fecha)
}

export function proximasDietas(ordenadas, hoy) {
  const vistas = new Set()
  const futuras = ordenadas.filter(plan => {
    const fecha = inicioDieta(plan)
    if (fecha <= hoy || vistas.has(fecha)) return false
    vistas.add(fecha)
    return true
  })
  return futuras.reverse()
}
