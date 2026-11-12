import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { etiquetaHoraCita } from '../../utils/horariosCitas'
import {
  VISTAS_CITAS, fechaActualDispositivo, fechasDelRangoAgenda, formatearPeriodoAgenda,
  moverFocoAgenda, periodoNavegable, rangoVistaAgenda, sumarDiasAgenda,
} from '../../utils/vistasAgenda'
import './agenda.css'

const NOMBRE_VISTAS = { dia:'Día', semana:'Semana', mes:'Mes' }
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function rotuloFecha(iso, opciones = { weekday:'short', day:'numeric', month:'short' }) {
  return new Intl.DateTimeFormat('es-MX', { ...opciones, timeZone:'UTC' })
    .format(new Date(iso + 'T12:00:00Z'))
}

export default function SelectorCrearCita({
  vista, onVista, foco, onFoco, dias = [], hoy, seleccion, onSelect, zonaHoraria,
}) {
  const porFecha = new Map(dias.map(d => [d.fecha, d.espacios || []]))
  const rango = rangoVistaAgenda(vista, foco)
  const fechas = fechasDelRangoAgenda(rango)
  const horas = porFecha.get(foco) || []
  const fechaActual = hoy || fechaActualDispositivo()
  const anterior = moverFocoAgenda(vista, foco, -1)
  const siguiente = moverFocoAgenda(vista, foco, 1)
  const deshabilitadoAnterior = !periodoNavegable(vista, anterior, fechaActual)
  const deshabilitadoSiguiente = !periodoNavegable(vista, siguiente, fechaActual)

  function elegirDia(fecha) {
    if (fecha < fechaActual) return
    onFoco(fecha)
    if (seleccion?.fecha !== fecha) onSelect(null)
  }

  function cambiarVista(nueva) {
    if (!VISTAS_CITAS.includes(nueva) || nueva === vista) return
    onVista(nueva)
    onSelect(null)
  }

  function desplazar(pasos) {
    const destino = moverFocoAgenda(vista, foco, pasos)
    if (!periodoNavegable(vista, destino, fechaActual)) return
    onFoco(destino)
    onSelect(null)
  }

  function cardDia(fecha, compacta = false) {
    const disponibles = porFecha.get(fecha) || []
    const pasado = fecha < fechaActual
    const esOtroMes = vista === 'mes' && fecha.slice(0, 7) !== foco.slice(0, 7)
    const sinEspacios = disponibles.length === 0
    const marcado = fecha === foco
    return (
      <button key={fecha} type="button"
        onClick={() => elegirDia(fecha)}
        disabled={pasado || sinEspacios}
        aria-pressed={marcado}
        aria-label={rotuloFecha(fecha) + ': ' + disponibles.length + ' horarios disponibles'}
        className={'nutria-agenda-cal-dia nutria-agenda-slot ' +
          (compacta ? 'nutria-agenda-cal-dia--mes ' : 'nutria-agenda-cal-dia--semana ') +
          (esOtroMes ? 'nutria-agenda-cal-dia--fuera ' : '')}
      >
        {!compacta && <span className="nutria-agenda-cal-semana-nombre">
          {rotuloFecha(fecha, { weekday:'short' })}
        </span>}
        <span className="nutria-agenda-cal-numero">{Number(fecha.slice(-2))}</span>
        {sinEspacios ? <span className="nutria-agenda-cal-sin">—</span> :
          <span className="nutria-agenda-cal-total">{disponibles.length} libres</span>}
      </button>
    )
  }

  return (
    <div className="nutria-agenda-selector min-w-0 space-y-4">
      <div className="nutria-agenda-vistas" role="group" aria-label="Vista del calendario para crear cita">
        {VISTAS_CITAS.map(opcion => (
          <button key={opcion} type="button" aria-pressed={vista === opcion}
            onClick={() => cambiarVista(opcion)}
            className="nutria-agenda-vista-boton">
            {NOMBRE_VISTAS[opcion]}
          </button>
        ))}
      </div>

      <div className="nutria-agenda-navegacion">
        <div className="min-w-0">
          <p className="nutria-agenda-muted text-[11px] font-semibold uppercase tracking-wider">
            {vista === 'dia' ? 'Vista diaria' : vista === 'semana' ? 'Vista semanal' : 'Vista mensual'}
          </p>
          <h3 className="mt-1 break-words text-sm font-extrabold capitalize sm:text-base">
            {formatearPeriodoAgenda(vista, foco)}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="nutria-agenda-secondary nutria-agenda-navegar"
            disabled={deshabilitadoAnterior} onClick={() => desplazar(-1)}
            aria-label={vista === 'dia' ? 'Día anterior' : vista === 'semana' ? 'Semana anterior' : 'Mes anterior'}>
            <ChevronLeft size={19}/>
          </button>
          <button type="button" className="nutria-agenda-secondary nutria-agenda-hoy"
            onClick={() => { onFoco(fechaActual); onSelect(null) }}>
            Hoy
          </button>
          <button type="button" className="nutria-agenda-secondary nutria-agenda-navegar"
            disabled={deshabilitadoSiguiente} onClick={() => desplazar(1)}
            aria-label={vista === 'dia' ? 'Día siguiente' : vista === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}>
            <ChevronRight size={19}/>
          </button>
        </div>
      </div>

      {vista === 'semana' && (
        <div className="nutria-agenda-semana" role="group" aria-label="Seleccionar día de la semana">
          {fechas.map(fecha => cardDia(fecha))}
        </div>
      )}
      {vista === 'mes' && (
        <div className="nutria-agenda-mes" role="group" aria-label="Seleccionar fecha del mes">
          {DIAS_SEMANA.map((nombre, idx) => (
            <span key={idx} aria-hidden="true" className="nutria-agenda-mes-cabecera">{nombre}</span>
          ))}
          {fechas.map(fecha => cardDia(fecha, true))}
        </div>
      )}

      <section className="nutria-agenda-day min-w-0 max-w-full rounded-2xl border p-3 sm:p-4">
        <h3 className="mb-2 flex flex-wrap items-center gap-2 text-sm font-extrabold">
          <Clock3 size={16} aria-hidden="true"/>
          Horarios libres — {rotuloFecha(foco)}
        </h3>
        <p className="nutria-agenda-muted mb-3 break-words text-xs leading-5">
          Horario del consultorio: {zonaHoraria}. Cada cita dura 60 minutos.
        </p>
        {!horas.length ? (
          <div className="nutria-agenda-cal-vacio rounded-xl border p-4 text-center">
            <CalendarDays size={22} className="mx-auto mb-2 opacity-60"/>
            <p className="text-xs font-semibold">No hay horarios disponibles en esta fecha.</p>
            <p className="mt-1 text-[11px] opacity-75">
              {vista === 'dia' ? 'Utiliza las flechas para cambiar de día.' :
                'Selecciona otro día con espacios libres.'}
            </p>
          </div>
        ) : (
          <div className="nutria-agenda-horas" role="group" aria-label={'Horas disponibles para ' + rotuloFecha(foco)}>
            {horas.map(espacio => {
              const hora = etiquetaHoraCita(espacio, zonaHoraria)
              return (
                <button key={espacio.inicio} type="button"
                  onClick={() => onSelect({ ...espacio, hora, fecha: foco })}
                  aria-label={'Seleccionar cita a las ' + hora}
                  aria-pressed={seleccion?.inicio === espacio.inicio}
                  className="nutria-agenda-slot nutria-agenda-hora rounded-xl border transition">
                  <span className="nutria-agenda-hora-text">{hora}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
      <p className="nutria-agenda-muted text-[11px] leading-5">
        Sólo se muestran horarios permitidos por tu agenda. Los espacios ocupados no pueden seleccionarse.
      </p>
    </div>
  )
}
