import { formatearNumero, valorNumerico } from '../../utils/mediciones'

function crearPuntos(datos, campo, ancho, alto) {
  const valores = datos.map((item) => valorNumerico(item[campo])).filter((valor) => valor !== null)
  if (valores.length < 2) return ''

  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const rango = maximo - minimo || 1

  return datos
    .map((item, indice) => {
      const valor = valorNumerico(item[campo])
      if (valor === null) return null
      const x = (indice / Math.max(datos.length - 1, 1)) * ancho
      const y = alto - ((valor - minimo) / rango) * (alto - 12) - 6
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')
}

function GraficaEvolucionMediciones({ mediciones }) {
  const datos = [...mediciones].reverse()
  const puntosPeso = crearPuntos(datos, 'peso', 520, 150)
  const puntosImc = crearPuntos(datos, 'imc', 520, 150)
  const ultima = datos.at(-1)

  return (
    <div className="rounded-2xl border border-[#dce8e2] bg-white/70 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-extrabold text-[#173f34]">Evolucion general</p>
          <p className="text-xs text-slate-500">Tendencia historica de peso e IMC</p>
        </div>
        <div className="flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-[#246b55]"><i className="h-2.5 w-2.5 rounded-full bg-[#246b55]" />Peso</span>
          <span className="flex items-center gap-1.5 text-[#a77951]"><i className="h-2.5 w-2.5 rounded-full bg-[#a77951]" />IMC</span>
        </div>
      </div>
      {datos.length < 2 ? (
        <div className="grid h-[150px] place-items-center rounded-xl bg-[#f5f9f7] text-sm text-slate-400">Se necesitan al menos dos mediciones</div>
      ) : (
        <svg viewBox="0 0 520 150" className="h-[150px] w-full" role="img" aria-label="Grafica de evolucion de peso e IMC">
          {[25, 75, 125].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e3ece7" strokeWidth="1" />)}
          <polyline points={puntosPeso} fill="none" stroke="#246b55" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={puntosImc} fill="none" stroke="#a77951" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {ultima && (
        <p className="mt-2 text-right text-xs text-slate-500">
          Ultimo registro: <strong className="text-[#173f34]">{formatearNumero(ultima.peso)} kg · IMC {formatearNumero(ultima.imc)}</strong>
        </p>
      )}
    </div>
  )
}

export default GraficaEvolucionMediciones
