import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function AvisoExpedienteGuardado({ mensaje, pacienteId }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} /><div><p className="font-extrabold text-emerald-800">Expediente guardado</p><p className="mt-0.5 text-sm text-emerald-700">{mensaje}</p></div></div>
      <Link to={`/mediciones?paciente=${pacienteId}`} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1d5947]">Continuar a mediciones<ArrowRight size={16} /></Link>
    </div>
  )
}

export default AvisoExpedienteGuardado
