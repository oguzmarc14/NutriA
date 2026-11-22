import { detailedUpdate, recordSections, recordText } from './recordSections.ts'
export const clinicalFields = [
  ['antecedentesPersonales', 'Antecedentes personales'], ['antecedentesFamiliares', 'Antecedentes familiares'],
  ['alergias', 'Alergias'], ['enfermedades', 'Enfermedades'], ['medicamentos', 'Medicamentos'],
  ['cirugias', 'Cirugías'], ['lesionesActuales', 'Lesiones actuales'], ['padecimientos', 'Padecimientos'], ['observaciones', 'Observaciones'],
] as const
export function clinicalForm(record: Record<string, unknown> | null): Record<string, string> {
  return Object.fromEntries([...clinicalFields.map(([key]) => [key, typeof record?.[key] === 'string' ? record[key] : '']), ...recordSections.flatMap(section => section.fields.map(field => [field.path, recordText(record,field.path)]))])
}
export function clinicalUpdate(base: Record<string, unknown> | null, form: Record<string, string>) {
  if (!base && !Object.values(form).some(value => value.trim())) throw new Error('Registra los datos clínicos revisados antes de crear el expediente.')
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
  const nested = detailedUpdate(base,form)
  const detailPaths = ['nutricion.comidaFavorita','nutricion.comidaDisgusta','nutricion.cafePorDia','nutricion.bebidasEnergeticasSemana','nutricion.bebidasAzucaradasSemana','nutricion.intoleranciasAlimentarias','deporte.ejercicioRealizar']
  for (const path of detailPaths) if ((form[path] || '').trim() !== recordText(base,path)) { if (form[path]?.trim()) details.add(path); else details.delete(path) }
  return { ...update, ...nested, camposConDetalle: [...details] }
}
