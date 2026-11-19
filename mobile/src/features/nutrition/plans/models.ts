import { localDate, measurementDate, numberInput } from '../clinicalModels.ts'

export type Nutrients = { kcal: number; proteina: number; carbohidratos: number; grasas: number; fibra?: number | null; sodio?: number | null }
export type Portion = { cantidad?: number; unidad?: string; gramos?: number | null; descripcion?: string }
export type CatalogFood = { _id: string; nombre: string; grupo?: string; porcion?: Portion; nutrimentos: Nutrients }
export type Food = Omit<CatalogFood, '_id'> & { tipo: 'catalogo' | 'personalizado'; alimento?: string | { _id: string } | null;
  cantidad: number; preparacionId?: string; notas?: string }
export type Meal = { _id?: string; nombre: string; hora?: string; platillo?: string; descripcion?: string;
  porcentajeDistribucion?: number | null; preparaciones?: { id: string; nombre: string; tipo: 'platillo' | 'bebida' }[]; alimentos: Food[] }
export type Plan = { _id: string; nombre: string; objetivo?: string; fechaInicio: string; createdAt: string;
  metaEnergiaKcal?: number | null; comidas: Meal[] }
export type PlanData = { paciente: { _id: string; name: string }; planes: Plan[] }
export type DraftFood = Food & { key: string; quantity: string }
export type DraftMeal = Omit<Meal, 'alimentos' | 'porcentajeDistribucion'> & { key: string; percentage: string; alimentos: DraftFood[] }
export type DraftPlan = { name: string; goal: string; date: string; energy: string; meals: DraftMeal[] }
let sequence = 0
export const draftKey = () => `draft-${++sequence}`
export function newMeal(nombre = 'Desayuno'): DraftMeal {
  return { key: draftKey(), nombre, hora: '', platillo: '', descripcion: '', percentage: '', preparaciones: [], alimentos: [] }
}
export function newPlan(): DraftPlan {
  return { name: '', goal: '', date: localDate(), energy: '', meals: [newMeal()] }
}
export function editPlan(plan: Plan): DraftPlan {
  return { name: plan.nombre, goal: plan.objetivo || '', date: plan.fechaInicio.slice(0, 10),
    energy: plan.metaEnergiaKcal == null ? '' : String(plan.metaEnergiaKcal),
    meals: plan.comidas.map(meal => ({ ...meal, key: draftKey(),
      percentage: meal.porcentajeDistribucion == null ? '' : String(meal.porcentajeDistribucion),
      alimentos: meal.alimentos.map(food => ({ ...food, key: draftKey(), quantity: String(food.cantidad) })),
    })) }
}
export function fromCatalog(food: CatalogFood): DraftFood {
  return { ...food, key: draftKey(), tipo: 'catalogo', alimento: food._id, cantidad: 1, quantity: '1', notas: '' }
}
export function planTotals(meals: DraftMeal[]): Nutrients {
  const total = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 }
  for (const meal of meals) for (const food of meal.alimentos) {
    const quantity = numberInput(food.quantity)
    if (!Number.isFinite(quantity) || quantity < 0.1) continue
    for (const key of ['kcal', 'proteina', 'carbohidratos', 'grasas'] as const) {
      const amount = food.nutrimentos[key]
      if (Number.isFinite(amount)) total[key] += amount * quantity
    }
  }
  return total
}
export function planPayload(draft: DraftPlan) {
  const fechaInicio = measurementDate(draft.date)
  if (!fechaInicio || draft.name.trim().length < 2) throw new Error('Escribe un nombre de al menos dos caracteres y una fecha válida.')
  const energy = draft.energy.trim() ? numberInput(draft.energy) : null
  if (energy !== null && (!Number.isFinite(energy) || energy <= 0)) throw new Error('La meta de energía debe ser positiva; déjala vacía para quitarla.')
  if (!draft.meals.length || !draft.meals.some(meal => meal.alimentos.length)) throw new Error('Agrega al menos una comida con alimentos antes de guardar.')
  const comidas = draft.meals.map(meal => {
    if (meal.nombre.trim().length < 2 || (meal.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(meal.hora))) throw new Error('Revisa el nombre y la hora de cada comida (HH:MM).')
    const percentage = meal.percentage.trim() ? numberInput(meal.percentage) : null
    if (percentage !== null && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) throw new Error('La distribución de cada comida debe estar entre 0 y 100%.')
    return { ...(meal._id ? { _id: meal._id } : {}), nombre: meal.nombre.trim(), hora: meal.hora || '',
      platillo: meal.platillo || '', descripcion: meal.descripcion || '', preparaciones: meal.preparaciones || [],
      porcentajeDistribucion: percentage,
      alimentos: meal.alimentos.map(food => {
        const cantidad = numberInput(food.quantity)
        if (!Number.isFinite(cantidad) || cantidad < 0.1) throw new Error(`Revisa las porciones de ${food.nombre}: el mínimo es 0.1.`)
        const common = { cantidad, notas: food.notas || '' }
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
