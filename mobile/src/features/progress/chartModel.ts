export type ChartMeasurement = { _id: string; fecha?: string; createdAt?: string; peso?: number; imc?: number; grasaCorporal?: number; masaMuscular?: number }
export const metrics = [
  { key: 'peso', label: 'Peso', unit: 'kg' }, { key: 'imc', label: 'IMC', unit: 'kg/m²' },
  { key: 'grasaCorporal', label: 'Grasa corporal', unit: '%' }, { key: 'masaMuscular', label: 'Masa muscular', unit: 'kg' },
] as const
export type Metric = typeof metrics[number]['key']
export function chartPoints(rows: ChartMeasurement[], metric: Metric) {
  return rows.flatMap(row => {
    const value = row[metric], date = Date.parse(row.fecha || row.createdAt || '')
    return typeof value === 'number' && Number.isFinite(value) && (metric === 'peso' || metric === 'imc' ? value > 0 : value >= 0) && Number.isFinite(date)
      ? [{ id: row._id, date, value }] : []
  }).sort((a, b) => a.date - b.date || a.id.localeCompare(b.id))
}
export function chartCoordinates(points: ReturnType<typeof chartPoints>, width: number, height: number) {
  if (!points.length) return []
  const min = Math.min(...points.map(p => p.value)), max = Math.max(...points.map(p => p.value))
  const from = points[0].date, span = points[points.length - 1].date - from
  return points.map(point => ({ ...point,
    x: span ? (point.date - from) / span * width : width / 2,
    y: max === min ? height / 2 : height - (point.value - min) / (max - min) * height,
  }))
}
