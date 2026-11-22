function fechaValida(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00.000Z')) && new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value
}
function finExclusivoDia(fecha) {
  const value = new Date(fecha + 'T00:00:00.000Z')
  value.setUTCDate(value.getUTCDate() + 1)
  return value
}
function planVigente(planes) {
  return [...planes].sort((a, b) =>
    new Date(b.fechaInicio).toISOString().slice(0, 10).localeCompare(new Date(a.fechaInicio).toISOString().slice(0, 10)) ||
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || String(b._id).localeCompare(String(a._id)))[0]
}
function comidasProgramadas(registros, planes) {
  const porId = new Map(planes.map(plan => [String(plan._id), plan]))
  let total = planes.reduce((sum, plan) => sum + (plan.comidas?.length || 0), 0)
  const diasAdicionales = new Set()
  for (const registro of registros) {
    const planId = String(registro.plan?._id || registro.plan)
    const plan = porId.get(planId)
    const inicio = plan && new Date(plan.fechaInicio).toISOString().slice(0, 10)
    if (!plan || !fechaValida(registro.fecha) || registro.fecha === inicio) continue
    const key = planId + ':' + registro.fecha
    if (diasAdicionales.has(key)) continue
    diasAdicionales.add(key)
    total += plan.comidas?.length || 0
  }
  return total
}
module.exports = { fechaValida, finExclusivoDia, comidasProgramadas, planVigente }
