export type View = 'Día' | 'Semana' | 'Mes'

export function period(date: Date, view: View, offset = 0): [Date, Date] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (view === 'Mes') {
    start.setDate(1)
    start.setMonth(start.getMonth() + offset)
  } else if (view === 'Semana') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7)
  } else {
    start.setDate(start.getDate() + offset)
  }
  const end = new Date(start)
  if (view === 'Mes') end.setMonth(end.getMonth() + 1)
  else end.setDate(end.getDate() + (view === 'Semana' ? 7 : 1))
  return [start, end]
}
