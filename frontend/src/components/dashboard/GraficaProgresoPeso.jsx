function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido.toFixed(1).replace(/\.0$/, '') : '—'
}

function GraficaProgresoPeso({ mediciones }) {
  const historial = [...mediciones]
    .filter((medicion) => Number.isFinite(Number(medicion.peso)))
    .slice(0, 6)
    .reverse()

  if (historial.length < 2) {
    return (
      <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_12px_35px_rgba(36,107,85,0.08)]">
        <h2 className="text-xl font-extrabold text-[#173f34]">Evolucion de peso</h2>
        <p className="mt-2 text-sm text-slate-500">Se necesitan al menos dos mediciones para mostrar tu evolucion.</p>
      </article>
    )
  }

  const pesos = historial.map((medicion) => Number(medicion.peso))
  const minimo = Math.min(...pesos)
  const maximo = Math.max(...pesos)
  const rango = maximo - minimo || 1
  const puntos = historial.map((medicion, index) => ({
    medicion,
    x: historial.length === 1 ? 50 : 5 + (index * 90) / (historial.length - 1),
    y: 82 - ((Number(medicion.peso) - minimo) / rango) * 62,
  }))
  const linea = puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')

  return (
    <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_12px_35px_rgba(36,107,85,0.08)]">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d816f]">Ultimas {historial.length} mediciones</p>
        <h2 className="mt-1 text-xl font-extrabold text-[#173f34]">Evolucion de peso</h2>
      </div>
      <svg viewBox="0 0 100 100" className="h-48 w-full overflow-visible" role="img" aria-label="Grafica de evolucion del peso">
        <line x1="5" y1="82" x2="95" y2="82" stroke="#dce9e3" strokeWidth="1" />
        <polyline points={linea} fill="none" stroke="#26735f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {puntos.map(({ medicion, x, y }) => (
          <g key={medicion._id}>
            <circle cx={x} cy={y} r="3" fill="#fff" stroke="#26735f" strokeWidth="2" />
            <text x={x} y={y - 7} textAnchor="middle" className="fill-[#173f34] text-[6px] font-bold">{numero(medicion.peso)}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Mas antigua</span><span>Mas reciente</span>
      </div>
    </article>
  )
}

export default GraficaProgresoPeso
