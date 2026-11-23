import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Linking } from 'react-native'

export function calendarEvent(start: string, end: string | undefined) {
  const from = Date.parse(start)
  const to = Date.parse(end || '')
  if (!Number.isFinite(from)) throw new Error('La cita no tiene una fecha válida.')
  const format = (time: number) => new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, '')
  return { start: format(from), end: format(Number.isFinite(to) && to > from ? to : from + 3600000) }
}

export async function exportAppointment(id: string, start: string, end: string | undefined, google: boolean) {
  const dates = calendarEvent(start, end)
  if (google) {
    const params = new URLSearchParams({ action: 'TEMPLATE', text: 'Consulta de nutrición', dates: dates.start + '/' + dates.end })
    await Linking.openURL('https://calendar.google.com/calendar/render?' + params.toString())
    return
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('No se puede compartir un calendario en este teléfono.')
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '')
  const file = new File(Paths.cache, 'nutria-' + safeId + '-' + Date.now() + '.ics')
  try {
    file.create()
    file.write(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NutriA//ES', 'BEGIN:VEVENT',
      'UID:' + safeId + '@nutria', 'DTSTAMP:' + calendarEvent(new Date().toISOString(), undefined).start,
      'DTSTART:' + dates.start, 'DTEND:' + dates.end, 'SUMMARY:Consulta de nutrición', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n'))
    await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics', dialogTitle: 'Agregar cita al calendario' })
  } finally {
    if (file.exists) file.delete()
  }
}
