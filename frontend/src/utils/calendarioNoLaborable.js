export function diaValido(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false
  const date=new Date(value+'T12:00:00Z')
  return !Number.isNaN(+date) && date.toISOString().slice(0,10)===value
}
export function moverDia(day,count){
  const date=new Date(day+'T12:00:00Z')
  date.setUTCDate(date.getUTCDate()+count)
  return date.toISOString().slice(0,10)
}
export function moverPeriodo(day,view,step){
  if(view==='Día')return moverDia(day,step)
  if(view==='Semana')return moverDia(day,step*7)
  const [year,month,dayNumber]=day.split('-').map(Number)
  const date=new Date(Date.UTC(year,month-1+step,1,12))
  const lastDay=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()
  date.setUTCDate(Math.min(dayNumber,lastDay))
  return date.toISOString().slice(0,10)
}
export function diasVista(day,view){
  if(!diaValido(day))return []
  if(view==='Día')return [day]
  const first=view==='Semana'?day:day.slice(0,7)+'-01'
  const offset=(new Date(first+'T12:00:00Z').getUTCDay()+6)%7
  const start=moverDia(first,-offset)
  return Array.from({length:view==='Semana'?7:42},(_,i)=>moverDia(start,i))
}
export function bloquearRango(current,first,last,motivo){
  if(!diaValido(first)||!diaValido(last)||first>last)throw new Error('Elige fechas válidas y en orden.')
  const count=Math.round((Date.parse(last+'T12:00:00Z')-Date.parse(first+'T12:00:00Z'))/86400000)
  if(count>99)throw new Error('El rango permite máximo 100 días.')
  const rows=new Map(current.map(item=>[item.fecha,item]))
  for(let index=0;index<=count;index++){
    const fecha=moverDia(first,index)
    rows.set(fecha,{fecha,motivo:motivo.trim().slice(0,80)})
  }
  if(rows.size>100)throw new Error('Se permiten máximo 100 días no laborables.')
  return [...rows.values()].sort((a,b)=>a.fecha.localeCompare(b.fecha))
}
