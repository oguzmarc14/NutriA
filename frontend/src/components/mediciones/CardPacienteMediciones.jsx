import { Activity, ArrowRight, CalendarDays, Ruler, UserRound, Weight } from 'lucide-react'

function CardPacienteMediciones({ paciente, color, onClick, calcularEdad, obtenerInicial, obtenerSexo, formatearFecha }) {
  const edad = calcularEdad(paciente.birthDate)
  const ultimaMedicion = paciente.ultimaMedicion

  return (
    <article className={`group rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,107,85,0.14)] ${color.borde}`}>
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black ${color.avatar}`}>{obtenerInicial(paciente.name)}</div>
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-extrabold text-[#173f34]">{paciente.name}</h2><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1"><UserRound size={13} />{edad !== null ? `${edad} años` : 'Edad no registrada'}</span><span>{obtenerSexo(paciente.sex)}</span></div></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#edf2ef] py-4">
        <DatoMedicion icon={Weight} label="Peso" value={ultimaMedicion?.peso ? `${ultimaMedicion.peso} kg` : '—'} />
        <DatoMedicion icon={Ruler} label="Estatura" value={ultimaMedicion?.estatura ? `${ultimaMedicion.estatura} m` : '—'} />
        <DatoMedicion icon={Activity} label="IMC" value={ultimaMedicion?.imc ?? '—'} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 text-[#4d816f]" /><div><p className="text-[11px] text-slate-400">Última medición</p><p className="text-xs font-bold text-[#48685c]">{ultimaMedicion?.fecha ? formatearFecha(ultimaMedicion.fecha) : 'Sin mediciones'}</p></div></div>
        <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-2.5 text-sm font-extrabold text-[#246b55] transition group-hover:bg-[#246b55] group-hover:text-white">Ver mediciones<ArrowRight size={16} /></button>
      </div>
    </article>
  )
}

function DatoMedicion({ icon: Icon, label, value }) {
  return <div><div className="mb-1 flex items-center gap-1.5 text-[#4d816f]"><Icon size={16} /><span className="text-xs text-slate-400">{label}</span></div><p className="text-sm font-extrabold text-[#173f34]">{value}</p></div>
}

export default CardPacienteMediciones
