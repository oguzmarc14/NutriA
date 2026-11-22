function clinicSummary(patients, measurements, now = new Date(), timeZone = 'America/Mexico_City') {
  const parts = value => {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return null
    const p = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: 'numeric' }).formatToParts(date)
    return Number(p.find(x => x.type === 'year').value) * 12 + Number(p.find(x => x.type === 'month').value) - 1
  }
  const month = parts(now)
  const counts = new Map()
  for (const patient of patients) {
    if (new Date(patient.createdAt) > now) continue
    const key = parts(patient.createdAt)
    if (key !== null) counts.set(key, (counts.get(key) || 0) + 1)
  }
  const ownIds = new Set(patients.map(p => String(p._id)))
  const comparable = measurements.filter(m => ownIds.has(String(m._id)) && m.count >= 2)
  return {
    totalPacientes: patients.length,
    nuevosMes: counts.get(month) || 0, nuevosAnterior: counts.get(month - 1) || 0,
    conHistorial: comparable.length,
    bajaron: comparable.filter(m => m.lastWeight < m.firstWeight).length,
    sinHistorialComparable: patients.length - comparable.length,
    meses: Array.from({ length: 6 }, (_, i) => {
      const key = month - 5 + i
      const date = new Date(Date.UTC(Math.floor(key / 12), key % 12, 15))
      return { etiqueta: new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' }).format(date), cantidad: counts.get(key) || 0 }
    }),
  }
}
module.exports = { clinicSummary }
