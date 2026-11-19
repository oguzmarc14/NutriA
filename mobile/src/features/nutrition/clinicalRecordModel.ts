export const clinicalFields = [
  ['antecedentesPersonales', 'Antecedentes personales'], ['antecedentesFamiliares', 'Antecedentes familiares'],
  ['alergias', 'Alergias'], ['enfermedades', 'Enfermedades'], ['medicamentos', 'Medicamentos'],
  ['cirugias', 'Cirugías'], ['lesionesActuales', 'Lesiones actuales'], ['padecimientos', 'Padecimientos'], ['observaciones', 'Observaciones'],
] as const
export function clinicalForm(record: Record<string, unknown> | null): Record<string, string> {
  return Object.fromEntries(clinicalFields.map(([key]) => [key, typeof record?.[key] === 'string' ? record[key] : '']))
}
export function clinicalUpdate(base: Record<string, unknown> | null, form: Record<string, string>) {
  if (!base && !clinicalFields.some(([key]) => form[key]?.trim())) throw new Error('Registra los datos clínicos revisados antes de crear el expediente.')
  const details = new Set(Array.isArray(base?.camposConDetalle) ? base.camposConDetalle.filter((key): key is string => typeof key === 'string') : [])
  const update: Record<string, string | string[]> = {}
  for (const [key] of clinicalFields) {
    const value = (form[key] || '').trim()
    const original = typeof base?.[key] === 'string' ? base[key].trim() : ''
    if (value === original) continue
    update[key] = value
    if (value) details.add(key)
    else details.delete(key)
  }
  return { ...update, camposConDetalle: [...details] }
}
