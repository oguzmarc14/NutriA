// Motor de disponibilidad. Trabaja con horas locales del consultorio y UTC para las citas.
// Nunca entrega al público datos de pacientes o detalles de eventos ocupados.
const DURACION_MINUTOS = 60
const PASO_MINUTOS = 60

function minutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
function horaDe(minute) {
  return String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0')
}
function partesLocales(fecha, zonaHoraria) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha).filter(x => ['year','month','day','weekday','hour','minute'].includes(x.type)).map(x => [x.type,x.value]))
  return { fecha: p.year + '-' + p.month + '-' + p.day, hora: p.hour + ':' + p.minute,
    dia: {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday],
    year:Number(p.year),month:Number(p.month),day:Number(p.day),hour:Number(p.hour),minute:Number(p.minute) }
}
function fechaLocalAhora(zonaHoraria, ahora = new Date()) {
  return partesLocales(ahora,zonaHoraria).fecha
}
function sumarDias(fechaIso, cantidad) {
  const d = new Date(fechaIso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + cantidad)
  return d.toISOString().slice(0,10)
}
function diaSemana(fechaIso) { return new Date(fechaIso + 'T12:00:00Z').getUTCDay() }
function horaLocalAUTC(fechaIso, hora, zonaHoraria) {
  const [y, m, d] = fechaIso.split('-').map(Number)
  const [h, mi] = hora.split(':').map(Number)
  const target = Date.UTC(y,m-1,d,h,mi)
  let utc = target
  for(let i=0;i<4;i++) {
    const p = partesLocales(new Date(utc),zonaHoraria)
    const displayedAsUtc = Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)
    const diff = target - displayedAsUtc
    if (diff === 0) break
    utc += diff
  }
  const back = partesLocales(new Date(utc),zonaHoraria)
  if (back.fecha !== fechaIso || back.hora !== hora) return null
  return new Date(utc)
}

function horarioAdmite(configuracion, fecha) {
  if(!configuracion?.configurado) return true
  const local = partesLocales(fecha, configuracion.zonaHoraria)
  const block = configuracion.franjas?.some(f =>
    f.dia === local.dia && minutos(local.hora) >= minutos(f.inicio) &&
    minutos(local.hora) + DURACION_MINUTOS <= minutos(f.fin)
  )
  return Boolean(block)
}
function esDiaNoLaborable(horarioLaboral, fechaIso) {
  return Boolean(horarioLaboral?.diasNoLaborables?.some(d => d?.fecha === fechaIso))
}
function construirDisponibilidad(fechaIso, horarioCitas, horarioLaboral, citasOcupadas = [], ahora = new Date()) {
  const zonaHoraria = horarioLaboral.zonaHoraria
  const dia = diaSemana(fechaIso)
  if (!horarioCitas?.configurado || !horarioCitas.franjas?.length || !horarioLaboral?.configurado) return []
  if(!horarioLaboral.dias.includes(dia) || esDiaNoLaborable(horarioLaboral, fechaIso)) return []
  const minAnticipacion = (horarioCitas.anticipacionHoras ?? 2) * 3600000
  const limite = ahora.getTime() + minAnticipacion
  const horas = []
  const franjas = horarioCitas.franjas.filter(f=>f.dia===dia)
  for(const f of franjas){
    for(let t=minutos(f.inicio);t+DURACION_MINUTOS<=minutos(f.fin);t+=PASO_MINUTOS){
      const hora=horaDe(t)
      if(t < minutos(horarioLaboral.inicio) || t+DURACION_MINUTOS > minutos(horarioLaboral.fin))continue
      const instante = horaLocalAUTC(fechaIso,hora,zonaHoraria)
      if(!instante || instante.getTime() <= limite)continue
      const fin = instante.getTime() + DURACION_MINUTOS*60000
      if(citasOcupadas.some(c=>new Date(c.inicio).getTime()<fin && new Date(c.fin).getTime()>instante.getTime()))continue
      horas.push({hora,inicio:instante.toISOString()})
    }
  }
  return horas.sort((a,b)=>a.inicio.localeCompare(b.inicio))
}
function franjaDentroHorario(franjas,horarioLaboral){
  if(!horarioLaboral?.configurado)return false
  return franjas.every(f => horarioLaboral.dias.includes(f.dia) &&
    minutos(f.inicio) >= minutos(horarioLaboral.inicio) &&
    minutos(f.fin) <= minutos(horarioLaboral.fin))
}
module.exports = { DURACION_MINUTOS, minutos, partesLocales, fechaLocalAhora, sumarDias, diaSemana,
  horaLocalAUTC, horarioAdmite, construirDisponibilidad, franjaDentroHorario, esDiaNoLaborable }
