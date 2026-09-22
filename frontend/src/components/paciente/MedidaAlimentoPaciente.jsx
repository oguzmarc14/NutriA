const FORMAS_UNIDAD = {
  cucharada: ['cucharada', 'cucharadas'],
  cucharadas: ['cucharada', 'cucharadas'],
  cucharadita: ['cucharadita', 'cucharaditas'],
  cucharaditas: ['cucharadita', 'cucharaditas'],
  lata: ['lata', 'latas'],
  latas: ['lata', 'latas'],
  pieza: ['pieza', 'piezas'],
  piezas: ['pieza', 'piezas'],
  porcion: ['porcion', 'porciones'],
  porciones: ['porcion', 'porciones'],
  'porción': ['porción', 'porciones'],
  rebanada: ['rebanada', 'rebanadas'],
  rebanadas: ['rebanada', 'rebanadas'],
  taza: ['taza', 'tazas'],
  tazas: ['taza', 'tazas'],
}

const FRACCIONES = [
  [0.25, '1/4'],
  [1 / 3, '1/3'],
  [0.5, '1/2'],
  [2 / 3, '2/3'],
  [0.75, '3/4'],
]

function formatearCantidad(valor) {
  const entero = Math.floor(valor)
  const decimal = valor - entero

  if (Math.abs(decimal) < 0.02) {
    return String(entero)
  }

  const fraccion = FRACCIONES.find(
    ([numero]) => Math.abs(decimal - numero) < 0.02,
  )

  if (fraccion) {
    return entero > 0
      ? `${entero} ${fraccion[1]}`
      : fraccion[1]
  }

  return valor.toLocaleString('es-MX', {
    maximumFractionDigits: 2,
  })
}

function formatearUnidad(unidad, cantidad) {
  const unidadLimpia = unidad?.trim() || 'porción'
  const formas = FORMAS_UNIDAD[unidadLimpia.toLowerCase()]

  if (!formas) return unidadLimpia

  return Math.abs(cantidad - 1) < 0.02
    ? formas[0]
    : formas[1]
}

function obtenerMedidaAlimento(alimento) {
  const equivalentes = Number(alimento.cantidad) || 1
  const porcion = alimento.porcion || {}
  const gramosPorPorcion = Number(porcion.gramos)
  const gramosTotales = gramosPorPorcion > 0
    ? gramosPorPorcion * equivalentes
    : null
  const cantidadBase = Number(porcion.cantidad)
  const cantidadPractica = Number.isFinite(cantidadBase)
    ? cantidadBase * equivalentes
    : equivalentes
  const unidad = porcion.unidad?.trim() || 'porción'
  const esPorcionGenerica = ['porcion', 'porción', 'porciones']
    .includes(unidad.toLowerCase())

  let medidaPractica = ''

  if (!esPorcionGenerica) {
    medidaPractica = `${formatearCantidad(cantidadPractica)} ${formatearUnidad(unidad, cantidadPractica)}`
  } else if (!gramosTotales) {
    medidaPractica = `${formatearCantidad(equivalentes)} ${formatearUnidad('porción', equivalentes)}`
  }

  const medidaGramos = gramosTotales
    ? `${formatearCantidad(gramosTotales)} g`
    : ''

  return [medidaPractica, medidaGramos]
    .filter(Boolean)
    .join(' · ')
}

function MedidaAlimentoPaciente({ alimento }) {
  return (
    <p className="break-words text-xs font-bold text-[#8a6840] sm:shrink-0 sm:text-right">
      {obtenerMedidaAlimento(alimento)}
    </p>
  )
}

export default MedidaAlimentoPaciente
