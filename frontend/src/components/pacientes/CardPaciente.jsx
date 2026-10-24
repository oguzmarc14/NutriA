import { CalendarDays, CheckCircle2, Mail, Pencil, Phone, RefreshCw, Trash2, ArrowUpRight, BriefcaseMedical, Leaf } from 'lucide-react'

function DatoPaciente({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,.9)] ${accent ? 'bg-[#fbe8df] text-[#b66a4f]' : 'bg-[#e7f1e9] text-[#25644f]'}`}>
        <Icon size={17} strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#85929a]">{label}</p>
        <p className="break-all text-xs font-bold text-[#173e38] sm:text-sm">{value}</p>
      </div>
    </div>
  )
}

function CardPaciente({ paciente, onEditar, onEliminar, onTrabajar, trabajando, obtenerSexo, calcularEdad, obtenerInicial, onReenviar, reenviando, eliminando }) {
  const edad = calcularEdad(paciente.birthDate)
  const nacimiento = paciente.birthDate
    ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(paciente.birthDate))
    : 'Sin registrar'
  return (
    <article className={`group relative isolate flex h-full min-h-[390px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#e3e8e1] bg-[#f6f8f3] ${trabajando ? "ring-2 ring-[#39b985] border-[#39b985]" : ""} p-4 shadow-[0_10px_25px_-18px_rgba(25,70,55,.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9d8c8] hover:shadow-[0_16px_28px_-17px_rgba(25,70,55,.3)] sm:p-5`}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[#e9f2e8]" />

      <div className="relative flex min-w-0 items-start gap-3">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border-[3px] border-white bg-[#dcece0] text-2xl font-black text-[#205e4d] shadow-[0_8px_18px_rgba(146,88,61,.17)]">
          {obtenerInicial(paciente.name)}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white bg-[#238367]" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="break-words text-[17px] font-extrabold leading-tight tracking-tight text-[#123c36]">{paciente.name}</h2>
          <p className="mt-1 text-xs font-medium text-[#77848a]">{edad !== null ? `${edad} años · ` : ''}{obtenerSexo(paciente.sex)}</p>
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#d6e9dd] bg-[#e1f0e6]/90 px-2.5 py-1 text-[11px] font-bold text-[#23694f]">
            <Leaf size={12} /> {trabajando ? 'En trabajo' : paciente.accountStatus === 'pending' ? 'Invitación pendiente' : 'Paciente registrado'}
          </div>
        </div>
        <div className="relative z-10 flex w-[112px] shrink-0 flex-col items-stretch">
          <div className="flex items-center justify-between rounded-2xl border border-[#e1e9e1] bg-[#f9fbf8] p-1 shadow-sm">
            <button type="button" onClick={onEditar} disabled={eliminando} title="Editar paciente" aria-label={`Editar a ${paciente.name}`} className="grid h-8 w-8 place-items-center rounded-xl text-[#23614e] transition hover:bg-[#e4f1e8] disabled:opacity-50"><Pencil size={16}/></button>
            <button type="button" onClick={onEliminar} disabled={eliminando} title="Eliminar paciente" aria-label={`Eliminar a ${paciente.name}`} className="grid h-8 w-8 place-items-center rounded-xl text-[#c65a59] transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={16}/></button>
          </div>
        <div className="mt-2 w-full">
        <button type="button" onClick={onTrabajar} aria-label={trabajando ? `Continuar trabajando con ${paciente.name}` : `Trabajar con ${paciente.name}`} className={`group/action flex w-full min-h-10 items-stretch justify-between overflow-hidden rounded-xl border text-sm font-bold shadow-[0_5px_12px_-7px_rgba(18,107,82,.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-7px_rgba(18,107,82,.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#126b52] ${trabajando ? 'border-[#4abf8d] bg-[#dcf5e6] text-[#126b52]' : 'border-[#126b52] bg-[#126b52] text-white'}`}>
          <span className="inline-flex min-w-0 items-center gap-1.5 px-2 py-2">
            <BriefcaseMedical size={17} strokeWidth={2.1}/>
            {trabajando ? 'En trabajo' : 'Trabajar'}
          </span>
          <span className={`inline-flex w-8 shrink-0 items-center justify-center border-l transition-colors ${trabajando ? 'border-[#a7dec3] bg-[#c8eed9] group-hover/action:bg-[#b5e7cd]' : 'border-white/15 bg-[#0b543f] group-hover/action:bg-[#084631]'}`}>
            {trabajando ? <CheckCircle2 size={17}/> : <ArrowUpRight size={18}/>}
          </span>
        </button>
      </div>

        </div>
      </div>

      <div className="relative mt-5 grid gap-3 rounded-[20px] border border-[#d9e5dc] bg-[#f0f5ef] p-3.5">
        <DatoPaciente icon={Mail} label="Correo" value={paciente.email || 'Sin correo registrado'} />
        <div className="grid gap-3 sm:grid-cols-2">
          <DatoPaciente icon={Phone} label="Teléfono" value={paciente.phone || 'Sin registrar'} accent />
          <DatoPaciente icon={CalendarDays} label="Nacimiento" value={nacimiento} />
        </div>
      </div>

      {paciente.notes && (
        <div className="relative mt-3 flex gap-3 rounded-[20px] border border-[#f0d7ca] bg-[#f9eae1] p-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fbeee7] text-[#bd6e51]"><ArrowUpRight size={19}/></div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#b16d51]">Notas / objetivo</p>
            <p className="mt-1 line-clamp-3 break-words text-xs font-semibold leading-relaxed text-[#38524c]">{paciente.notes}</p>
          </div>
        </div>
      )}

      {paciente.accountStatus === 'pending' && (
        <div className="relative mt-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-3">
          <p className="text-xs font-bold text-amber-800">Invitación pendiente</p>
          <button type="button" onClick={onReenviar} disabled={reenviando} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#246b55] disabled:opacity-50">
            <RefreshCw size={13} className={reenviando ? 'animate-spin' : ''} /> {reenviando ? 'Enviando...' : 'Reenviar invitación'}
          </button>
        </div>
      )}
      {paciente.accountStatus === 'active' && (
        <p className="relative mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#47846d]"><CheckCircle2 size={13}/> Cuenta de paciente activa</p>
      )}

    </article>
  )
}
export default CardPaciente
