import { CheckCircle2, Pencil, RefreshCw, Trash2, ArrowUpRight, BriefcaseMedical, Leaf, MessageCircle, CalendarDays, CalendarClock, Activity, TrendingDown } from 'lucide-react'

function enlaceWhatsApp(telefono) {
  const numero = String(telefono || '').replace(/\D/g, '')
  if (numero.length === 10) return `https://wa.me/52${numero}`
  if (numero.length >= 11 && numero.length <= 15) return `https://wa.me/${numero}`
  return null
}

function CardPaciente({ paciente, onEditar, onEliminar, onTrabajar, trabajando, obtenerSexo, calcularEdad, obtenerInicial, onReenviar, reenviando, eliminando }) {
  const edad = calcularEdad(paciente.birthDate)
  const whatsapp = enlaceWhatsApp(paciente.phone)
  const mediciones = Array.isArray(paciente.mediciones) ? paciente.mediciones : []
  const ordenadas = [...mediciones].filter(m => m && (m.fecha || m.createdAt)).sort((a,b) => new Date(a.fecha || a.createdAt) - new Date(b.fecha || b.createdAt))
  const ultima = ordenadas.at(-1)
  const primera = ordenadas[0]
  const peso = Number(ultima?.peso ?? ultima?.weight ?? paciente.ultimaMedicion?.peso ?? paciente.pesoActual)
  const pesoValido = Number.isFinite(peso) && peso > 0
  const inicial = Number(primera?.peso ?? primera?.weight)
  const cambio = pesoValido && Number.isFinite(inicial) && inicial > 0 && ordenadas.length > 1 ? peso - inicial : null
  const altura = Number(ultima?.altura ?? ultima?.estatura ?? paciente.ultimaMedicion?.altura ?? paciente.ultimaMedicion?.estatura)
  const metros = altura > 3 ? altura / 100 : altura
  const imc = pesoValido && metros > 0 && metros < 3 ? peso / (metros * metros) : null
  const fechaCorta = valor => {
    if (!valor) return null
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? null : new Intl.DateTimeFormat('es-MX', {day:'numeric',month:'short',year:'numeric'}).format(fecha)
  }
  const indicadores = [
    {titulo:'Cambio de peso', valor:cambio === null ? 'Sin mediciones' : `${cambio > 0 ? '+' : ''}${cambio.toFixed(1)} kg`, detalle:'Desde la primera medición', Icono:TrendingDown},
    {titulo:'Última consulta', valor:fechaCorta(paciente.ultimaConsulta?.fecha ?? paciente.fechaUltimaConsulta) || 'Sin registrar', detalle:'Última atención', Icono:CalendarDays},
    {titulo:'IMC actual', valor:imc === null ? 'Sin medición' : imc.toFixed(1), detalle:'Según última medición', Icono:Activity},
    {titulo:'Próxima consulta', valor:fechaCorta(paciente.proximaConsulta?.fecha ?? paciente.fechaProximaConsulta) || 'Por programar', detalle:'Agenda del paciente', Icono:CalendarClock},
  ]

  return (
    <article className={`group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border bg-[#f6f8f3] p-4 shadow-[0_10px_25px_-18px_rgba(25,70,55,.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-17px_rgba(25,70,55,.3)] sm:p-5 ${trabajando ? 'border-[#216a50] ring-[3px] ring-[#368464] shadow-[0_12px_32px_-14px_rgba(22,92,67,.38)]' : 'border-[#e0e8df] hover:border-[#b9d8c8]'}`}>
      <div className="relative flex min-w-0 items-start gap-3">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-white bg-[#dcece0] text-xl font-black text-[#205e4d]">
          {obtenerInicial(paciente.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[16px] font-extrabold leading-snug tracking-tight text-[#123c36]">{paciente.name}</h2>
          <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${paciente.accountStatus === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-[#d6e9dd] bg-[#e1f0e6] text-[#23694f]'}`}>
            <Leaf size={12} /> {paciente.accountStatus === 'pending' ? 'Invitación pendiente' : 'Paciente registrado'}
          </span>
          <p className="mt-1.5 text-xs font-medium text-[#77848a]">{edad !== null ? `${edad} años · ` : ''}{obtenerSexo(paciente.sex)}{pesoValido ? ` · ${peso.toFixed(1)} kg` : ''}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[#e1e9e1] bg-[#f9fbf8] p-1">
          <button type="button" onClick={onEditar} disabled={eliminando} title="Editar paciente" aria-label={`Editar a ${paciente.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#23614e] transition hover:bg-[#e4f1e8] disabled:opacity-50"><Pencil size={15}/></button>
          <button type="button" onClick={onEliminar} disabled={eliminando} title="Eliminar paciente" aria-label={`Eliminar a ${paciente.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#c65a59] transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={15}/></button>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        {indicadores.map(({titulo,valor,detalle,Icono}) => (
          <div key={titulo} className="min-w-0 rounded-2xl border border-[#d9e5dc] bg-[#f0f5ef] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#728c7d]"><Icono size={13} className="shrink-0"/>{titulo}</p>
            <p className="mt-1.5 break-words text-[15px] font-extrabold text-[#20523e]">{valor}</p>
            <p className="mt-1 text-[10px] leading-snug text-[#819188]">{detalle}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-3 min-h-[72px] rounded-2xl border border-[#f0d7ca] bg-[#f9eae1] p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#b16d51]">Objetivo nutricional / notas</p>
        <p className="mt-1 line-clamp-2 break-words text-xs font-semibold leading-relaxed text-[#38524c]">{paciente.notes || 'Sin notas registradas'}</p>
      </div>
      {paciente.accountStatus === 'pending' && (
        <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-900">Invitación sin aceptar</p>
            <p className="mt-0.5 text-[11px] text-amber-800">El paciente aún no activa su cuenta.</p>
          </div>
          <button type="button" onClick={onReenviar} disabled={reenviando} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={14} className={reenviando ? 'animate-spin' : ''}/> {reenviando ? 'Enviando...' : 'Reenviar invitación'}
          </button>
        </div>
      )}
      <div className="relative mt-auto flex items-stretch gap-2 pt-4">
        <button type="button" onClick={onTrabajar} aria-label={trabajando ? `Continuar trabajando con ${paciente.name}` : `Trabajar con ${paciente.name}`} className={`inline-flex min-h-[46px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-2.5 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245e49] sm:px-3 ${trabajando ? 'border-[#226b50] bg-[#277557] text-white shadow-[0_4px_12px_-6px_rgba(22,92,67,.55)] hover:bg-[#1c6148]' : 'border-[#b4d4bf] bg-[#cfe5d5] text-[#245e49] hover:border-[#8fbea3] hover:bg-[#bfddc8]'}`>
          <BriefcaseMedical size={17} className="shrink-0"/>
          <span className="text-center">{trabajando ? 'Continuar trabajando' : 'Trabajar con paciente'}</span>
          {trabajando ? <CheckCircle2 size={16} className="shrink-0"/> : <ArrowUpRight size={16} className="shrink-0"/>}
        </button>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" title="Enviar mensaje por WhatsApp" aria-label={`Enviar mensaje por WhatsApp a ${paciente.name}`} className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl border border-[#c8e3d0] bg-[#e7f5ea] text-[#287b50] transition hover:border-[#a4d1b3] hover:bg-[#d8efdf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#287b50]">
            <MessageCircle size={21}/>
          </a>
        ) : (
          <button type="button" disabled title="Agrega un teléfono válido para usar WhatsApp" aria-label="WhatsApp no disponible: falta un teléfono válido" className="grid h-[46px] w-[46px] shrink-0 cursor-not-allowed place-items-center rounded-xl border border-[#dce5dd] bg-[#edf1ed] text-[#a2afa5]"><MessageCircle size={21}/></button>
        )}
      </div>
    </article>
  )
}

export default CardPaciente
