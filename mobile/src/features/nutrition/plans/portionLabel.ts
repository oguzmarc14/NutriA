type PortionFood = { cantidad: number; porcion?: { cantidad?: number; unidad?: string; gramos?: number | null; descripcion?: string } }
const forms: Record<string, [string, string]> = {
  taza: ['taza','tazas'], tazas: ['taza','tazas'], pieza: ['pieza','piezas'], piezas: ['pieza','piezas'],
  cucharada: ['cucharada','cucharadas'], cucharadas: ['cucharada','cucharadas'], cucharadita: ['cucharadita','cucharaditas'], cucharaditas: ['cucharadita','cucharaditas'],
  lata: ['lata','latas'], latas: ['lata','latas'], rebanada: ['rebanada','rebanadas'], rebanadas: ['rebanada','rebanadas'],
  porción: ['porción','porciones'], porciones: ['porción','porciones'], porcion: ['porción','porciones'],
}
export function quantityLabel(value: number) {
  const integer = Math.floor(value), decimal = value - integer
  if (Math.abs(decimal) < 0.02) return String(integer)
  const fraction = ([[0.25,'1/4'],[1/3,'1/3'],[0.5,'1/2'],[2/3,'2/3'],[0.75,'3/4']] as const).find(([n]) => Math.abs(decimal - n) < 0.02)
  return fraction ? (integer ? integer + ' ' : '') + fraction[1] : value.toLocaleString('es-MX',{maximumFractionDigits:2})
}
export function portionLabel(food: PortionFood) {
  if (!Number.isFinite(food.cantidad) || food.cantidad <= 0) return 'Cantidad no disponible'
  const portion = food.porcion || {}, unit = portion.unidad?.trim() || 'porción'
  const grams = Number(portion.gramos) > 0 ? Number(portion.gramos) * food.cantidad : 0
  const base = Number(portion.cantidad)
  const amount = Number.isFinite(base) && base > 0 ? base * food.cantidad : food.cantidad
  const generic = ['porción','porcion','porciones'].includes(unit.toLowerCase())
  const names = forms[unit.toLowerCase()]
  const practical = !generic ? quantityLabel(amount) + ' ' + (names ? names[Math.abs(amount - 1) < 0.02 ? 0 : 1] : unit) : !grams ? quantityLabel(food.cantidad) + ' ' + (food.cantidad === 1 ? 'porción' : 'porciones') : ''
  return [practical, grams ? quantityLabel(grams) + ' g' : ''].filter(Boolean).join(' · ')
}
