import { CheckCircle2, Heart, Scale, Target, Utensils, XCircle } from 'lucide-react'

function CardResumen({ detalle, icon: Icon, label, tono = 'verde', valor }) {
  const tonos = {
    verde: 'bg-[#e1f0e7] text-[#246b55]',
    arena: 'bg-[#f7ecd9] text-[#936b35]',
    rojo: 'bg-[#f9e6e3] text-[#a55249]',
    azul: 'bg-[#e4ecf7] text-[#526f9b]',
  }

  return (
    <article className="min-w-0 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tonos[tono]}`}><Icon size={19} /></div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-2xl font-black text-[#173f34]">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{detalle}</p>
    </article>
  )
}

function ResumenProgresoPaciente({ resumen, objetivo }) {
  const cambio = resumen?.cambioPeso
  const textoCambio = cambio == null ? 'Sin datos' : `${cambio > 0 ? '+' : ''}${cambio} kg`

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumen icon={Target} label="Cumplimiento" valor={`${resumen?.cumplimiento || 0}%`} detalle={`${resumen?.completadas || 0} de ${resumen?.totalProgramadas || 0} comidas completadas`} />
        <CardResumen icon={Heart} label="Satisfaccion" valor={`${resumen?.satisfaccion || 0}%`} detalle={`${resumen?.gustaron || 0} comidas fueron de su agrado`} tono="arena" />
        <CardResumen icon={Scale} label="Cambio de peso" valor={textoCambio} detalle={resumen?.pesoActual == null ? 'Aun no hay mediciones' : `Peso actual: ${resumen.pesoActual} kg`} tono="azul" />
        <CardResumen icon={Utensils} label="Comidas programadas" valor={resumen?.totalProgramadas || 0} detalle={`${resumen?.pendientes || 0} pendientes de confirmar`} tono="rojo" />
      </div>

      <section className="mt-5 rounded-3xl border border-[#cbded4] bg-white/75 p-5">
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dceee4] text-[#246b55]"><Target size={21} /></div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d816f]">Objetivo actual</p><h2 className="mt-1 break-words text-xl font-black text-[#173f34]">{objetivo || 'Sin objetivo registrado'}</h2><p className="mt-1 text-sm text-slate-500">El avance combina la adherencia al plan con la evolucion registrada en las mediciones.</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#e8f4ed] p-4"><CheckCircle2 className="text-[#246b55]" size={19} /><p className="mt-2 text-2xl font-black text-[#173f34]">{resumen?.completadas || 0}</p><p className="text-xs font-semibold text-slate-500">Completadas</p></div>
          <div className="rounded-2xl bg-[#f8f1e3] p-4"><Utensils className="text-[#936b35]" size={19} /><p className="mt-2 text-2xl font-black text-[#173f34]">{resumen?.parciales || 0}</p><p className="text-xs font-semibold text-slate-500">Parciales</p></div>
          <div className="rounded-2xl bg-[#f9e9e6] p-4"><XCircle className="text-[#a55249]" size={19} /><p className="mt-2 text-2xl font-black text-[#173f34]">{resumen?.omitidas || 0}</p><p className="text-xs font-semibold text-slate-500">No realizadas</p></div>
        </div>
      </section>
    </>
  )
}

export default ResumenProgresoPaciente
