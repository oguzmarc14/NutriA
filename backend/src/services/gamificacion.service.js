const UN_DIA = 24 * 60 * 60 * 1000

// Fechas de seguimiento sin horas; no se evalúan calorías, peso ni el estado de la comida.
function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const valor = new Date(Date.UTC(anio, mes - 1, dia))
  return valor.toISOString().slice(0, 10) === fecha ? valor : null
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
  ]

  return {
    diasConRegistro: dias.length,
    diasUltimos14,
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

module.exports = { construirReconocimientos, preferenciasDe }
