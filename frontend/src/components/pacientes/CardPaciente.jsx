import { CalendarDays, CheckCircle2, ClipboardPlus, Mail, MoreHorizontal, Pencil, Phone, Play, RefreshCw, Trash2, ArrowUpRight, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

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
  const [menuAbierto, setMenuAbierto] = useState(false)
  const edad = calcularEdad(paciente.birthDate)
  const nacimiento = paciente.birthDate
    ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(paciente.birthDate))
    : 'Sin registrar'
  return (
    <article className="group relative isolate min-w-0 overflow-hidden rounded-[30px] border border-white/90 bg-gradient-to-br from-[#fffdfa] via-[#fff9f5] to-[#fcebe2] p-4 shadow-[0_20px_40px_-20px_rgba(99,55,39,.32),0_8px_20px_-14px_rgba(38,98,77,.18)] ring-1 ring-[#f2dfd5]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_48px_-18px_rgba(99,55,39,.32)] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-[#f5c8b5]/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-[#d9e9dc]/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-5 top-16 rotate-[-28deg] text-[#eebca6]/45"><Leaf size={90} strokeWidth={0.65}/></div>

      <div className="relative flex min-w-0 items-start gap-3">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border-[4px] border-[#fff7f2] bg-gradient-to-br from-[#efc1aa] via-[#f8dfcf] to-[#dcebe1] text-2xl font-black text-[#205e4d] shadow-[0_8px_18px_rgba(146,88,61,.17)]">
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
        <div className="relative z-10">
          <button type="button" onClick={() => setMenuAbierto(!menuAbierto)} aria-expanded={menuAbierto} aria-label={`Opciones de ${paciente.name}`} className="grid h-9 w-9 place-items-center rounded-2xl border border-white bg-white/75 text-[#285c4e] shadow-sm transition hover:bg-white"><MoreHorizontal size={20}/></button>
          {menuAbierto && (
            <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-2xl border border-[#eedbd1] bg-white p-1.5 shadow-xl">
              <button type="button" onClick={() => {setMenuAbierto(false);onEditar()}} disabled={eliminando} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#255f4f] hover:bg-[#edf5ef]"><Pencil size={14}/> Editar</button>
              <button type="button" onClick={() => {setMenuAbierto(false);onEliminar()}} disabled={eliminando} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14}/> Eliminar</button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 rounded-[22px] border border-white/90 bg-white/65 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_6px_16px_-14px_rgba(65,56,48,.35)]">
        <DatoPaciente icon={Mail} label="Correo" value={paciente.email || 'Sin correo registrado'} />
        <div className="grid gap-3 sm:grid-cols-2">
          <DatoPaciente icon={Phone} label="Teléfono" value={paciente.phone || 'Sin registrar'} accent />
          <DatoPaciente icon={CalendarDays} label="Nacimiento" value={nacimiento} />
        </div>
      </div>

      {paciente.notes && (
        <div className="relative mt-3 flex gap-3 rounded-[20px] border border-[#f7dfd2] bg-gradient-to-r from-[#fce9df] to-[#fff4ed] p-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/65 text-[#bd6e51]"><ArrowUpRight size={19}/></div>
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

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onTrabajar} className={`col-span-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3c806c] bg-gradient-to-r from-[#27775f] via-[#185e4c] to-[#104a3e] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_15px_-6px_rgba(24,94,76,.6),inset_0_1px_0_rgba(255,255,255,.2)] transition hover:brightness-110 active:scale-[.99]`}>
          <Play size={16} fill="currentColor"/> {trabajando ? 'Paciente en trabajo' : 'Trabajar con paciente'} <ArrowUpRight size={16}/>
        </button>
        <Link to={`/pacientes/${paciente._id}/expediente`} className="flex items-center justify-center gap-2 rounded-2xl border border-[#eecdbf] bg-white/80 px-2 py-3 text-xs font-extrabold text-[#214e44] shadow-[0_5px_12px_-10px_rgba(71,50,40,.5)] transition hover:bg-white"><ClipboardPlus size={16}/> Expediente</Link>
        <button type="button" onClick={onEditar} disabled={eliminando} className="flex items-center justify-center gap-2 rounded-2xl border border-[#eecdbf] bg-white/80 px-2 py-3 text-xs font-extrabold text-[#214e44] shadow-[0_5px_12px_-10px_rgba(71,50,40,.5)] transition hover:bg-white disabled:opacity-50"><Pencil size={15}/> Editar</button>
      </div>
    </article>
  )
}
export default CardPaciente
