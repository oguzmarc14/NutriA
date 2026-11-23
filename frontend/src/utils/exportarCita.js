const formatoUTC = milisegundos => new Date(milisegundos).toISOString().replace(/[-:]|\.\d{3}/g, '')

function fechas(cita) {
  const inicio = Date.parse(cita.inicio)
  const fin = Date.parse(cita.fin)
  return [formatoUTC(inicio), formatoUTC(fin > inicio ? fin : inicio + 3600000)]
}

export function conGoogleCalendar(cita) {
  const parametros = new URLSearchParams({
    action: 'TEMPLATE', text: 'Consulta de nutrición', dates: fechas(cita).join('/'),
  })
  return 'https://calendar.google.com/calendar/render?' + parametros.toString()
}

export function descargarCita(cita) {
  const [inicio, fin] = fechas(cita)
  const id = String(cita._id).replace(/[^a-zA-Z0-9-]/g, '')
  const contenido = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NutriA//ES', 'BEGIN:VEVENT',
    'UID:' + id + '@nutria', 'DTSTAMP:' + formatoUTC(Date.now()),
    'DTSTART:' + inicio, 'DTEND:' + fin, 'SUMMARY:Consulta de nutrición',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/calendar;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'cita-nutria.ics'
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
