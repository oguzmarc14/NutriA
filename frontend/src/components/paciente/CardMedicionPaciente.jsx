import { Activity, CalendarDays, Ruler, Weight } from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))
}

function DatoMedicion({ icono: Icono, label, value }) {
  return <div><div className="mb-1 flex items-center gap-1.5 text-[#4d816f]"><Icono size={16} /><span className="text-xs text-slate-400">{label}</span></div><p className="text-sm font-extrabold text-[#173f34]">{value}</p></div>
}

function CardMedicionPaciente({ medicion, numero }) {
  return (
    <article className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#48685c]"><CalendarDays size={17} />{formatearFecha(medicion.fecha || medicion.createdAt)}</div>
      <div className="grid grid-cols-3 gap-3 border-y border-[#edf2ef] py-4">
        <DatoMedicion icono={Weight} label="Peso" value={`${numero(medicion.peso)} kg`} />
        <DatoMedicion icono={Ruler} label="Estatura" value={`${numero(medicion.estatura)} m`} />
        <DatoMedicion icono={Activity} label="IMC" value={numero(medicion.imc)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
        <p>Grasa: <strong className="text-[#173f34]">{medicion.grasaCorporal ?? '—'}%</strong></p>
        <p>Musculo: <strong className="text-[#173f34]">{medicion.masaMuscular ?? '—'} kg</strong></p>
        <p>Grasa visceral: <strong className="text-[#173f34]">{medicion.grasaVisceral ?? '—'}</strong></p>
        <p>Edad: <strong className="text-[#173f34]">{medicion.edad ?? '—'}</strong></p>
      </div>
    </article>
  )
}

export default CardMedicionPaciente
