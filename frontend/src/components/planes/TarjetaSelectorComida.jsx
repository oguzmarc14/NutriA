import { Clock3, GripVertical } from 'lucide-react'

function TarjetaSelectorComida({
  comida,
  activa,
  kcal,
  gramos,
  icono,
  formatearHora,
  onSeleccionar,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  arrastrando,
}) {
  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, comida.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, comida.id)}
      className={`group relative min-w-[164px] snap-start transition ${arrastrando ? 'opacity-45' : 'opacity-100'}`}
    >
      <button
        type="button"
        onClick={() => onSeleccionar(comida.id)}
        className={`w-full rounded-2xl border px-3 py-2.5 pr-8 text-left transition ${
          activa
            ? 'border-[#4d816f] bg-[#e6f2eb] shadow-[0_5px_16px_rgba(36,107,85,0.12)]'
            : 'border-[#d8e4de] bg-white/80 hover:border-[#9ebbad] hover:bg-white'
        }`}
        aria-pressed={activa}
      >
        <span className={`flex items-center gap-2 text-sm font-extrabold ${activa ? 'text-[#246b55]' : 'text-[#173f34]'}`}>
          {icono}
          <span className="truncate">{comida.nombre || 'Sin nombre'}</span>
        </span>
        <span className="mt-1 block truncate text-xs font-bold text-[#48685c]">
          {comida.platillo || 'Platillo sin nombre'}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Clock3 size={12} />
          {formatearHora(comida.hora)}
        </span>
        <span className="mt-1 block text-xs font-black text-[#8a6840]">
          {kcal} kcal · {gramos} g
        </span>
      </button>

      <span
        className="absolute right-2 top-2 cursor-grab rounded-lg p-1 text-[#7c9b8d] transition hover:bg-white/70 active:cursor-grabbing"
        title="Arrastra para cambiar el orden"
        aria-hidden="true"
      >
        <GripVertical size={16} />
      </span>
    </div>
  )
}

export default TarjetaSelectorComida
