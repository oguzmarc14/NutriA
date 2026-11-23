export type ComparedMeasurement = {
  _id: string; fecha?: string; createdAt?: string
  peso?: number; estatura?: number; imc?: number
  grasaCorporal?: number; grasaVisceral?: number; masaMuscular?: number
  masaOsea?: number; proteina?: number
}
export const comparisonMetrics = [
  ['peso', 'Peso', 'kg'],
  ['imc', 'IMC', ''],
  ['grasaCorporal', 'Grasa corporal', '%'],
  ['grasaVisceral', 'Grasa visceral', ''],
  ['masaMuscular', 'Masa muscular', 'kg'],
  ['masaOsea', 'Masa ósea', 'kg'],
  ['proteina', 'Proteína corporal', '%'],
] as const
export function measurementDifferences(before: ComparedMeasurement, after: ComparedMeasurement) {
  return comparisonMetrics.flatMap(([key, label, unit]) => {
    const previous = before[key]
    const current = after[key]
    return typeof previous === 'number' && Number.isFinite(previous) &&
      typeof current === 'number' && Number.isFinite(current)
      ? [{ key, label, unit, previous, current, difference: Math.round((current - previous) * 100) / 100 }] : []
  })
}
