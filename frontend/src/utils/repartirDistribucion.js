// Trabajamos en centésimas para conservar 100% incluso con redondeo.
export function repartirDistribucion(valores, indiceFijo = -1, porcentajeFijo = 0) {
  if (valores.length < 2) return valores.map(() => 100)
  const fijo = Math.round(Math.min(100, Math.max(0, porcentajeFijo)) * 100)
  const indices = valores.map((_, indice) => indice).filter(indice => indice !== indiceFijo)
  const pesos = indices.map(indice => Math.max(0, Number(valores[indice]) || 0))
  const total = pesos.reduce((suma, peso) => suma + peso, 0)
  const restante = 10000 - fijo
  const unidades = pesos.map(peso => restante * (total ? peso / total : 1 / pesos.length))
  const enteros = unidades.map(Math.floor)
  const faltantes = restante - enteros.reduce((suma, valor) => suma + valor, 0)
  const orden = enteros.map((valor, i) => i).sort((a, b) =>
    (unidades[b] - enteros[b]) - (unidades[a] - enteros[a]),
  )
  for (const i of orden.slice(0, faltantes)) enteros[i] += 1

  const reparto = valores.map(() => 0)
  for (const [i, indice] of indices.entries()) reparto[indice] = enteros[i] / 100
  if (indiceFijo >= 0) reparto[indiceFijo] = fijo / 100
  return reparto
}
