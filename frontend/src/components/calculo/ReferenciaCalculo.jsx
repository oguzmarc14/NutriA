import { CalendarClock } from 'lucide-react'

const fechaMedicion = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' })
const fechaCalculo = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

function fechaVisible(valor, formato) {
  const instante = valor ? new Date(valor) : null
  return instante && Number.isFinite(instante.getTime()) ? formato.format(instante) : 'Fecha no disponible'
}

export const fechaDeMedicion = valor => fechaVisible(valor, fechaMedicion)
export const fechaDeCalculo = valor => fechaVisible(valor, fechaCalculo)

function instante(valor) {
  return valor ? new Date(valor).getTime() : NaN
}

function hayMedicionMasReciente(calculo, actual) {
  if (!calculo?.medicion || !actual?._id || String(calculo.medicion) === String(actual._id)) return false
  const fechaActual = instante(actual.fecha)
  const fechaUsada = instante(calculo.fechaMedicion)
  if (fechaActual > fechaUsada) return true
  if (fechaActual < fechaUsada) return false
  if (fechaActual === fechaUsada) {
    return instante(actual.createdAt) > instante(calculo.fechaRegistroMedicion || calculo.createdAt)
  }
  return instante(actual.createdAt) > instante(calculo.createdAt)
}

export default function ReferenciaCalculo({ calculo, medicionReciente, onRecalcular }) {
  if (!calculo) return null
  const pendiente = hayMedicionMasReciente(calculo, medicionReciente)

  return (
    <section aria-label="Referencia del cálculo nutricional" className="min-w-0 space-y-3 rounded-2xl border border-[#cbded2] bg-[#f3f9f5] p-4 text-[#173f34]">
      <h2 className="flex items-center gap-2 text-sm font-extrabold">
        <CalendarClock size={18} className="shrink-0" aria-hidden="true"/> Último cálculo guardado
      </h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-xs font-semibold text-[#52716a]">Cálculo guardado</dt><dd>{fechaDeCalculo(calculo.createdAt)}</dd></div>
        <div><dt className="text-xs font-semibold text-[#52716a]">Medición utilizada</dt>
          <dd>{fechaDeMedicion(calculo.fechaMedicion)}{Number.isFinite(calculo.peso) && ' · ' + calculo.peso + ' kg'}</dd>
        </div>
      </dl>
      {pendiente && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">Hay una medición más reciente</p>
            <p className="mt-1 text-xs">{fechaDeMedicion(medicionReciente.fecha)}{Number.isFinite(medicionReciente.peso) && ' · ' + medicionReciente.peso + ' kg'}</p>
          </div>
          <button type="button" onClick={onRecalcular}
            className="min-h-11 shrink-0 rounded-xl bg-[#246b55] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d5947]">
            Recalcular con esta medición
          </button>
        </div>
      )}
    </section>
  )
}
