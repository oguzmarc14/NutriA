function CampoAntropometrico({ icon: Icon, label, unidad, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#715b50]"><Icon size={16} className="text-[#a87552]" />{label}<span className="ml-auto text-xs font-normal text-[#b29a8c]">Opcional</span></span>
      <div className="relative">
        <input type="number" step="0.1" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-[#dfd1c8] bg-white/80 px-4 py-3 pr-16 outline-none transition focus:border-[#a87552]" placeholder="—" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#aa9689]">{unidad}</span>
      </div>
    </label>
  )
}

export default CampoAntropometrico
