import { CalendarDays, MessageCircle, ThumbsDown, ThumbsUp, Utensils } from 'lucide-react'

const estados = {
  completada: { label: 'Completada', clase: 'bg-[#e1f0e7] text-[#246b55]' },
  parcial: { label: 'Parcial', clase: 'bg-[#f7ecd9] text-[#936b35]' },
  omitida: { label: 'No realizada', clase: 'bg-[#f9e6e3] text-[#a55249]' },
}

function HistorialSeguimientoComidas({ registros = [] }) {
  return (
    <section className="mt-5 rounded-3xl border border-[#cbded4] bg-white/75 p-4 sm:p-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d816f]">Actividad alimenticia</p><h2 className="mt-1 text-xl font-black text-[#173f34]">Seguimiento de comidas</h2></div>
      {registros.length ? <div className="mt-4 space-y-3">{registros.map((registro) => {
        const estado = estados[registro.estado] || estados.parcial
        return <article key={registro._id} className="min-w-0 rounded-2xl border border-[#e0e9e4] bg-white p-4"><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2 text-xs font-bold text-[#6e8d80]"><CalendarDays size={14} />{registro.fecha}</div><h3 className="mt-1 break-words font-extrabold text-[#173f34]">{registro.platillo || registro.nombreComida}</h3><p className="mt-0.5 text-xs text-slate-500">{registro.nombreComida}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estado.clase}`}>{estado.label}</span><span className="inline-flex items-center gap-1 rounded-full bg-[#f2f5f3] px-3 py-1 text-xs font-bold text-[#52665e]">{registro.agrado === 'gusto' ? <ThumbsUp size={13} /> : registro.agrado === 'no_gusto' ? <ThumbsDown size={13} /> : <Utensils size={13} />}{registro.agrado === 'gusto' ? 'Le gusto' : registro.agrado === 'no_gusto' ? 'No le gusto' : 'Neutral'}</span></div></div>{registro.comentario && <p className="mt-3 flex min-w-0 items-start gap-2 rounded-xl bg-[#f7faf8] p-3 text-sm text-slate-600"><MessageCircle size={15} className="mt-0.5 shrink-0 text-[#4d816f]" /><span className="break-words">{registro.comentario}</span></p>}</article>
      })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#cbded4] p-8 text-center"><Utensils className="mx-auto text-[#7da08f]" /><p className="mt-2 font-extrabold text-[#173f34]">Aun no hay comidas confirmadas</p><p className="mt-1 text-sm text-slate-500">Los registros apareceran cuando el paciente confirme sus comidas.</p></div>}
    </section>
  )
}

export default HistorialSeguimientoComidas
