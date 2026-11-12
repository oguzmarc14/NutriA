// Campos descriptivos opcionales; no incluye horas, número de comidas,
// metas nutricionales ni selectores estructurados del entrenamiento.
export const CAMPOS_DESCRIPTIVOS = [
  "antecedentesPersonales",
  "antecedentesFamiliares",
  "alergias",
  "enfermedades",
  "medicamentos",
  "cirugias",
  "lesionesActuales",
  "padecimientos",
  "nutricion.comidaFavorita",
  "nutricion.comidaDisgusta",
  "nutricion.cafePorDia",
  "nutricion.bebidasEnergeticasSemana",
  "nutricion.bebidasAzucaradasSemana",
  "nutricion.intoleranciasAlimentarias",
  "deporte.ejercicioRealizar",
  "observaciones"
]
export function camposActivosDesdeExpediente(expediente) {
  if (!expediente || typeof expediente !== 'object') return []
  const almacenados = new Set(Array.isArray(expediente.camposConDetalle)
    ? expediente.camposConDetalle : [])
  for (const campo of CAMPOS_DESCRIPTIVOS) {
    const valor = campo.split('.').reduce((obj,prop) => obj?.[prop], expediente)
    if (typeof valor === 'string' && valor.trim().length > 0) almacenados.add(campo)
  }
  return CAMPOS_DESCRIPTIVOS.filter(campo => almacenados.has(campo))
}
