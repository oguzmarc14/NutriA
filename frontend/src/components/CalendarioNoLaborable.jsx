import { useMemo,useState } from 'react'
import { CalendarDays, CalendarOff, ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { bloquearRango,diaValido,diasVista,moverPeriodo } from '../utils/calendarioNoLaborable'
const weekdays=['L','M','M','J','V','S','D']
const today=()=>{
  const d=new Date()
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
}
const dateLabel=day=>new Intl.DateTimeFormat('es-MX',{dateStyle:'full',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))
export default function CalendarioNoLaborable({form,onChange,disabled=false}){
  const [view,setView]=useState('Mes')
  const [selected,setSelected]=useState(today)
  const [last,setLast]=useState('')
  const [reason,setReason]=useState('')
  const [error,setError]=useState('')
  const [showAll,setShowAll]=useState(false)
  const blocked=new Map((form.diasNoLaborables||[]).map(item=>[item.fecha,item]))
  const rows=useMemo(()=>diasVista(selected,view),[selected,view])
  function closeDates(){
    try {
      onChange(bloquearRango(form.diasNoLaborables||[],selected,last||selected,reason))
      setError('');setLast('');setReason('')
    } catch(cause){setError(cause.message||'Fechas inválidas')}
  }
  function removeDay(day){
    onChange((form.diasNoLaborables||[]).filter(item=>item.fecha!==day))
    setError('')
  }
  const items=[...(form.diasNoLaborables||[])].sort((a,b)=>a.fecha.localeCompare(b.fecha))
  return <section id="dias-no-laborables" className="space-y-4 rounded-2xl border border-[#cde0d3] bg-[#eef6f0] p-3 sm:p-5">
    <div className="flex items-start gap-3">
      <CalendarOff size={23} className="shrink-0 text-[#246b55]"/>
      <div><h3 className="font-extrabold text-[#173f34]">Días no laborables y vacaciones</h3>
        <p className="mt-1 text-xs leading-5 text-[#557565]">Explora la agenda por día, semana o mes. Marca descansos y vacaciones para impedir nuevas reservas. Las citas existentes no se cancelan automáticamente.</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {['Día','Semana','Mes'].map(mode=><button key={mode} type="button"
        disabled={disabled} aria-pressed={view===mode} onClick={()=>setView(mode)}
        className={'min-h-11 rounded-xl px-4 text-sm font-bold '+(view===mode?'bg-[#246b55] text-white':'bg-white text-[#246b55]')}>
        {mode}</button>)}
    </div>
    <div className="flex items-center gap-3">
      <button type="button" disabled={disabled} aria-label="Periodo anterior" onClick={()=>setSelected(day=>moverPeriodo(day,view,-1))}
        className="grid size-11 place-items-center rounded-xl border border-[#cee0d2] bg-white"><ChevronLeft size={19}/></button>
      <p className="flex-1 text-center text-sm font-extrabold text-[#173f34]">{diaValido(selected)?dateLabel(selected):'Fecha inválida'}</p>
      <button type="button" disabled={disabled} aria-label="Periodo siguiente" onClick={()=>setSelected(day=>moverPeriodo(day,view,1))}
        className="grid size-11 place-items-center rounded-xl border border-[#cee0d2] bg-white"><ChevronRight size={19}/></button>
    </div>
    {view==='Mes'&&<div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#587765]">
      {weekdays.map((label,i)=><span key={i}>{label}</span>)}</div>}
    <div className={view==='Día'?'grid grid-cols-1 gap-1':'grid grid-cols-7 gap-1'}>
      {rows.map(day=>{
        const closed=blocked.has(day),active=day===selected
        const working=form.dias.includes(new Date(day+'T12:00:00Z').getUTCDay())
        return <button type="button" key={day} disabled={disabled}
          aria-label={dateLabel(day)+(closed?' no laborable':working?' laborable':' descanso habitual')}
          aria-pressed={active} onClick={()=>{setSelected(day);setReason(blocked.get(day)?.motivo||'');setLast('');setError('')}}
          className={'flex min-h-12 flex-col items-center justify-center rounded-xl border text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246b55] '+
            (closed?'border-[#ecb7a7] bg-[#f9e3dc] text-[#a04a33] ':active?'border-2 border-[#246b55] bg-[#d5ecdc] text-[#173f34] ':working?'border-[#d4e5d8] bg-white text-[#246b55] ':'border-[#e0e6e1] bg-[#e8eee9] text-[#869b8a] ')+
            (view==='Mes'&&day.slice(0,7)!==selected.slice(0,7)?'opacity-50':'')}>
          <span>{Number(day.slice(8))}</span><span className="text-[10px]">{closed?'Cerrado':working?'•':'—'}</span>
        </button>
      })}
    </div>
    <p className="text-xs text-[#52715e]">Verde: atención habitual · Rojo: cerrado · Gris: descanso semanal</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs font-bold text-[#355f4a]">Fecha seleccionada
        <input type="date" value={selected} disabled={disabled} onChange={e=>{if(diaValido(e.target.value)){setSelected(e.target.value);setError('')}else setError('Fecha inválida')}}
          className="min-h-11 min-w-0 rounded-xl border border-[#c5dccc] bg-white px-3"/></label>
      <label className="grid gap-1 text-xs font-bold text-[#355f4a]">Hasta la fecha (opcional, vacaciones)
        <input type="date" value={last} disabled={disabled} onChange={e=>setLast(e.target.value)}
          className="min-h-11 min-w-0 rounded-xl border border-[#c5dccc] bg-white px-3"/></label>
      <label className="grid gap-1 text-xs font-bold text-[#355f4a] sm:col-span-2">Motivo (opcional)
        <input maxLength={80} type="text" value={reason} disabled={disabled} onChange={e=>setReason(e.target.value)}
          className="min-h-11 min-w-0 rounded-xl border border-[#c5dccc] bg-white px-3" placeholder="Vacaciones, descanso o cierre especial"/></label>
    </div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} onClick={closeDates}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white">
        <Plus size={16}/> Bloquear fecha o rango</button>
      {blocked.has(selected)&&<button type="button" disabled={disabled} onClick={()=>removeDay(selected)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#b8d3c0] bg-white px-4 text-sm font-bold text-[#246b55]">
        <RotateCcw size={16}/> Habilitar de nuevo</button>}
    </div>
    <p className="text-xs font-bold text-[#315b46]">{items.length} días marcados · Guarda el horario para aplicar cambios.</p>
    {items.length>0&&<div className="space-y-2">
      <button type="button" aria-expanded={showAll} onClick={()=>setShowAll(value=>!value)}
        className="flex min-h-10 items-center gap-2 text-xs font-bold text-[#246b55]">
        <CalendarDays size={15}/>{showAll?'Ocultar lista':'Ver todas las fechas ('+items.length+')'}
      </button>
      {showAll&&<ul className="max-h-60 space-y-1 overflow-y-auto">
        {items.map(item=><li key={item.fecha} className="flex items-center gap-2 rounded-xl bg-white p-2">
          <span className="flex-1 break-words text-xs text-[#345d47]">{item.fecha} · {item.motivo||'Sin motivo'}</span>
          <button type="button" disabled={disabled} onClick={()=>removeDay(item.fecha)}
            aria-label={'Quitar bloqueo '+item.fecha} className="min-h-10 rounded-lg border px-3 text-xs font-bold text-red-700">Quitar</button>
        </li>)}
      </ul>}
    </div>}
  </section>
}
