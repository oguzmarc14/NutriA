const normalizar = texto => (typeof texto === 'string' ? texto : '').toLowerCase().normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim()

function tokens(texto) {
  return normalizar(texto).split(' ').filter(Boolean)
    .map(palabra => palabra.length > 3 ? palabra.replace(/(?:([aeiou])s|ces)$/, (_, vocal) => vocal || 'z') : palabra)
}

function terminos(texto) {
  if (typeof texto !== 'string') return []
  return texto.split(/[,;\/\n•]+|\s+(?:y|e)\s+/iu).map(valor =>
    valor.trim()
      .replace(/^(?:posible\s+)?(?:al[eé]rgi(?:as?|c[oa]s?)(?:\s+alimentarias?)?|intolerancias?|disgustos?|alimentos que no le gustan|no le gusta[n]?)(?:\s+(?:a las?|a los|al|a))?\s*[:=\-]?\s*/iu, '')
      .replace(/\s+como al[eé]rgi(?:a|c[oa])\.?$/iu, '')
      .replace(/\s*\(al[eé]rgi(?:a|c[oa])\)\s*$/iu, '')
      .replace(/^(?:el|la|los|las)\s+/iu, '').trim(),
  ).filter(valor => {
    const clave = normalizar(valor)
    return clave && !/^(?:no|ningun[oa]s?|no aplica|sin alergias|sin alergias conocidas|no refiere|sin registrar)$/.test(clave)
  })
}

export function buscarAvisosAlimento(nombre, criterios) {
  const clave = ' ' + tokens(nombre).join(' ') + ' '
  return criterios.flatMap(({ tipo, terminos }) => {
    const coincidencia = terminos.find(valor => clave.includes(' ' + tokens(valor).join(' ') + ' '))
    return coincidencia ? [{ tipo, coincidencia }] : []
  })
}

export function criteriosAlimentarios(expediente) {
  return [
    { tipo: 'Posible alergia', terminos: terminos(expediente?.alergias) },
    { tipo: 'Posible intolerancia', terminos: terminos(expediente?.nutricion?.intoleranciasAlimentarias) },
    { tipo: 'Disgusto registrado', terminos: terminos(expediente?.nutricion?.comidaDisgusta) },
  ]
}
