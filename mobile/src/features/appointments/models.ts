export type Patient = { _id: string; name: string; email?: string }
export type Appointment = {
  _id: string
  inicio: string
  fin: string
  estado: string
  tipo: string
  patient: { _id: string; name: string } | null
  notas?: string
}

export type Availability = {
  zonaHoraria: string
  hoy: string
  desde: string
  dias: { fecha: string; espacios: { hora: string; inicio: string }[] }[]
}

export const time = new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' })
export const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function appointmentPath(start: Date, end: Date) {
  return '/citas?' + new URLSearchParams({ desde: start.toISOString(), hasta: end.toISOString() })
}

export function matchesPatient(patient: Patient, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return normalize(patient.name + ' ' + (patient.email ?? '')).includes(normalize(query.trim()))
}

export function shiftDate(date: string, days: number) {
  const value = new Date(date + 'T12:00:00Z')
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function dayLabel(date: string, compact = false) {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: compact ? 'short' : 'long', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(date + 'T12:00:00Z'))
}
