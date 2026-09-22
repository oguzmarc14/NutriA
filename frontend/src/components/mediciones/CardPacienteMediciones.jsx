import { Activity, ArrowRight, CalendarDays, Ruler, UserRound, Weight } from 'lucide-react'

function CardPacienteMediciones({ paciente, color, onClick, calcularEdad, obtenerInicial, obtenerSexo, formatearFecha }) {
  const edad = calcularEdad(paciente.birthDate)
  const ultimaMedicion = paciente.ultimaMedicion

  return (
    <article className={`group min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,107,85,0.14)] sm:p-5 ${color.borde}`}>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black sm:h-14 sm:w-14 sm:text-xl ${color.avatar}`}>{obtenerInicial(paciente.name)}</div>
        <div className="min-w-0 flex-1"><h2 className="line-clamp-2 [overflow-wrap:anywhere] text-base font-extrabold leading-tight text-[#173f34] sm:text-lg">{paciente.name}</h2><div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="flex min-w-0 items-center gap-1"><UserRound size={13} className="shrink-0" />{edad !== null ? `${edad} años` : 'Edad no registrada'}</span><span>{obtenerSexo(paciente.sex)}</span></div></div>
      </div>
      <div className="mt-5 grid min-w-0 grid-cols-3 gap-1.5 border-y border-[#edf2ef] py-4 sm:gap-3">
        <DatoMedicion icon={Weight} label="Peso" value={ultimaMedicion?.peso ? `${ultimaMedicion.peso} kg` : '—'} />
        <DatoMedicion icon={Ruler} label="Estatura" value={ultimaMedicion?.estatura ? `${ultimaMedicion.estatura} m` : '—'} />
        <DatoMedicion icon={Activity} label="IMC" value={ultimaMedicion?.imc ?? '—'} />
      </div>
      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-[#4d816f]" /><div className="min-w-0"><p className="text-[11px] text-slate-400">Última medición</p><p className="break-words text-xs font-bold text-[#48685c]">{ultimaMedicion?.fecha ? formatearFecha(ultimaMedicion.fecha) : 'Sin mediciones'}</p></div></div>
        <button type="button" onClick={onClick} className="flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-[#e5f2eb] px-3 py-2.5 text-sm font-extrabold text-[#246b55] transition group-hover:bg-[#246b55] group-hover:text-white sm:w-auto">Ver mediciones<ArrowRight size={16} className="shrink-0" /></button>
      </div>
    </article>
  )
}

function DatoMedicion({ icon: Icon, label, value }) {
  return <div className="min-w-0"><div className="mb-1 flex min-w-0 items-center gap-1 text-[#4d816f]"><Icon size={15} className="shrink-0" /><span className="truncate text-[11px] text-slate-400 sm:text-xs">{label}</span></div><p className="truncate text-sm font-extrabold text-[#173f34]">{value}</p></div>
}

export default CardPacienteMediciones
