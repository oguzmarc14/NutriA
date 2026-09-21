import { CalendarDays, CheckCircle2, ClipboardPlus, Mail, Pencil, Phone, RefreshCw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function DatoPaciente({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#edf5f1] text-[#4d816f]"><Icon size={14} /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="break-words text-sm font-semibold leading-5 text-[#405b51]">{value}</p>
      </div>
    </div>
  )
}

function CardPaciente({ paciente, onEditar, onEliminar, obtenerSexo, calcularEdad, obtenerInicial, onReenviar, reenviando, eliminando }) {
  const edad = calcularEdad(paciente.birthDate)

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_17px_38px_rgba(36,107,85,0.12)] sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e3f1ea] text-base font-black text-[#246b55] sm:h-13 sm:w-13">{obtenerInicial(paciente.name)}</div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-extrabold leading-5 text-[#173f34]">{paciente.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
            {edad !== null && <span>{edad} años</span>}
            <span>{obtenerSexo(paciente.sex)}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onEditar} disabled={eliminando} className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf5f1] text-[#246b55] transition hover:bg-[#dcece5] disabled:opacity-50" aria-label={`Editar ${paciente.name}`}><Pencil size={16} /></button>
          <button type="button" onClick={onEliminar} disabled={eliminando} className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50" aria-label={`Eliminar ${paciente.name}`}><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-y border-[#edf2ef] py-4">
        <DatoPaciente icon={Mail} label="Correo" value={paciente.email || 'Sin correo registrado'} />
        <DatoPaciente icon={Phone} label="Teléfono" value={paciente.phone || 'Sin registrar'} />
        {paciente.birthDate && <DatoPaciente icon={CalendarDays} label="Fecha de nacimiento" value={new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(paciente.birthDate))} />}
      </div>

      {paciente.accountStatus === 'pending' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-800">Invitación pendiente</p>
          <button type="button" onClick={onReenviar} disabled={reenviando} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#246b55] disabled:opacity-50">
            <RefreshCw size={13} className={reenviando ? 'animate-spin' : ''} />
            {reenviando ? 'Enviando...' : 'Reenviar invitación'}
          </button>
        </div>
      )}

      {paciente.accountStatus === 'active' && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} />Cliente registrado</p>
          <p className="mt-1 text-xs text-emerald-700">Ya puede iniciar sesion con su correo.</p>
        </div>
      )}

      {paciente.notes && <div className="mt-4 rounded-xl bg-[#f8faf9] p-3"><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#83958d]">Notas</p><p className="break-words text-sm leading-5 text-slate-600">{paciente.notes}</p></div>}
      <div className="mt-4"><Link to={`/pacientes/${paciente._id}/expediente`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-3 text-sm font-extrabold text-[#246b55] transition hover:bg-[#246b55] hover:text-white"><ClipboardPlus size={17} className="shrink-0" />Expediente</Link></div>
    </article>
  )
}

export default CardPaciente
