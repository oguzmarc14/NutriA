function CardDatoPaciente({ icono: Icono, label, value }) {
  return (
    <article className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_28px_rgba(32,78,64,0.06)]">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2eb] text-[#246b55]"><Icono size={19} /></div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words font-extrabold text-[#173f34]">{value || 'Sin registro'}</p>
    </article>
  )
}

export default CardDatoPaciente
