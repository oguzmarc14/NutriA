import type { Measurement } from './clinicalModels.ts'

export type Input = {
  measurement: Measurement | undefined
  sex: 'male' | 'female' | null
  factor: number; adjustment: number
  carbs: number; protein: number; fats: number
}
export function calculationEstimate(value: Input) {
  const { measurement, sex, factor, adjustment, carbs, protein, fats } = value
  if (!measurement || measurement.edad < 18 || measurement.peso <= 0 ||
    measurement.estatura < 0.5 || measurement.estatura > 3 ||
    !sex || !Number.isFinite(factor) || factor < 1 || factor > 2.5 ||
    !Number.isFinite(adjustment) || Math.abs(adjustment) > 1000 ||
    [carbs,protein,fats].some(n => !Number.isFinite(n) || n < 0 || n > 100) ||
    Math.abs(carbs + protein + fats - 100) > .001) return null
  const round = (n: number) => Math.round(n * 10) / 10
  const basal = 10 * measurement.peso + 6.25 * measurement.estatura * 100 -
    5 * measurement.edad + (sex === 'male' ? 5 : -161)
  const gasto = basal * factor
  const objetivo = gasto + adjustment
  if (!Number.isFinite(objetivo) || objetivo <= 0) return null
  return {
    basal: round(basal), gasto: round(gasto), objetivo: round(objetivo),
    carbohidratos: round(objetivo * carbs / 100 / 4),
    proteinas: round(objetivo * protein / 100 / 4),
    grasas: round(objetivo * fats / 100 / 9),
  }
}
/** Fecha clínica guardada en UTC: evitar desplazarla un día según la zona del teléfono. */
export function clinicalDay(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(value.slice(0, 10) + 'T12:00:00Z'))
}
