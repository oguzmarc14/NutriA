const UN_DIA = 24 * 60 * 60 * 1000

// Fechas de seguimiento sin horas; no se evalúan calorías, peso ni el estado de la comida.
function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const valor = new Date(Date.UTC(anio, mes - 1, dia))
  return valor.toISOString().slice(0, 10) === fecha ? valor : null
}

// HU-30: continuidad VOLUNTARIA de registros. No equivale a dieta completada,
// ni supone puntuaciones por calorías, peso o comidas omitidas.
function calcularRachas(dias = [], hoy = new Date()) {
  const ahora = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const validos = [...new Set(dias)]
    .map(fechaValida)
    .filter(d => d && d.getTime() <= ahora)
    .sort((a,b) => a-b)
  let mejor = 0
  let consecutivos = 0
  for (let i=0;i<validos.length;i++) {
    consecutivos = i && validos[i]-validos[i-1] === UN_DIA ? consecutivos+1 : 1
    mejor = Math.max(mejor,consecutivos)
  }
  const ultimo = validos.at(-1)
  const diferencia = ultimo ? (ahora - ultimo.getTime()) / UN_DIA : Infinity
  // La racha continúa desde el último día registrado si fue ayer u hoy.
  // Un día sin registro no borra la mejor racha histórica.
  let actual = 0
  if (diferencia <= 1) {
    for (let i=validos.length-1;i>=0;i--) {
      actual++
      if (i === 0 || validos[i]-validos[i-1] !== UN_DIA) break
    }
  }
  return {
    actual,
    maxima: mejor,
    ultimoRegistro: ultimo ? ultimo.toISOString().slice(0,10) : null,
    registroHoy: diferencia === 0,
  }
}

function construirReconocimientos(registros = [], hoy = new Date()) {
  const limite = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const fechas = new Set()
  let compartioReflexion = false

  for (const registro of registros) {
    const fecha = fechaValida(registro.fecha)
    if (!fecha || fecha.getTime() > limite) continue
    fechas.add(registro.fecha)
    if (typeof registro.comentario === 'string' && registro.comentario.trim().length >= 3) {
      compartioReflexion = true
    }
  }

  const dias = [...fechas].sort()
  const rachas = calcularRachas(dias,hoy)
  const retomoSuProceso = dias.some((fecha, indice) => {
    if (indice === 0) return false
    return (fechaValida(fecha) - fechaValida(dias[indice - 1])) / UN_DIA >= 3
  })
  const diasUltimos14 = dias.filter((fecha) => {
    const tiempo = fechaValida(fecha).getTime()
    return tiempo >= limite - 13 * UN_DIA && tiempo <= limite
  }).length

  const posibles = [
    { id: 'primer-paso', titulo: 'Mi primer paso', descripcion: 'Te diste un momento para registrar tu experiencia.', icono: 'sprout', cumple: dias.length >= 1 },
    { id: 'conociendome', titulo: 'Conociéndome', descripcion: 'Compartiste cómo te fue en tres días diferentes.', icono: 'heart', cumple: dias.length >= 3 },
    { id: 'mi-voz', titulo: 'Mi voz cuenta', descripcion: 'Expresaste con tus palabras cómo te sentiste.', icono: 'message', cumple: compartioReflexion },
    { id: 'a-mi-ritmo', titulo: 'A mi ritmo', descripcion: 'Volviste a registrar tu experiencia después de una pausa.', icono: 'sun', cumple: retomoSuProceso },
    { id: 'sigo-aprendiendo', titulo: 'Sigo aprendiendo', descripcion: 'Has dedicado tiempo a registrar tu experiencia en siete días diferentes, sin exigir continuidad.', icono: 'flower', cumple: dias.length >= 7 },
    { id: 'tres-dias-seguidos', titulo: 'Tres momentos seguidos', descripcion: 'Registraste cómo te fue en tres días consecutivos. Puedes continuar a tu ritmo.', icono: 'flame', cumple: rachas.maxima >= 3 },
    { id: 'siete-dias-seguidos', titulo: 'Una semana de constancia', descripcion: 'Tuviste siete días consecutivos con algún registro. Cada experiencia cuenta.', icono: 'calendar', cumple: rachas.maxima >= 7 },
  ]

  return {
    diasConRegistro: dias.length,
    diasUltimos14,
    rachas,
    reconocimientos: posibles.filter(({ cumple }) => cumple).map(({ cumple, ...logro }) => logro),
    mensaje: dias.length
      ? 'Gracias por darte tiempo para conocerte. Puedes continuar a tu ritmo.'
      : 'Puedes comenzar cuando quieras. No hay prisa ni metas que cumplir aquí.',
  }
}

function preferenciasDe(paciente) {
  const permitidaPorNutriologo = paciente.gamificacion?.permitidaPorNutriologo !== false
  const participa = paciente.gamificacion?.participa === true
  return {
    permitidaPorNutriologo,
    participa,
    activa: permitidaPorNutriologo && participa,
  }
}

module.exports = { construirReconocimientos, calcularRachas, preferenciasDe }
