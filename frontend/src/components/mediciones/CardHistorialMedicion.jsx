import { ArrowRight, CalendarDays, Pencil } from 'lucide-react'
import { fechaMedicion, formatearNumero, formatearTiempoRelativo } from '../../utils/mediciones'
import IndicadorVariacion from './IndicadorVariacion'

function Metrica({ label, valor, unidad, anterior }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-base font-black text-[#173f34]">{formatearNumero(valor)}{valor == null ? '' : unidad}</p>
      <div className="mt-1"><IndicadorVariacion actual={valor} anterior={anterior} unidad={unidad} /></div>
    </div>
  )
}

function CardHistorialMedicion({ medicion, anterior, esUltima, onVer, onEditar, soloLectura = false }) {
  const fecha = new Date(fechaMedicion(medicion))
  const fechaValida = !Number.isNaN(fecha.getTime())
  const secundarios = [
    ['Grasa visceral', medicion.grasaVisceral, ''],
    ['Masa osea', medicion.masaOsea, ' kg'],
    ['Proteina', medicion.proteina, '%'],
  ]

  return (
    <article className={`min-w-0 overflow-hidden rounded-3xl border p-4 shadow-[0_12px_35px_rgba(36,107,85,0.06)] sm:p-5 ${esUltima ? 'border-[#82b49e] bg-[#f3faf6]' : 'border-white/80 bg-white/80'}`}>
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-[150px_repeat(4,minmax(90px,1fr))_minmax(120px,150px)_auto] lg:items-center">
        <div className="col-span-2 min-w-0 border-b border-[#e4ece8] pb-4 lg:col-span-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          {esUltima && <span className="mb-2 inline-flex rounded-full bg-[#d9eee4] px-2.5 py-1 text-[11px] font-extrabold text-[#246b55]">Ultima medicion</span>}
          <div className="flex items-center gap-2 text-[#4d816f]"><CalendarDays size={17} /><span className="text-xs font-bold uppercase tracking-wide">Fecha</span></div>
          <p className="mt-2 text-3xl font-black leading-none text-[#173f34]">{fechaValida ? fecha.getDate() : '—'}</p>
          <p className="mt-1 text-sm font-bold capitalize text-[#48685c]">{fechaValida ? new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(fecha) : 'Sin fecha'}</p>
          <p className="mt-1 text-xs text-slate-400">{fechaValida ? new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(fecha) : ''}</p>
          <p className="mt-2 text-xs font-bold text-[#6e9484]">{formatearTiempoRelativo(fechaMedicion(medicion))}</p>
        </div>

        <Metrica label="Peso" valor={medicion.peso} unidad=" kg" anterior={anterior?.peso} />
        <Metrica label="IMC" valor={medicion.imc} unidad="" anterior={anterior?.imc} />
        <Metrica label="Grasa corporal" valor={medicion.grasaCorporal} unidad="%" anterior={anterior?.grasaCorporal} />
        <Metrica label="Masa muscular" valor={medicion.masaMuscular} unidad=" kg" anterior={anterior?.masaMuscular} />

        <div className="col-span-2 grid min-w-0 grid-cols-1 gap-2 border-t border-[#e4ece8] pt-4 text-xs sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          {secundarios.map(([label, valor, unidad]) => (
            <p key={label} className="min-w-0 break-words text-slate-400"><span className="block">{label}</span><strong className="break-words text-[#48685c]">{formatearNumero(valor)}{valor == null ? '' : unidad}</strong></p>
          ))}
        </div>

        <div className="col-span-2 flex min-w-0 flex-col gap-2 lg:col-span-1">
          <button type="button" onClick={() => onVer(medicion)} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#e3f1ea] px-3 py-3 text-center text-sm font-extrabold text-[#246b55] transition hover:bg-[#d6eae0]">
            {soloLectura ? 'Ver detalles' : 'Ver medicion'} <ArrowRight size={16} />
          </button>
          {!soloLectura && onEditar && (
            <button type="button" onClick={() => onEditar(medicion)} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#c9ddd3] bg-white px-3 py-3 text-center text-sm font-extrabold text-[#48685c] transition hover:bg-[#eef5f1]">
              <Pencil size={15} /> Editar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default CardHistorialMedicion
