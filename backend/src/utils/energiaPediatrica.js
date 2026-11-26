const categorias = ['inactiva', 'ligera', 'activa', 'muy-activa']

// DRI for Energy 2023, tabla 5-15. Cada fila contiene intercepto,
// coeficiente de estatura en cm y coeficiente de peso en kg.
const coeficientes = {
  male: [[-447.51, 13.01, 13.15], [19.12, 8.62, 20.28], [-388.19, 12.66, 20.46], [-671.75, 15.38, 23.25]],
  female: [[55.59, 8.43, 17.07], [-297.54, 12.77, 14.73], [-189.55, 11.74, 18.34], [-709.59, 18.22, 14.25]],
}

function edadEnMedicion(edad, nacimiento, fechaMedicion) {
  const dia = valor => valor && Number.isFinite(+new Date(valor))
    ? new Date(new Date(valor).toISOString().slice(0, 10) + 'T00:00:00Z') : null
  const inicio = dia(nacimiento)
  const fin = dia(fechaMedicion)
  if (!inicio || !fin) {
    return Number.isInteger(edad) && edad > 0
      ? { meses: edad * 12, anios: edad, fuente: 'edad registrada' } : null
  }
  if (fin < inicio) return null
  let meses = (fin.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + fin.getUTCMonth() - inicio.getUTCMonth()
  if (fin.getUTCDate() < inicio.getUTCDate()) meses--
  const aniosCumplidos = Math.floor(meses / 12)
  const aniversario = new Date(inicio)
  aniversario.setUTCFullYear(inicio.getUTCFullYear() + aniosCumplidos)
  const siguiente = new Date(inicio)
  siguiente.setUTCFullYear(inicio.getUTCFullYear() + aniosCumplidos + 1)
  const anios = aniosCumplidos + (fin - aniversario) / (siguiente - aniversario)
  return { meses, anios, fuente: 'fechas de nacimiento y medición' }
}

function calcularEnergiaPediatrica({ edad, peso, estaturaCm, sexo, actividad, nacimiento, fechaMedicion }) {
  if (!Object.hasOwn(coeficientes, sexo) || !Number.isFinite(peso) || peso <= 0 ||
      !(estaturaCm >= 30 && estaturaCm <= 300)) return null
  const edadReal = edadEnMedicion(edad, nacimiento, fechaMedicion)
  if (!edadReal || edadReal.meses >= 228) return null

  const { meses, anios, fuente } = edadReal
  let intercepto, edadCoef, talla, masa, deposito, rangoEdad
  if (meses < 36) {
    const masculino = sexo === 'male'
    ;[intercepto, edadCoef, talla, masa] = masculino ? [-716.45, -1, 17.82, 15.06] : [-69.15, 80, 2.65, 54.15]
    deposito = meses < 3 ? (masculino ? 200 : 180)
      : meses < 6 ? (masculino ? 50 : 60)
      : meses < 12 || masculino ? 20 : 15
    rangoEdad = meses < 3 ? '0 a <3 meses' : meses < 6 ? '3 a <6 meses'
      : meses < 12 ? '6 a <12 meses' : '1 a <3 años'
  } else {
    const fila = coeficientes[sexo][categorias.indexOf(actividad)]
    if (!fila) return null
    ;[intercepto, talla, masa] = fila
    edadCoef = sexo === 'male' ? 3.68 : -22.25
    deposito = meses < 48 && sexo === 'male' ? 20
      : meses < 108 ? 15 : meses < 168 ? (sexo === 'male' ? 25 : 30) : 20
    rangoEdad = meses < 48 ? '3 a <4 años' : meses < 108 ? '4 a <9 años'
      : meses < 168 ? '9 a <14 años' : '14 a <19 años'
  }

  const terminoEdad = edadCoef < 0 ? `− ${Math.abs(edadCoef)} × edad` : `+ ${edadCoef} × edad`
  return {
    kcal: intercepto + edadCoef * anios + talla * estaturaCm + masa * peso + deposito,
    detalle: {
      ecuacion: `EER = ${intercepto} ${terminoEdad} + ${talla} × talla + ${masa} × peso + ${deposito}`,
      edadAnios: anios, rangoEdad, fuenteEdad: fuente,
    },
  }
}

function estimarEnergiaPediatrica(datos) {
  return calcularEnergiaPediatrica(datos)?.kcal ?? null
}

module.exports = { estimarEnergiaPediatrica, calcularEnergiaPediatrica, edadEnMedicion }
