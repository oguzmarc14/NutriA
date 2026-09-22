export function valorNumerico(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function formatearNumero(valor, decimales = 1) {
  const numero = valorNumerico(valor)
  if (numero === null) return '—'
  return numero.toFixed(decimales).replace(/\.0$/, '')
}

export function fechaMedicion(medicion) {
  return medicion?.fecha || medicion?.createdAt
}

export function ordenarMediciones(mediciones = []) {
  return [...mediciones].sort(
    (a, b) => new Date(fechaMedicion(b)) - new Date(fechaMedicion(a)),
  )
}

export function calcularVariacion(actual, anterior) {
  const valorActual = valorNumerico(actual)
  const valorAnterior = valorNumerico(anterior)

  if (valorActual === null || valorAnterior === null) return null

  const diferencia = valorActual - valorAnterior
  const porcentaje = valorAnterior === 0 ? null : (diferencia / valorAnterior) * 100

  return { diferencia, porcentaje }
}

export function formatearTiempoRelativo(fecha) {
  if (!fecha) return 'Sin fecha'

  const ahora = new Date()
  const objetivo = new Date(fecha)
  const diferencia = Math.max(0, ahora - objetivo)
  const dias = Math.floor(diferencia / 86400000)

  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} dias`

  const meses = Math.floor(dias / 30)
  if (meses === 1) return 'Hace 1 mes'
  if (meses < 12) return `Hace ${meses} meses`

  const anos = Math.floor(dias / 365)
  return anos === 1 ? 'Hace 1 año' : `Hace ${anos} años`
}

export function formatearSeguimiento(mediciones = []) {
  if (mediciones.length < 2) return 'Inicio del seguimiento'

  const ordenadas = ordenarMediciones(mediciones)
  const inicio = new Date(fechaMedicion(ordenadas.at(-1)))
  const fin = new Date(fechaMedicion(ordenadas[0]))
  const dias = Math.max(0, Math.floor((fin - inicio) / 86400000))

  if (dias < 30) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const anos = Math.floor(dias / 365)
  return `${anos} ${anos === 1 ? 'año' : 'años'}`
}
