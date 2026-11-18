// Fechas de pagos externos: evita el desfase de un día por zona horaria.
// La API usa la misma representación de fecha (AAAA-MM-DD).
export function hoyLocal(fecha=new Date()){
  return new Date(fecha.getTime()-fecha.getTimezoneOffset()*60000).toISOString().slice(0,10)
}

export function fechaPagoValida(valor,hoy=hoyLocal()){
  if(typeof valor!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(valor)||valor>hoy)return false
  const fecha=new Date(valor+'T12:00:00Z')
  return Number.isFinite(fecha.getTime())&&fecha.toISOString().slice(0,10)===valor
}
