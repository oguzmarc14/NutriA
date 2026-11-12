import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import { etiquetaHoraCita } from '../../utils/horariosCitas'
import './agenda.css'

function formatearDia(iso) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(iso + 'T12:00:00Z'))
}

export default function SelectorDisponibilidad({ dias = [], seleccion, onSelect, zonaHoraria }) {
  const activos = useMemo(
    () => dias.filter(d => Array.isArray(d.espacios) && d.espacios.length > 0),
    [dias],
  )
  const [dia, setDia] = useState(null)

  useEffect(() => {
    if (activos.length && !activos.some(d => d.fecha === dia)) setDia(activos[0].fecha)
    if (!activos.length) setDia(null)
  }, [activos, dia])

  useEffect(() => {
    if (!seleccion) return
    const encontrado = activos.find(d => d.espacios.some(h => h.inicio === seleccion.inicio))
    if (encontrado) setDia(encontrado.fecha)
  }, [seleccion, activos])

  const actual = activos.find(d => d.fecha === dia)

  if (!activos.length) return (
    <div className="nutria-agenda-day min-w-0 rounded-2xl border p-5 text-center">
      <CalendarDays size={28} className="mx-auto mb-2 opacity-60"/>
      <p className="text-sm font-bold">No hay espacios disponibles en este periodo.</p>
      <p className="mt-1 text-xs opacity-75">Prueba otra fecha o contacta al consultorio.</p>
    </div>
  )

  return (
    <div className="nutria-agenda-selector space-y-4">
      <section className="min-w-0 max-w-full">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold">
          <CalendarDays size={16} aria-hidden="true"/>Selecciona un día
        </h3>
        <div className="nutria-agenda-dias flex gap-2 pb-2" role="group" aria-label="Días disponibles">
          {activos.map(d => (
            <button key={d.fecha} type="button"
              onClick={() => { setDia(d.fecha); onSelect(null) }}
              aria-pressed={dia === d.fecha}
              className="nutria-agenda-slot nutria-agenda-date-button min-h-16 min-w-[112px] shrink-0 rounded-xl border px-3 py-2 text-center text-xs font-bold transition">
              <span className="block capitalize">{formatearDia(d.fecha)}</span>
              <span className="mt-1 block text-[10px] opacity-75">
                {d.espacios.length} {d.espacios.length === 1 ? 'espacio' : 'espacios'}
              </span>
            </button>
          ))}
        </div>
        <p className="nutria-agenda-muted mt-1 text-[11px] sm:hidden">
          Desliza hacia los lados para ver más fechas.
        </p>
      </section>

      {actual && (
        <section className="nutria-agenda-day min-w-0 max-w-full rounded-2xl border p-3 sm:p-4">
          <h3 className="mb-2 flex flex-wrap items-center gap-2 text-sm font-extrabold">
            <Clock3 size={16} aria-hidden="true"/>
            Horas libres — {formatearDia(actual.fecha)}
          </h3>
          <p className="nutria-agenda-muted mb-3 break-words text-xs leading-5">
            Horario del consultorio: {zonaHoraria}. Cada consulta dura una hora.
          </p>
          <div className="nutria-agenda-horas" role="group" aria-label={'Horarios disponibles para ' + formatearDia(actual.fecha)}>
            {actual.espacios.map(espacio => {
              const hora = etiquetaHoraCita(espacio, zonaHoraria)
              return (
                <button key={espacio.inicio} type="button"
                  onClick={() => onSelect({ ...espacio, hora, fecha: actual.fecha })}
                  aria-label={'Seleccionar cita a las ' + hora}
                  aria-pressed={seleccion?.inicio === espacio.inicio}
                  className="nutria-agenda-slot nutria-agenda-hora rounded-xl border transition">
                  <span className="nutria-agenda-hora-text">{hora}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
