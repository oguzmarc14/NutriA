const tablas = require('./imcEdadOmsLms.json')

// LMS de las tablas ampliadas OMS 2006 (diarias) y OMS 2007 (mensuales).
// https://www.who.int/toolkits/child-growth-standards/standards/body-mass-index-for-age-bmi-for-age
// https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age
const MILISEGUNDOS_DIA = 86400000

function diaUtc(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  return Number.isFinite(+fecha) ? Math.floor(+fecha / MILISEGUNDOS_DIA) : null
}

function puntajeLms(imc, [l, m, s]) {
  const z = l === 0 ? Math.log(imc / m) / s : Math.expm1(l * Math.log(imc / m)) / (l * s)
  if (Math.abs(z) <= 3) return z

  // La OMS extrapola linealmente a partir de las curvas de 2 y 3 DE.
  const signo = Math.sign(z)
  const valor = de => m * (l === 0 ? Math.exp(s * de) : Math.pow(1 + l * s * de, 1 / l))
  const limite = valor(signo * 3)
  return signo * 3 + (imc - limite) / Math.abs(limite - valor(signo * 2))
}

function percentilNormal(z) {
  // Aproximación de la CDF de la normal estándar.
  const x = Math.abs(z)
  const t = 1 / (1 + 0.2316419 * x)
  const cola = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) *
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return 100 * (z < 0 ? cola : 1 - cola)
}

function evaluarImcParaEdad({ peso, estatura, edad, fecha }, { birthDate, sex }) {
  const inicio = diaUtc(birthDate)
  const fin = diaUtc(fecha)
  if (inicio === null || fin === null) {
    return Number.isInteger(edad) && edad >= 18 ? null : { estado: 'faltan-fechas' }
  }
  if (fin < inicio) return { estado: 'fechas-invalidas' }

  const nacimiento = new Date(inicio * MILISEGUNDOS_DIA)
  const medicion = new Date(fin * MILISEGUNDOS_DIA)
  let meses = (medicion.getUTCFullYear() - nacimiento.getUTCFullYear()) * 12 +
    medicion.getUTCMonth() - nacimiento.getUTCMonth()
  if (medicion.getUTCDate() < nacimiento.getUTCDate()) meses--
  if (meses >= 216) return null
  if (meses < 24) return { estado: 'requiere-peso-longitud' }
  if (sex !== 'female' && sex !== 'male') return { estado: 'falta-sexo' }

  const dias = fin - inicio
  const mesesOms = dias / 30.4375
  const referenciaMensual = mesesOms >= 61
  const tabla = tablas[sex][referenciaMensual ? 'meses' : 'dias']
  const indice = referenciaMensual ? Math.floor(mesesOms) : dias
  const lms = tabla.lms[indice - tabla.inicio]
  const imc = peso / (estatura * estatura)
  if (!lms || !Number.isFinite(imc) || imc <= 0 || !Number.isFinite(estatura) || estatura <= 0) {
    return { estado: 'medicion-invalida' }
  }
  const siguiente = referenciaMensual ? tabla.lms[indice + 1 - tabla.inicio] : null
  const fraccion = mesesOms - indice
  const coeficientes = siguiente ? lms.map((valor, i) => valor + fraccion * (siguiente[i] - valor)) : lms
  const z = puntajeLms(imc, coeficientes)
  if (!Number.isFinite(z) || Math.abs(z) > 5) return { estado: 'revisar-medicion' }
  const p = percentilNormal(z)
  const percentil = p < 0.1 ? '<0.1' : p > 99.9 ? '>99.9' : String(Number(p.toFixed(1)))
  return { estado: 'disponible', z: Number(z.toFixed(2)) + 0, percentil, referencia: referenciaMensual ? 'OMS 2007' : 'OMS 2006' }
}

module.exports = { evaluarImcParaEdad }
