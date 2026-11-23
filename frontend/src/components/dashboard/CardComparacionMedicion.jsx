import { useState } from 'react'
import { fechaDietaLegible } from '../../utils/calendarioDietas'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Scale } from 'lucide-react'

function numero(valor, decimales = 1) {
  if (valor == null || valor === '') return '—'
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido.toFixed(decimales).replace(/\.0$/, '') : '—'
}

function Diferencia({ actual, anterior, unidad }) {
  const diferencia = Number(actual) - Number(anterior)
  const Icono = diferencia > 0 ? ArrowUpRight : diferencia < 0 ? ArrowDownRight : ArrowRight
  const clase = 'text-[#315d4b] bg-[#e8f2eb]'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${clase}`}>
      <Icono size={14} />
      {diferencia > 0 ? '+' : ''}{numero(diferencia)} {unidad}
    </span>
  )
}

function CardComparacionMedicion({ mediciones }) {
  const [idReciente, setIdReciente] = useState('')
  const [idAnterior, setIdAnterior] = useState('')
  const ultima = mediciones.find(item => item._id === idReciente) || mediciones[0]
  const anterior = mediciones.find(item => item._id === idAnterior) || mediciones[1]
  const comparar = ultima && anterior && ultima._id !== anterior._id
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
          <h2 className="mt-1 text-xl font-extrabold text-[#173f34]">Comparación de mediciones</h2>
        </div>
        <Scale className="text-[#4d816f]" />
      </div>

      {mediciones.length > 1 && <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {[
          ['Medición de referencia', anterior, setIdAnterior],
          ['Medición a comparar', ultima, setIdReciente],
        ].map(([etiqueta, seleccion, elegir]) => <label key={etiqueta} className="space-y-1 text-xs font-bold text-[#48685c]">
          <span>{etiqueta}</span>
          <select value={seleccion?._id || ''} onChange={event => elegir(event.target.value)}
            className="block min-h-10 w-full rounded-xl border border-[#c8ddd2] bg-white px-3 text-sm text-[#173f34]">
            {mediciones.map(item => <option key={item._id} value={item._id}>
              {fechaDietaLegible((item.fecha || item.createdAt || '').slice(0, 10))}{item.peso != null ? ' · ' + item.peso + ' kg' : ''}
            </option>)}
          </select>
        </label>)}
      </div>}
      <div className="grid gap-3 sm:grid-cols-2">
        {datos.map((dato) => (
          <div key={dato.label} className="rounded-2xl bg-[#f4f8f6] p-4">
            <p className="text-xs font-semibold text-slate-400">{dato.label}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <strong className="text-lg text-[#173f34]">{numero(dato.actual)} {dato.actual != null ? dato.unidad : ''}</strong>
              {comparar && dato.actual != null && dato.anterior != null && <Diferencia actual={dato.actual} anterior={dato.anterior} unidad={dato.unidad} />}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {comparar ? 'Cambios respecto a la medición de referencia.' : anterior ? 'Selecciona dos mediciones diferentes para comparar.' : 'Esta es tu primera medición registrada.'}
      </p>
    </article>
  )
}

export default CardComparacionMedicion
