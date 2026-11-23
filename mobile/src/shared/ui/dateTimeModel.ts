export function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}
export function dayValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function calendarDays(year: number, month: number) {
  const first = new Date(year, month, 1, 12)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, i - offset + 1, 12))
}

export function clockParts(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) return { hour: 8, minute: '00', period: 'AM' as const }
  const hour = Number(match[1])
  return { hour: hour % 12 || 12, minute: match[2], period: hour < 12 ? 'AM' as const : 'PM' as const }
}
export function clockValue(hour: number, minute: string, period: 'AM' | 'PM') {
  return String(hour % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + minute
}
export function clockLabel(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return ''
  const { hour, minute, period } = clockParts(value)
  return hour + ':' + minute + ' ' + period
}
