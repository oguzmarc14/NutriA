import { useState } from 'react'
import { CheckCircle2, LoaderCircle, MessageCircle, ThumbsUp, X } from 'lucide-react'
import client from '../../api/client'

const estados = [
  { value: 'completada', label: 'Completada' },
  { value: 'parcial', label: 'Parcialmente' },
  { value: 'omitida', label: 'No realizada' },
]

const agrados = [
  { value: 'gusto', label: 'Me gusto' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'no_gusto', label: 'No me gusto' },
]

function ModalSeguimientoComida({ comida, fecha, onCerrar, onGuardado, plan, registro }) {
  const [estado, setEstado] = useState(registro?.estado || 'completada')
  const [agrado, setAgrado] = useState(registro?.agrado || 'gusto')
  const [comentario, setComentario] = useState(registro?.comentario || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  if (!comida) return null

  async function guardar() {
    try {
      setGuardando(true)
      setError('')
      const { data } = await client.post('/seguimiento-comidas/mi-registro', {
        planId: plan._id,
        comidaId: comida._id,
        fecha,
        estado,
        agrado,
        comentario,
      })
      onGuardado(data.registro)
      setConfirmado(true)
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible guardar el seguimiento')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102d26]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirmar seguimiento de comida">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fbfdfb] p-5 shadow-2xl sm:p-6">
        {confirmado ? (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#dff3e8] text-[#246b55]"><CheckCircle2 size={34} /></div>
            <h2 className="mt-5 text-2xl font-black text-[#173f34]">Comida registrada correctamente</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Tu nutriologa podra consultar esta informacion desde tu progreso.</p>
            <button type="button" onClick={onCerrar} className="mt-6 w-full rounded-xl bg-[#246b55] px-5 py-3 font-extrabold text-white">Aceptar</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4d816f]">Seguimiento diario</p><h2 className="mt-1 break-words text-xl font-black text-[#173f34]">{comida.platillo || comida.nombre}</h2><p className="mt-1 text-sm text-slate-500">Confirma como te fue con esta comida.</p></div>
              <button type="button" onClick={onCerrar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf4f0] text-[#48685c]" aria-label="Cerrar"><X size={18} /></button>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-extrabold text-[#173f34]">¿Cumpliste con la comida?</p>
              <div className="grid gap-2 sm:grid-cols-3">{estados.map((opcion) => <button key={opcion.value} type="button" onClick={() => setEstado(opcion.value)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${estado === opcion.value ? 'border-[#246b55] bg-[#dff0e7] text-[#246b55]' : 'border-[#d8e4de] bg-white text-slate-500'}`}>{opcion.label}</button>)}</div>
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#173f34]"><ThumbsUp size={16} />¿Fue de tu agrado?</p>
              <div className="grid gap-2 sm:grid-cols-3">{agrados.map((opcion) => <button key={opcion.value} type="button" onClick={() => setAgrado(opcion.value)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${agrado === opcion.value ? 'border-[#9a7446] bg-[#f7f0e2] text-[#8a6840]' : 'border-[#e8e0d2] bg-white text-slate-500'}`}>{opcion.label}</button>)}</div>
            </div>

            <label className="mt-5 block"><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#173f34]"><MessageCircle size={16} />Comentario opcional</span><textarea value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={500} rows={3} placeholder="Ej. Me quede con hambre o no consegui un ingrediente..." className="w-full resize-none rounded-xl border border-[#d7e3dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#4d816f]" /></label>
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCerrar} className="rounded-xl border border-[#d5e2dc] px-5 py-3 font-bold text-[#48685c]">Cancelar</button><button type="button" onClick={guardar} disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 font-extrabold text-white disabled:opacity-60">{guardando && <LoaderCircle className="animate-spin" size={17} />}Confirmar comida</button></div>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalSeguimientoComida
