import { localDate, measurementDate, numberInput } from '../clinicalModels.ts'

export type Nutrients = { kcal: number; proteina: number; carbohidratos: number; grasas: number; fibra?: number | null; sodio?: number | null }
export type Portion = { cantidad?: number; unidad?: string; gramos?: number | null; descripcion?: string }
export type CatalogFood = { _id: string; nombre: string; grupo?: string; porcion?: Portion; nutrimentos: Nutrients }
export type Food = Omit<CatalogFood, '_id'> & { tipo: 'catalogo' | 'personalizado'; alimento?: string | { _id: string } | null;
  cantidad: number; preparacionId?: string; notas?: string }
export type Meal = { _id?: string; nombre: string; hora?: string; platillo?: string; descripcion?: string;
  porcentajeDistribucion?: number | null; preparaciones?: { id: string; nombre: string; tipo: 'platillo' | 'bebida' }[]; alimentos: Food[] }
export type Plan = { _id: string; nombre: string; objetivo?: string; fechaInicio: string; createdAt: string;
  metaEnergiaKcal?: number | null; comidas: Meal[]; aceptacionPaciente?: { estado?: 'pendiente' | 'aceptada'; fecha?: string | null } }
export type PlanData = { paciente: { _id: string; name: string }; planes: Plan[] }
export type DraftFood = Food & { key: string; quantity: string }
export type DraftMeal = Omit<Meal, 'alimentos' | 'porcentajeDistribucion'> & { key: string; percentage: string; alimentos: DraftFood[] }
export type DraftPlan = { name: string; goal: string; date: string; energy: string; meals: DraftMeal[] }
let sequence = 0
export const draftKey = () => `draft-${++sequence}`
export function newMeal(nombre = 'Desayuno'): DraftMeal {
  return { key: draftKey(), nombre, hora: '', platillo: '', descripcion: '', percentage: '', preparaciones: [{ id: draftKey(), nombre: '', tipo: 'platillo' }], alimentos: [] }
}
export function newPlan(): DraftPlan {
  return { name: '', goal: '', date: localDate(), energy: '', meals: [['Desayuno', '08:00'], ['Comida', '14:30'], ['Cena', '20:30']].map(([nombre, hora], i) => ({ ...newMeal(nombre), hora, percentage: String([25, 40, 35][i]) })) }
}
export function editPlan(plan: Plan): DraftPlan {
  const hasDistribution = plan.comidas.some(meal => meal.porcentajeDistribucion != null)
  const equalShare = Math.floor(100 / Math.max(1, plan.comidas.length))
  return { name: plan.nombre, goal: plan.objetivo || '', date: plan.fechaInicio.slice(0, 10),
    energy: plan.metaEnergiaKcal == null ? '' : String(plan.metaEnergiaKcal),
    meals: plan.comidas.map((meal, index) => ({ ...meal, key: draftKey(),
      percentage: String(hasDistribution ? meal.porcentajeDistribucion ?? 0
        : index === plan.comidas.length - 1 ? 100 - equalShare * index : equalShare),
      alimentos: meal.alimentos.map(food => ({ ...food, key: draftKey(), quantity: String(food.cantidad) })),
    })) }
}
export function fromCatalog(food: CatalogFood): DraftFood {
  return { ...food, key: draftKey(), tipo: 'catalogo', alimento: food._id, cantidad: 1, quantity: '1', notas: '' }
}
/** Admite 0.5, 0,5, ½, 1/2, 1½ y 1 1/2 porciones. */
export function parseQuantity(value: string): number {
  const source = value.trim().replace(',', '.')
    .replace(/¼/g, ' 1/4').replace(/½/g, ' 1/2').replace(/¾/g, ' 3/4')
    .replace(/⅛/g, ' 1/8').replace(/⅜/g, ' 3/8')
    .replace(/⅝/g, ' 5/8').replace(/⅞/g, ' 7/8').trim()
  const numeric = numberInput(source)
  if (Number.isFinite(numeric)) return numeric
  const match = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(source)
  if (!match) return NaN
  const whole = Number(match[1] || 0), top = Number(match[2]), bottom = Number(match[3])
  return !bottom ? NaN : whole + top / bottom
}
export function planTotals(meals: DraftMeal[]): Nutrients {
  const total = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 }
  for (const meal of meals) for (const food of meal.alimentos) {
    const quantity = parseQuantity(food.quantity)
    if (!Number.isFinite(quantity) || quantity < 0.1) continue
    for (const key of ['kcal', 'proteina', 'carbohidratos', 'grasas'] as const) {
      const amount = food.nutrimentos[key]
      if (Number.isFinite(amount)) total[key] += amount * quantity
    }
  }
  return total
}
export function mealPercentage(value: string) {
  return value.trim() ? numberInput(value) : 0
}

const fullShare = 10_000

export function balanceMealDistribution(meals: DraftMeal[], fixed?: { key: string; percent: number }): DraftMeal[] {
  if (meals.length < 2) return meals.map(meal => ({ ...meal, percentage: '100' }))
  const selected = fixed && Number.isFinite(fixed.percent) ? meals.find(meal => meal.key === fixed.key) : undefined
  const fixedShare = selected ? Math.round(Math.min(100, Math.max(0, fixed!.percent)) * 100) : 0
  const others = meals.filter(meal => meal !== selected)
  const weights = others.map(meal => {
    const value = mealPercentage(meal.percentage)
    return Number.isFinite(value) && value > 0 && value <= 100 ? value : 0
  })
  const weightSum = weights.reduce((total, weight) => total + weight, 0)
  const available = fullShare - fixedShare
  const amounts = weights.map(weight => available * (weightSum ? weight / weightSum : 1 / others.length))
  const rounded = amounts.map(Math.floor)
  const remainder = available - rounded.reduce((total, units) => total + units, 0)
  const byRemainder = amounts.map((amount, index) => ({ index, fraction: amount - rounded[index] }))
    .sort((a, b) => b.fraction - a.fraction)
  for (const { index } of byRemainder.slice(0, remainder)) rounded[index]++
  const shares = new Map(others.map((meal, index) => [meal.key, rounded[index]]))
  if (selected) shares.set(selected.key, fixedShare)
  return meals.map(meal => ({ ...meal, percentage: String(shares.get(meal.key)! / 100) }))
}

export function suggestedPlanName(patientName: string, date: string, plans: Pick<Plan, 'nombre' | 'fechaInicio'>[]) {
  const day = plans.filter(plan => plan.fechaInicio.slice(0, 10) === date)
  const prefix = `Plan nutricional ${patientName.trim()} ${date} #`
  const previous = day.reduce((highest, plan) => {
    const suffix = plan.nombre.startsWith(prefix) ? plan.nombre.slice(prefix.length) : ''
    const folio = /^\d+$/.test(suffix) ? Number(suffix) : 0
    return Number.isSafeInteger(folio) ? Math.max(highest, folio) : highest
  }, day.length)
  return prefix + String(previous + 1).padStart(3, '0')
}

export function planDistribution(meals: DraftMeal[]) {
  let total = 0
  let invalid = false
  for (const meal of meals) {
    const percent = mealPercentage(meal.percentage)
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      invalid = true
      continue
    }
    total += percent
  }
  const balanced = Math.abs(total - 100) < 1e-8
  const difference = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 8 }).format(Math.abs(100 - total))
  const error = invalid ? 'Cada comida debe tener un porcentaje entre 0 y 100.'
    : !balanced ? (total < 100 ? 'Faltan ' : 'Sobran ') + difference + ' puntos porcentuales.'
    : ''
  return { total, error }
}

export function editablePlanPayload(draft: DraftPlan) {
  const distribution = planDistribution(draft.meals)
  if (distribution.error) throw new Error(distribution.error)
  const payload = planPayload(draft)
  const included = balanceMealDistribution(draft.meals.filter(meal => meal.alimentos.length > 0))
  return { ...payload, comidas: payload.comidas.map((meal, index) => ({
    ...meal, porcentajeDistribucion: mealPercentage(included[index].percentage),
  })) }
}

export function planPayload(draft: DraftPlan) {
  const fechaInicio = measurementDate(draft.date)
  if (!fechaInicio) throw new Error('Selecciona una fecha válida para el inicio.')
  if (draft.name.trim().length < 2) throw new Error('Escribe un nombre de al menos dos caracteres o usa el sugerido.')
  const energy = draft.energy.trim() ? numberInput(draft.energy) : null
  if (energy !== null && (!Number.isFinite(energy) || energy <= 0)) throw new Error('La meta de energía debe ser positiva; déjala vacía para quitarla.')
  if (!draft.meals.length || !draft.meals.some(meal => meal.alimentos.length)) throw new Error('Agrega al menos una comida con alimentos antes de guardar.')
  // Las tres comidas iniciales son sugerencias: no publicar tiempos vacíos en la dieta real.
  // Un tiempo existente con historial (_id) requiere revisión explícita antes de eliminarlo.
  const incomplete = draft.meals.find(meal => !meal.alimentos.length && meal._id)
  if(incomplete)throw new Error('Agrega ingredientes a «' + (incomplete.nombre || 'Comida') + '» o elimínala explícitamente antes de guardar.')
  const comidas = draft.meals.filter(meal => meal.alimentos.length > 0).map(meal => {
    if (meal.nombre.trim().length < 2 || (meal.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(meal.hora))) throw new Error('Revisa el nombre y la hora de cada comida (HH:MM).')
    const percentage = meal.percentage.trim() ? numberInput(meal.percentage) : null
    if (percentage !== null && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) throw new Error('La distribución de cada comida debe estar entre 0 y 100%.')
    return { ...(meal._id ? { _id: meal._id } : {}), nombre: meal.nombre.trim(), hora: meal.hora || '',
      platillo: meal.platillo || '', descripcion: meal.descripcion || '', preparaciones: meal.preparaciones || [],
      porcentajeDistribucion: percentage,
      alimentos: meal.alimentos.map(food => {
        const cantidad = parseQuantity(food.quantity)
        if (!Number.isFinite(cantidad) || cantidad < 0.1) throw new Error(`Revisa las porciones de ${food.nombre}: el mínimo es 0.1.`)
        const common = { cantidad, notas: food.notas || '', preparacionId: food.preparacionId || '' }
        if (food.tipo === 'catalogo') {
          const alimentoId = typeof food.alimento === 'string' ? food.alimento : food.alimento?._id
          if (!alimentoId || !/^[a-f\d]{24}$/i.test(alimentoId)) throw new Error(`El alimento ${food.nombre} ya no tiene referencia de catálogo. Sustitúyelo antes de guardar.`)
          return { ...common, tipo: 'catalogo' as const, alimentoId, preparacionId: food.preparacionId || '' }
        }
        if (food.nombre.trim().length < 2 || Object.values(food.nutrimentos).some(value => value != null && (!Number.isFinite(value) || value < 0))) throw new Error('Revisa los datos del alimento personalizado.')
        return { ...common, tipo: 'personalizado' as const, nombre: food.nombre.trim(), grupo: food.grupo || '',
          porcion: food.porcion, nutrimentos: food.nutrimentos }
      }),
    }
  })
  return { nombre: draft.name.trim(), objetivo: draft.goal.trim(), fechaInicio: `${draft.date}T00:00:00.000Z`, metaEnergiaKcal: energy, comidas }
}

export function duplicatePlan(plan: Plan): DraftPlan {
  const draft = editPlan(plan)
  return { ...draft, name: plan.nombre + ' (copia)', date: localDate(), meals: draft.meals.map(({ _id, ...meal }) => ({ ...meal, key: draftKey(), alimentos: meal.alimentos.map(food => ({ ...food, key: draftKey() })) })) }
}
export function assistedPlan(nutrition: { numeroComidasDia?: number | string; primeraComida?: string; ultimaComida?: string; objetivos?: string[] }, kcal: number): DraftPlan {
  const count = Number(nutrition.numeroComidasDia)
  const names = count === 4 ? ['Desayuno', 'Colación', 'Comida', 'Cena'] : count >= 5 ? ['Desayuno', 'Colación matutina', 'Comida', 'Colación vespertina', 'Cena'] : ['Desayuno', 'Comida', 'Cena']
  const hours = names.length === 3 ? ['08:00', '14:30', '20:30'] : names.length === 4 ? ['08:00', '11:30', '14:30', '20:30'] : ['08:00', '11:30', '14:30', '17:30', '20:30']
  const percentages = names.length === 3 ? [25, 40, 35] : names.length === 4 ? [25, 10, 40, 25] : [20, 10, 35, 10, 25]
  const minutes = (v?: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? Number(v!.slice(0, 2)) * 60 + Number(v!.slice(3)) : null
  const first = minutes(nutrition.primeraComida), last = minutes(nutrition.ultimaComida)
  const hhmm = (n: number) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0')
  const labels: Record<string, string> = { perdida_peso: 'Pérdida de peso', incremento_masa: 'Incremento de masa muscular', salud: 'Mejorar la salud', rendimiento_deportivo: 'Rendimiento deportivo', control_enfermedades: 'Control de enfermedades' }
  return { name: 'Plan nutricional - ' + localDate(), date: localDate(), energy: String(kcal), goal: (nutrition.objetivos || []).map(x => labels[x] || x).join(', '),
    meals: names.map((name, i) => ({ ...newMeal(name), percentage: String(percentages[i]), hora: first !== null && last !== null && last > first
      ? hhmm(Math.round((first + (last - first) * i / (names.length - 1)) / 5) * 5)
      : i === 0 && first !== null ? hhmm(first) : i === names.length - 1 && last !== null ? hhmm(last) : hours[i] })) }
}
