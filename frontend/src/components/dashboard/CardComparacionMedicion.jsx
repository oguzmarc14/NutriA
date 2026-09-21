import { ArrowDownRight, ArrowRight, ArrowUpRight, Scale } from 'lucide-react'

function numero(valor, decimales = 1) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido.toFixed(decimales).replace(/\.0$/, '') : '—'
}

function Diferencia({ actual, anterior, unidad }) {
  const diferencia = Number(actual) - Number(anterior)
  const Icono = diferencia > 0 ? ArrowUpRight : diferencia < 0 ? ArrowDownRight : ArrowRight
  const clase = diferencia > 0 ? 'text-amber-700 bg-amber-50' : diferencia < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${clase}`}>
      <Icono size={14} />
      {diferencia > 0 ? '+' : ''}{numero(diferencia)} {unidad}
    </span>
  )
}

function CardComparacionMedicion({ ultima, anterior }) {
  if (!ultima) {
    return (
      <article className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/60 p-6">
        <Scale className="mb-3 text-[#4d816f]" />
        <h2 className="font-extrabold text-[#173f34]">Aun no tienes mediciones</h2>
        <p className="mt-1 text-sm text-slate-500">Tu progreso aparecera cuando tu nutriologo registre la primera.</p>
      </article>
    )
  }

  const datos = [
    { label: 'Peso', actual: ultima.peso, anterior: anterior?.peso, unidad: 'kg' },
    { label: 'IMC', actual: ultima.imc, anterior: anterior?.imc, unidad: '' },
    { label: 'Grasa corporal', actual: ultima.grasaCorporal, anterior: anterior?.grasaCorporal, unidad: '%' },
    { label: 'Masa muscular', actual: ultima.masaMuscular, anterior: anterior?.masaMuscular, unidad: 'kg' },
  ]

  return (
    <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_12px_35px_rgba(36,107,85,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d816f]">Ultima medicion</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#173f34]">Comparacion de progreso</h2>
        </div>
        <Scale className="text-[#4d816f]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {datos.map((dato) => (
          <div key={dato.label} className="rounded-2xl bg-[#f4f8f6] p-4">
            <p className="text-xs font-semibold text-slate-400">{dato.label}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <strong className="text-lg text-[#173f34]">{numero(dato.actual)} {dato.actual != null ? dato.unidad : ''}</strong>
              {anterior && dato.actual != null && dato.anterior != null && <Diferencia actual={dato.actual} anterior={dato.anterior} unidad={dato.unidad} />}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {anterior ? 'Las diferencias se calculan contra tu medicion anterior.' : 'Esta es tu primera medicion registrada.'}
      </p>
    </article>
  )
}

export default CardComparacionMedicion
