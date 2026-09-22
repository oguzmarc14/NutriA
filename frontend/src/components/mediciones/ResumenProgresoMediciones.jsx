import { ArrowRight, CalendarRange, ClipboardList } from 'lucide-react'
import { formatearNumero, formatearSeguimiento, ordenarMediciones } from '../../utils/mediciones'
import GraficaEvolucionMediciones from './GraficaEvolucionMediciones'
import IndicadorVariacion from './IndicadorVariacion'

const metricas = [
  { campo: 'peso', label: 'Peso', unidad: ' kg' },
  { campo: 'imc', label: 'IMC', unidad: '' },
  { campo: 'grasaCorporal', label: 'Grasa corporal', unidad: '%' },
  { campo: 'masaMuscular', label: 'Masa muscular', unidad: ' kg' },
]

function ResumenProgresoMediciones({ mediciones, onComparar, permitirComparar = true }) {
  const ordenadas = ordenarMediciones(mediciones)
  const ultima = ordenadas[0]
  const primera = ordenadas.at(-1)

  return (
    <section className="mb-7 rounded-3xl border border-[#cce0d5] bg-gradient-to-br from-white/90 to-[#eaf4ed] p-5 shadow-[0_18px_45px_rgba(36,107,85,0.08)] md:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4d816f]">Resumen del progreso</p>
          <h2 className="mt-1 text-2xl font-black text-[#173f34]">Primera medicion → ultima medicion</h2>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-xs font-bold text-[#48685c]"><ClipboardList size={15} />{mediciones.length} mediciones</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-xs font-bold text-[#48685c]"><CalendarRange size={15} />{formatearSeguimiento(mediciones)}</span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricas.map(({ campo, label, unidad }) => {
          const disponible = mediciones.length > 1 && primera?.[campo] != null && ultima?.[campo] != null
          return (
            <article key={campo} className="rounded-2xl border border-white bg-white/75 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
              {disponible ? (
                <>
                  <p className="mt-2 text-lg font-black text-[#173f34]">
                    {formatearNumero(primera[campo])}{unidad}
                    <span className="mx-2 text-slate-300">→</span>
                    {formatearNumero(ultima[campo])}{unidad}
                  </p>
                  <div className="mt-2"><IndicadorVariacion actual={ultima[campo]} anterior={primera[campo]} unidad={unidad} mostrarPorcentaje /></div>
                </>
              ) : <p className="mt-3 text-sm font-semibold text-slate-400">Sin datos suficientes</p>}
            </article>
          )
        })}
      </div>

      <GraficaEvolucionMediciones mediciones={ordenadas} />

      {permitirComparar && <div className="mt-5 flex justify-center">
        <button type="button" onClick={onComparar} className="inline-flex items-center gap-2 rounded-xl border border-[#aacabb] bg-white px-5 py-3 text-sm font-extrabold text-[#246b55] transition hover:bg-[#f2f8f5]">
          Comparar mediciones <ArrowRight size={17} />
        </button>
      </div>}
    </section>
  )
}

export default ResumenProgresoMediciones
