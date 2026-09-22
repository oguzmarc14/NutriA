function CardResumenPaciente({ icono: Icono, etiqueta, valor, detalle, tono = 'verde', valorClassName = 'text-2xl' }) {
  const tonos = {
    verde: 'bg-[#e5f2ec] text-[#26735f]',
    arena: 'bg-[#f5eddd] text-[#956c38]',
    azul: 'bg-[#e8f0f6] text-[#52758d]',
  }

  return (
    <article className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)]">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${tonos[tono]}`}>
        <Icono size={21} />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{etiqueta}</p>
      {Array.isArray(valor) ? (
        <div className={`mt-2 flex flex-wrap gap-2 ${valorClassName}`}>
          {valor.map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#e5f2ec] px-3 py-1.5 text-sm font-bold text-[#26735f]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className={`mt-1 font-extrabold text-[#173f34] ${valorClassName}`}>
          {valor}
        </p>
      )}
      <p className="mt-1 text-sm text-slate-500">{detalle}</p>
    </article>
  )
}

export default CardResumenPaciente
