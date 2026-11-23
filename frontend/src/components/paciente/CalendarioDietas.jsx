import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Utensils } from 'lucide-react'
import { fechaDietaLegible, inicioDieta, dietaParaFecha } from '../../utils/calendarioDietas'
import {
  VISTAS_CITAS, fechasDelRangoAgenda, formatearPeriodoAgenda, moverFocoAgenda, rangoVistaAgenda,
} from '../../utils/vistasAgenda'
import '../citas/agenda.css'

const vistas = { dia: 'Día', semana: 'Semana', mes: 'Mes' }
const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const boton = 'nutria-agenda-secondary nutria-agenda-navegar'

export default function CalendarioDietas({ planes, hoy, fecha, onFecha }) {
  const [vista, setVista] = useState('mes')
  const fechas = fechasDelRangoAgenda(rangoVistaAgenda(vista, fecha))
  const planDia = dietaParaFecha(planes, fecha)

  return <section aria-labelledby="calendario-dietas" className="min-w-0 space-y-4 rounded-3xl border border-[#c9ddd3] bg-white/85 p-4 sm:p-5">
    <h2 id="calendario-dietas" className="flex items-center gap-2 text-base font-extrabold text-[#173f34]">
      <CalendarDays size={19} aria-hidden="true"/>Calendario de dietas
    </h2>
    <div className="nutria-agenda-vistas" role="group" aria-label="Vista del calendario de dietas">
      {VISTAS_CITAS.map(opcion => <button key={opcion} type="button" aria-pressed={vista === opcion}
        onClick={() => setVista(opcion)} className="nutria-agenda-vista-boton">{vistas[opcion]}</button>)}
    </div>
    <div className="nutria-agenda-navegacion">
      <h3 aria-live="polite" className="min-w-0 text-sm font-bold capitalize text-[#173f34]">{formatearPeriodoAgenda(vista, fecha)}</h3>
      <div className="flex shrink-0 gap-1">
        <button className={boton} type="button" onClick={() => onFecha(moverFocoAgenda(vista, fecha, -1))}
          aria-label={vistas[vista] + ' anterior'}><ChevronLeft size={18} aria-hidden="true"/></button>
        <button className="nutria-agenda-secondary nutria-agenda-hoy" type="button" onClick={() => onFecha(hoy)}>Hoy</button>
        <button className={boton} type="button" onClick={() => onFecha(moverFocoAgenda(vista, fecha, 1))}
          aria-label={vistas[vista] + ' siguiente'}><ChevronRight size={18} aria-hidden="true"/></button>
      </div>
    </div>
    {vista !== 'dia' && <>
      <div className={vista === 'mes' ? 'nutria-agenda-mes' : 'nutria-agenda-semana'}
        role="group" aria-label="Seleccionar día del menú">
        {dias.map(dia => <span className="nutria-agenda-mes-cabecera" key={dia} aria-hidden="true">{dia}</span>)}
        {fechas.map(dia => {
          const plan = dietaParaFecha(planes, dia)
          const inicio = !!plan && inicioDieta(plan) === dia
          const distintoMes = vista === 'mes' && dia.slice(0, 7) !== fecha.slice(0, 7)
          return <button key={dia} type="button" onClick={() => onFecha(dia)}
            aria-pressed={dia === fecha} aria-current={dia === hoy ? 'date' : undefined}
            aria-label={fechaDietaLegible(dia) + (inicio ? ', inicia ' + plan.nombre : plan ? ', con dieta' : ', sin dieta')}
            className={'nutria-agenda-cal-dia min-h-11 transition focus-visible:outline-2 focus-visible:outline-[#246b55] ' +
              (distintoMes ? 'opacity-60 ' : '') +
              (dia === fecha ? 'bg-[#246b55] font-bold text-white ' : plan ? 'bg-[#e8f4ec] text-[#246b55] hover:bg-[#d5ecdf] ' : 'bg-white text-[#607a6c] hover:bg-[#f2f7f4] ')}>
            <span className="nutria-agenda-cal-numero">{Number(dia.slice(-2))}</span>
            <span aria-hidden="true" className={'rounded-full ' + (inicio ? 'size-2.5' : 'size-1.5') +
              (plan ? ' bg-current' : ' invisible')}/>
          </button>
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#48685c]">
        <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#246b55]"/> Con dieta</span>
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#246b55]"/> Inicio de dieta</span>
      </div>
    </>}
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#edf6ee] px-3 py-2.5 text-sm text-[#246b55]">
      <span className="flex min-w-0 items-center gap-2 break-words"><Utensils size={16} className="shrink-0" aria-hidden="true"/>
        {planDia?.nombre || 'Sin dieta para este día'}
      </span>
      {!!planDia && <a href="#menu-del-dia" className="font-bold underline underline-offset-4">Ver menú</a>}
    </div>
    <label className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#48685c]">
      Ir a una fecha
      <input type="date" value={fecha} onChange={event => { if (event.target.value) onFecha(event.target.value) }}
        className="w-full max-w-44 rounded-xl border border-[#c9ddd3] bg-white px-2 py-1.5 text-sm text-[#173f34]"/>
    </label>
  </section>
}
