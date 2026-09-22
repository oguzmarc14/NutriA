import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { calcularVariacion, formatearNumero } from '../../utils/mediciones'

function IndicadorVariacion({ actual, anterior, unidad = '', mostrarPorcentaje = false }) {
  const variacion = calcularVariacion(actual, anterior)

  if (!variacion) {
    return <span className="text-xs font-semibold text-slate-400">Medicion inicial</span>
  }

  const Icono = variacion.diferencia > 0 ? ArrowUp : variacion.diferencia < 0 ? ArrowDown : Minus
  const signo = variacion.diferencia > 0 ? '+' : ''

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1 break-words text-xs font-bold text-[#61776f]">
      <Icono size={13} />
      {signo}{formatearNumero(variacion.diferencia)}{unidad}
      {mostrarPorcentaje && variacion.porcentaje !== null && (
        <span className="font-medium text-slate-400">
          ({signo}{formatearNumero(variacion.porcentaje)}%)
        </span>
      )}
    </span>
  )
}

export default IndicadorVariacion
