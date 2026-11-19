export type Measurement = {
  _id: string; fecha: string; createdAt?: string; updatedAt?: string
  edad: number; peso: number; estatura: number; nivelActividadFisica: number; imc?: number
  grasaCorporal?: number; grasaVisceral?: number; masaMuscular?: number; masaOsea?: number; proteina?: number
}
export type Calculation = {
  _id: string; medicion: string; createdAt: string; fechaMedicion?: string
  observaciones?: string; peso: number; edad: number; estaturaCm: number
  resultado: { objetivoKcal: number; metabolismoBasal: number; gastoTotal: number;
    carbohidratosGramos: number; proteinasGramos: number; grasasGramos: number }
}
export function numberInput(value: string): number {
  const trimmed = value.trim()
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return NaN
  return Number(trimmed.replace(',', '.'))
}
export function measurementDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date.toISOString() : null
}
export function localDate(value = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`
}
export const clinicalDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
export const clinicalTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function measurementChanged(calculation: Calculation, measurements: Measurement[]): boolean {
  const original = measurements.find(item => item._id === calculation.medicion)
  if (original && (original.peso !== calculation.peso || original.edad !== calculation.edad ||
    Math.abs(original.estatura * 100 - calculation.estaturaCm) > 0.001 ||
    (calculation.fechaMedicion && Date.parse(original.fecha) !== Date.parse(calculation.fechaMedicion)))) return true
  return measurements.some(item => item._id !== calculation.medicion && (
    !!calculation.fechaMedicion && Date.parse(item.fecha) > Date.parse(calculation.fechaMedicion) ||
    !!item.createdAt && Date.parse(item.createdAt) > Date.parse(calculation.createdAt)))
}
