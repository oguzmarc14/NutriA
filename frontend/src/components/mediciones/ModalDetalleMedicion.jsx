import { X } from 'lucide-react'
import { fechaMedicion, formatearNumero } from '../../utils/mediciones'

const campos = [
  ['Edad', 'edad', ' años'], ['Nivel de actividad', 'nivelActividadFisica', ''], ['Peso', 'peso', ' kg'],
  ['Estatura', 'estatura', ' m'], ['IMC', 'imc', ''], ['Grasa corporal', 'grasaCorporal', '%'],
  ['Grasa visceral', 'grasaVisceral', ''], ['Masa muscular', 'masaMuscular', ' kg'],
  ['Masa osea', 'masaOsea', ' kg'], ['Proteina', 'proteina', '%'],
]

function ModalDetalleMedicion({ medicion, onCerrar }) {
  if (!medicion) return null
  const fecha = fechaMedicion(medicion)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d25]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Detalle de medicion">
      <article className="max-h-[90vh] min-w-0 w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl bg-[#f8fbf9] p-4 shadow-2xl sm:p-5 md:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0"><p className="break-words text-xs font-bold uppercase tracking-[0.16em] text-[#4d816f]">Detalle de medicion</p><h2 className="mt-1 break-words text-xl font-black text-[#173f34] sm:text-2xl">{fecha ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(fecha)) : 'Sin fecha'}</h2></div>
          <button type="button" onClick={onCerrar} className="rounded-xl bg-white p-2 text-slate-500" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {campos.map(([label, campo, unidad]) => (
            <div key={campo} className="min-w-0 rounded-2xl border border-[#dce8e2] bg-white p-4"><p className="break-words text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 break-words text-lg font-extrabold text-[#173f34]">{campo === 'nivelActividadFisica' && medicion[campo] != null ? `Nivel ${medicion[campo]}` : `${formatearNumero(medicion[campo])}${medicion[campo] == null ? '' : unidad}`}</p></div>
          ))}
          <div className="rounded-2xl border border-[#dce8e2] bg-white p-4 sm:col-span-2"><p className="text-xs font-semibold text-slate-400">Tipo de medicion</p><p className="mt-1 font-extrabold text-[#173f34]">{medicion.esPrimeraMedicion ? 'Primera medicion' : 'Medicion de seguimiento'}</p></div>
        </div>
      </article>
    </div>
  )
}

export default ModalDetalleMedicion
