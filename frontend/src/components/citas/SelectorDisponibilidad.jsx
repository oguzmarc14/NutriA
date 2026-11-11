import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import './agenda.css'

function formatearDia(iso) {
  return new Intl.DateTimeFormat('es-MX', { weekday:'short', day:'numeric', month:'short', timeZone:'UTC' })
    .format(new Date(iso + 'T12:00:00Z'))
}
export default function SelectorDisponibilidad({ dias = [], seleccion, onSelect, zonaHoraria }) {
  // Días sin atención o sin horas libres no se muestran como opciones activas.
  const activos = useMemo(()=>dias.filter(d=>Array.isArray(d.espacios)&&d.espacios.length),[dias])
  const [dia,setDia]=useState(null)

  useEffect(()=>{
    if(activos.length && !activos.some(d=>d.fecha===dia))setDia(activos[0].fecha)
    if(!activos.length)setDia(null)
  },[activos,dia])

  useEffect(()=>{
    if(seleccion) {
      const elegido=activos.find(d=>d.espacios.some(x=>x.inicio===seleccion.inicio))
      if(elegido)setDia(elegido.fecha)
    }
  },[seleccion,activos])

  const actual=activos.find(d=>d.fecha===dia)
  if(!activos.length)return <div className="nutria-agenda-day rounded-2xl border p-5 text-center">
    <CalendarDays size={28} className="mx-auto mb-2 opacity-60"/>
    <p className="text-sm font-bold">No hay espacios disponibles en este periodo.</p>
    <p className="mt-1 text-xs opacity-75">Prueba otra fecha o contacta al consultorio.</p>
  </div>

  return <div className="space-y-4">
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold"><CalendarDays size={16}/>Selecciona un día</h3>
      <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Días disponibles">
        {activos.map(d=><button key={d.fecha} type="button" onClick={()=>{setDia(d.fecha);onSelect(null)}}
          aria-pressed={dia===d.fecha}
          className="nutria-agenda-slot min-h-16 min-w-[112px] shrink-0 rounded-xl border px-3 py-2 text-center text-xs font-bold transition">
          <span className="block capitalize">{formatearDia(d.fecha)}</span>
          <span className="mt-1 block text-[10px] opacity-75">{d.espacios.length} {d.espacios.length===1?'espacio':'espacios'}</span>
        </button>)}
      </div>
    </div>
    {actual && <div className="nutria-agenda-day rounded-2xl border p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Clock3 size={16}/>Horas libres — {formatearDia(actual.fecha)}</h3>
      <p className="mb-3 text-xs opacity-75">Horario del consultorio: {zonaHoraria}. Cada consulta dura una hora.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {actual.espacios.map(espacio=><button type="button" key={espacio.inicio}
          onClick={()=>onSelect({...espacio,fecha:actual.fecha})}
          aria-pressed={seleccion?.inicio===espacio.inicio}
          className="nutria-agenda-slot min-h-11 rounded-xl border p-2 text-sm font-extrabold transition">
          {espacio.hora}
        </button>)}
      </div>
    </div>}
  </div>
}
