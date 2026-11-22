export const states = { completada: 'La consumí completa', parcial: 'La consumí parcialmente', omitida: 'No la consumí' } as const
export const ratings = { gusto: 'Me gustó', neutral: 'Neutral', no_gusto: 'No me gustó' } as const
export type TrackingRecord = { _id: string; plan: string; comida: string; fecha: string;
  estado: keyof typeof states; agrado: keyof typeof ratings; comentario: string; nombreComida: string; platillo?: string; updatedAt?: string }
export type TrackingPlan = { _id: string; fechaInicio?: string; createdAt?: string; nombre?: string; comidas: { _id?: string }[] }
export type TrackingData = { registros: TrackingRecord[]; planes: TrackingPlan[] }
export function validDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00.000Z')) && new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value
}
export const planStart = (plan: TrackingPlan) => (plan.fechaInicio || plan.createdAt || '').slice(0, 10)
export function activePlan<T extends TrackingPlan>(plans: T[], date: string): T | undefined {
  if (!validDay(date)) return undefined
  return [...plans].filter(plan => validDay(planStart(plan)) && planStart(plan) <= date).sort((a, b) =>
    planStart(b).localeCompare(planStart(a)) || (b.createdAt || '').localeCompare(a.createdAt || '') || b._id.localeCompare(a._id))[0]
}
export function findTracking(records: TrackingRecord[], plan: string, meal: string, date: string) {
  return records.find(item => item.plan === plan && item.comida === meal && item.fecha === date)
}
export function trackingPayload(plan: TrackingPlan, meal: string, date: string, state: string, rating: string, comment: string) {
  if (!/^[a-f\d]{24}$/i.test(plan._id) || !/^[a-f\d]{24}$/i.test(meal) || !plan.comidas.some(item => item._id === meal)) throw new Error('La comida no está disponible en esta dieta. Actualiza Mi plan.')
  if (!validDay(date) || date < planStart(plan)) throw new Error('La fecha no corresponde a la vigencia de la dieta.')
  if (!Object.hasOwn(states, state) || !Object.hasOwn(ratings, rating)) throw new Error('Elige cómo consumiste la comida y qué te pareció.')
  if (comment.trim().length > 500) throw new Error('El comentario admite un máximo de 500 caracteres.')
  return { planId: plan._id, comidaId: meal, fecha: date, estado: state, agrado: rating, comentario: comment.trim() }
}

export function dailySummary(data: TrackingData, date: string) {
  const plan = activePlan(data.planes, date)
  const records = (plan?.comidas || []).flatMap(meal => {
    const record = meal._id ? findTracking(data.registros, plan!._id, meal._id, date) : undefined
    return record ? [record] : []
  })
  return { plan, total: plan?.comidas.length || 0, recorded: records.length,
    completed: records.filter(item => item.estado === 'completada').length,
    partial: records.filter(item => item.estado === 'parcial').length,
    skipped: records.filter(item => item.estado === 'omitida').length }
}
