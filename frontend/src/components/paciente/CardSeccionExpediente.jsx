function valorTexto(value) {
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  if (value === null || value === undefined || value === '') return 'Sin registro'
  return String(value)
}

function CardSeccionExpediente({ titulo, campos }) {
  return (
    <article className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.07)] md:p-6">
      <h2 className="text-lg font-extrabold text-[#173f34]">{titulo}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {campos.map(({ label, value }) => <div key={label} className="rounded-2xl bg-[#f2f7f4] p-4"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm font-bold text-[#29473e]">{valorTexto(value)}</p></div>)}
      </div>
    </article>
  )
}

export default CardSeccionExpediente
