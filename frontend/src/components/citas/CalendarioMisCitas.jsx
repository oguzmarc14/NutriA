import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { fechaCitaEnZona } from '../../utils/fechasMisCitas'
import { fechasDelRangoAgenda, formatearPeriodoAgenda, moverFocoAgenda, rangoVistaAgenda } from '../../utils/vistasAgenda'
import '../citas/agenda.css'

const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const fechaLegible = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeZone: 'UTC' })

export default function CalendarioMisCitas({ citas, fecha, hoy, zona, onFecha, renderCita }) {
  const porFecha = new Map()
  for (const cita of citas) {
    const dia = fechaCitaEnZona(cita.inicio, zona)
    if (!dia) continue
    if (!porFecha.has(dia)) porFecha.set(dia, [])
    porFecha.get(dia).push(cita)
  }
  const seleccionadas = [...(porFecha.get(fecha) || [])].sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
  return <section id="mi-calendario-de-citas" aria-labelledby="calendario-mis-citas" className="nutria-mis-citas-tarjeta min-w-0 scroll-mt-20 space-y-4 rounded-3xl border p-4 sm:p-5">
    <h2 id="calendario-mis-citas" className="flex items-center gap-2 text-lg font-extrabold">
      <CalendarDays size={20} aria-hidden="true"/>Calendario de citas
    </h2>
    <div className="nutria-agenda-navegacion">
      <h3 aria-live="polite" className="min-w-0 text-sm font-bold capitalize">{formatearPeriodoAgenda('mes', fecha)}</h3>
      <div className="flex shrink-0 gap-1">
        <button type="button" className="nutria-agenda-secondary nutria-agenda-navegar"
          aria-label="Mes anterior" onClick={() => onFecha(moverFocoAgenda('mes', fecha, -1))}>
          <ChevronLeft size={18} aria-hidden="true"/>
        </button>
        <button type="button" className="nutria-agenda-secondary nutria-agenda-hoy" onClick={() => onFecha(hoy)}>Hoy</button>
        <button type="button" className="nutria-agenda-secondary nutria-agenda-navegar"
          aria-label="Mes siguiente" onClick={() => onFecha(moverFocoAgenda('mes', fecha, 1))}>
          <ChevronRight size={18} aria-hidden="true"/>
        </button>
      </div>
    </div>
    <div className="nutria-agenda-mes" role="group" aria-label="Seleccionar fecha de consulta">
      {dias.map(dia => <span key={dia} aria-hidden="true" className="nutria-agenda-mes-cabecera">{dia}</span>)}
      {fechasDelRangoAgenda(rangoVistaAgenda('mes', fecha)).map(dia => {
        const cantidad = (porFecha.get(dia) || []).filter(cita => cita.estado !== 'cancelada').length
        return <button key={dia} type="button" onClick={() => onFecha(dia)}
          aria-pressed={dia === fecha} aria-current={dia === hoy ? 'date' : undefined}
          aria-label={fechaLegible.format(new Date(dia + 'T12:00:00Z')) + ', ' + (cantidad ? cantidad + (cantidad === 1 ? ' cita' : ' citas') : 'sin citas')}
          className={'nutria-agenda-cal-dia nutria-agenda-cal-dia--mes transition ' +
            (dia.slice(0, 7) === fecha.slice(0, 7) ? '' : 'opacity-55 ') +
            (dia === fecha ? 'bg-[#246b55] text-white' : cantidad ? 'bg-[#dff0e4] text-[#246b55]' : 'bg-white text-[#607a6c]')}>
          <span className="nutria-agenda-cal-numero">{Number(dia.slice(-2))}</span>
          <span aria-hidden="true" className={'size-1.5 rounded-full bg-current ' + (cantidad ? '' : 'invisible')}/>
        </button>
      })}
    </div>
    <div className="space-y-2 border-t border-[#c9ddd3] pt-3">
      <h3 aria-live="polite" className="text-sm font-extrabold capitalize">{fechaLegible.format(new Date(fecha + 'T12:00:00Z'))}</h3>
      {seleccionadas.length ? seleccionadas.map(renderCita) : <p className="text-sm opacity-75">No tienes citas para este día.</p>}
    </div>
  </section>
}
