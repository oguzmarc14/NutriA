import { useState } from 'react'
import { fechaMedicion, formatearNumero, valorNumerico } from '../../utils/mediciones'

const metricas = [
  { campo: 'peso', label: 'Peso', unidad: 'kg', color: '#246b55' },
  { campo: 'imc', label: 'IMC', unidad: '', color: '#a77951' },
  { campo: 'grasaCorporal', label: 'Grasa corporal', unidad: '%', color: '#9b6b57' },
  { campo: 'grasaVisceral', label: 'Grasa visceral', unidad: 'nivel', color: '#6c7f96' },
  { campo: 'masaMuscular', label: 'Masa muscular', unidad: 'kg', color: '#4f7c72' },
  { campo: 'masaOsea', label: 'Masa osea', unidad: 'kg', color: '#8b7d6b' },
  { campo: 'proteina', label: 'Proteina', unidad: '%', color: '#7a6f9b' },
]

function formatearFechaCorta(fecha) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date(fecha))
}

function GraficaEvolucionMediciones({ mediciones }) {
  const [campoActivo, setCampoActivo] = useState('peso')
  const metrica = metricas.find((item) => item.campo === campoActivo) || metricas[0]
  const datos = [...mediciones]
    .map((medicion) => ({ fecha: fechaMedicion(medicion), valor: valorNumerico(medicion[campoActivo]) }))
    .filter((item) => item.fecha && item.valor !== null)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const ancho = 620
  const alto = 220
  const margen = { arriba: 15, derecha: 18, abajo: 48, izquierda: 52 }
  const anchoGrafica = ancho - margen.izquierda - margen.derecha
  const altoGrafica = alto - margen.arriba - margen.abajo
  const valores = datos.map((item) => item.valor)
  const minimoReal = valores.length ? Math.min(...valores) : 0
  const maximoReal = valores.length ? Math.max(...valores) : 1
  const separacion = Math.max((maximoReal - minimoReal) * 0.12, maximoReal * 0.03, 0.5)
  const minimo = minimoReal - separacion
  const maximo = maximoReal + separacion
  const rango = maximo - minimo || 1
  const puntos = datos.map((item, indice) => ({
    ...item,
    x: margen.izquierda + (indice / Math.max(datos.length - 1, 1)) * anchoGrafica,
    y: margen.arriba + altoGrafica - ((item.valor - minimo) / rango) * altoGrafica,
  }))
  const indicesFecha = new Set(
    datos.length <= 5
      ? datos.map((_, indice) => indice)
      : [0, Math.round((datos.length - 1) * 0.25), Math.round((datos.length - 1) * 0.5), Math.round((datos.length - 1) * 0.75), datos.length - 1],
  )

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#dce8e2] bg-white/70 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><p className="font-extrabold text-[#173f34]">Evolucion por fecha</p><p className="text-xs text-slate-500">Selecciona la medida que quieres analizar</p></div>
        <label className="min-w-0 sm:w-52">
          <span className="mb-1 block text-xs font-bold text-[#48685c]">Medida</span>
          <select value={campoActivo} onChange={(event) => setCampoActivo(event.target.value)} className="min-w-0 w-full rounded-xl border border-[#c9ddd3] bg-white px-3 py-2 text-sm font-bold text-[#173f34] outline-none focus:border-[#4d816f]">
            {metricas.map((item) => <option key={item.campo} value={item.campo}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {datos.length === 0 ? (
        <div className="grid h-[190px] place-items-center rounded-xl bg-[#f5f9f7] px-4 text-center text-sm text-slate-400">No hay datos registrados para {metrica.label.toLowerCase()}</div>
      ) : (
        <div className="min-w-0 overflow-x-auto pb-1">
          <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto min-w-[520px] w-full" role="img" aria-label={`Grafica de evolucion de ${metrica.label}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((porcion) => {
              const y = margen.arriba + altoGrafica * porcion
              const valor = maximo - rango * porcion
              return <g key={porcion}><line x1={margen.izquierda} x2={ancho - margen.derecha} y1={y} y2={y} stroke="#e3ece7" strokeWidth="1" /><text x={margen.izquierda - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#789087">{formatearNumero(valor)}</text></g>
            })}

            {puntos.length > 1 && <polyline points={puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')} fill="none" stroke={metrica.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}

            {puntos.map((punto, indice) => (
              <g key={`${punto.fecha}-${indice}`}>
                <circle cx={punto.x} cy={punto.y} r="5" fill="white" stroke={metrica.color} strokeWidth="3"><title>{`${formatearFechaCorta(punto.fecha)}: ${formatearNumero(punto.valor)} ${metrica.unidad}`}</title></circle>
                {indicesFecha.has(indice) && <text x={punto.x} y={alto - 18} textAnchor="middle" fontSize="11" fill="#61776f">{formatearFechaCorta(punto.fecha)}</text>}
              </g>
            ))}
          </svg>
        </div>
      )}

      {datos.length > 0 && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span className="font-bold" style={{ color: metrica.color }}>{metrica.label}</span><span>Ultimo registro: <strong className="text-[#173f34]">{formatearNumero(datos.at(-1).valor)} {metrica.unidad}</strong></span></div>}
    </div>
  )
}

export default GraficaEvolucionMediciones
