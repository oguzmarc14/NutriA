import { ArrowRight } from 'lucide-react'

function CardModuloDashboard({ descripcion, icono: Icono, nombre, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group rounded-2xl border border-[#e1e9e5] bg-white p-5 text-left shadow-[0_8px_30px_rgba(32,78,64,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(32,78,64,0.09)]">
      <div className="mb-5 flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]"><Icono size={21} /></div>
        <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#246b55]" size={19} />
      </div>
      <h2 className="font-bold text-[#173f34]">{nombre}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{descripcion}</p>
    </button>
  )
}

export default CardModuloDashboard
