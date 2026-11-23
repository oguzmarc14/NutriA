export type CalendarView = 'Día'|'Semana'|'Mes'
export type ClosedDay = { fecha: string; motivo: string }
export function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T12:00:00Z')
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value
}
export function moveDay(day: string, amount: number): string {
  const d = new Date(day + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate()+amount)
  return d.toISOString().slice(0,10)
}
export function shiftCalendar(day: string, view: CalendarView, step: number): string {
  if(view==='Día')return moveDay(day,step)
  if(view==='Semana')return moveDay(day,step*7)
  const [y,m,d]=day.split('-').map(Number)
  const month=new Date(Date.UTC(y,m-1+step,1,12))
  const last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate()
  month.setUTCDate(Math.min(d,last))
  return month.toISOString().slice(0,10)
}
export function calendarDays(day: string,view: CalendarView):string[] {
  if(!validDay(day))return []
  if(view==='Día')return [day]
  if(view==='Semana'){
    const weekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7
    return Array.from({length:7},(_,i)=>moveDay(day,i-weekday))
  }
  const first=day.slice(0,7)+'-01'
  const offset=(new Date(first+'T12:00:00Z').getUTCDay()+6)%7
  const start=moveDay(first,-offset)
  return Array.from({length:42},(_,i)=>moveDay(start,i))
}
export function closedRange(first: string,last: string):string[] {
  if(!validDay(first)||!validDay(last)||last<first)throw new Error('Selecciona un rango válido de fechas.')
  const count=Math.round((Date.parse(last+'T12:00:00Z')-Date.parse(first+'T12:00:00Z'))/86400000)
  if(count>99)throw new Error('Solo puedes marcar 100 días por rango.')
  return Array.from({length:count+1},(_,i)=>moveDay(first,i))
}
export function addClosedDays(items: ClosedDay[],first: string,last: string,motivo: string):ClosedDay[] {
  const map=new Map(items.map(item=>[item.fecha,item]))
  for(const fecha of closedRange(first,last))map.set(fecha,{fecha,motivo:motivo.trim().slice(0,80)})
  if(map.size>100)throw new Error('Solo puedes guardar 100 fechas no laborables.')
  return [...map.values()].sort((a,b)=>a.fecha.localeCompare(b.fecha))
}
export function localToday(){
  const d=new Date()
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
}
