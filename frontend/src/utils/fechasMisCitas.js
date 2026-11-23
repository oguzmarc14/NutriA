export function formatearCitaPaciente(inicio,zonaHoraria='America/Mexico_City'){
  if(!inicio || !Number.isFinite(new Date(inicio).getTime()))return 'Fecha por confirmar'
  try{
    return new Intl.DateTimeFormat('es-MX',{
      timeZone:zonaHoraria,
      weekday:'long',day:'numeric',month:'long',year:'numeric',
      hour:'2-digit',minute:'2-digit',hourCycle:'h12',
    }).format(new Date(inicio))
  }catch{return 'Fecha por confirmar'}
}
export function tipoCitaPaciente(tipo){
  return {primera:'Primera consulta',seguimiento:'Consulta de seguimiento',otra:'Consulta'}[tipo] || 'Consulta'
}
export function estadoCitaPaciente(estado){
  return {confirmada:'Confirmada',programada:'Por confirmar',
    completada:'Realizada',cancelada:'Cancelada'}[estado] || 'En revisión'
}

// El servidor vuelve a comprobar la pertenencia y el horario real.
export function citaCancelable(cita,ahora=new Date()){
  return Boolean(cita && ['programada','confirmada'].includes(cita.estado) &&
    Number.isFinite(new Date(cita.inicio).getTime()) && new Date(cita.inicio)>ahora)
}


export function fechaCitaEnZona(inicio, zonaHoraria) {
  const fecha = new Date(inicio)
  if (!inicio || !Number.isFinite(fecha.getTime())) return ''
  try {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(fecha)
    const parte = tipo => partes.find(item => item.type === tipo).value
    return parte('year') + '-' + parte('month') + '-' + parte('day')
  } catch { return fecha.toISOString().slice(0, 10) }
}
