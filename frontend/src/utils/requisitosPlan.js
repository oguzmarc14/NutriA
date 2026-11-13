// Validación del expediente y de las medidas que NutriA requiere para iniciar
// un NUEVO plan alimenticio. Los planes existentes se pueden seguir consultando.
export function medicionListaParaPlan(medicion) {
  if (!medicion) return false
  const { peso, estatura, edad, nivelActividadFisica } = medicion
  return Number(peso) > 0 &&
    Number(estatura) >= 0.5 && Number(estatura) <= 3 &&
    Number.isInteger(Number(edad)) && Number(edad) >= 1 && Number(edad) <= 120 &&
    Number.isInteger(Number(nivelActividadFisica)) &&
    Number(nivelActividadFisica) >= 1 && Number(nivelActividadFisica) <= 5
}

export function evaluarRequisitosPlan(respuesta) {
  const tieneExpediente = Boolean(respuesta?.expediente?._id)
  const tieneMedicion = medicionListaParaPlan(respuesta?.ultimaMedicion)
  if (tieneExpediente && tieneMedicion) return { estado: 'listo', faltantes: [] }
  const faltantes = [
    ...(!tieneExpediente ? ['expediente'] : []),
    ...(!tieneMedicion ? ['mediciones'] : []),
  ]
  return {
    estado: 'incompleto',
    faltantes,
    tipo: faltantes.length === 2 ? 'ambos' : faltantes[0],
  }
}
