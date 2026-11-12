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
