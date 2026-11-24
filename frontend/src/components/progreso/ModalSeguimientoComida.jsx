import { useEffect, useRef, useState } from 'react'
import useModalAccesible from '../../hooks/useModalAccesible'
import { CheckCircle2, LoaderCircle, MessageCircle, X } from 'lucide-react'
import { fechaDietaLegible } from '../../utils/calendarioDietas'
import client from '../../api/client'

const estados = [
  { value: 'completada', label: 'La consumí completa' },
  { value: 'parcial', label: 'La consumí parcialmente' },
  { value: 'omitida', label: 'No la consumí' },
]

const agrados = [
  { value: 'gusto', label: 'Me gustó' },
  { value: 'neutral', label: 'Me fue indiferente' },
  { value: 'no_gusto', label: 'No me gustó' },
]

function ModalSeguimientoComida({ comida, fecha, onCerrar, onGuardado, plan, registro }) {
  const [estado, setEstado] = useState(registro?.estado || '')
  const [agrado, setAgrado] = useState(registro?.agrado || '')
  const [comentario, setComentario] = useState(registro?.comentario || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const enviando = useRef(false)
  const cambios = estado !== (registro?.estado || '') || agrado !== (registro?.agrado || '') ||
    comentario !== (registro?.comentario || '')
  const listo = Boolean(estado && agrado)
  const { modalRef, volverRef } = useModalAccesible({
    abierto: Boolean(comida),
    onVolver: onCerrar,
    bloqueado: guardando,
  })

  useEffect(() => { if (confirmado) volverRef.current?.focus() }, [confirmado, volverRef])

  if (!comida) return null

  async function guardar(event) {
    event.preventDefault()
    if (enviando.current || !listo || !cambios) return
    enviando.current = true
    try {
      setGuardando(true)
      setError('')
      const { data } = await client.post('/seguimiento-comidas/mi-registro', {
        planId: plan._id,
        comidaId: comida._id,
        fecha,
        estado,
        agrado,
        comentario: comentario.trim(),
      })
      onGuardado(data.registro)
      window.dispatchEvent(new Event('nutria-comida-guardada'))
      setConfirmado(true)
    } catch (err) {
      setError(err.response?.data?.message || (!navigator.onLine
        ? 'Sin conexión. Tus cambios siguen aquí. Vuelve a intentar al reconectarte.'
        : 'No se recibió confirmación. Revisa la conexión y vuelve a intentar para guardar este mismo registro.'))
    } finally {
      enviando.current = false
      setGuardando(false)
    }
  }

  return (
    <div ref={modalRef} className="fixed inset-0 z-[70] grid place-items-center bg-[#102d26]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Registrar seguimiento de comida">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fbfdfb] p-5 shadow-2xl sm:p-6">
        {confirmado ? (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#dff3e8] text-[#246b55]"><CheckCircle2 size={34} /></div>
            <h2 className="mt-5 text-2xl font-black text-[#173f34]">Seguimiento guardado</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Tu registro se guardó para el {fechaDietaLegible(fecha)}.</p>
            <button ref={volverRef} type="button" onClick={onCerrar} className="mt-6 w-full rounded-xl bg-[#246b55] px-5 py-3 font-extrabold text-white">Aceptar</button>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4d816f]">Seguimiento diario</p><h2 className="mt-1 break-words text-xl font-black text-[#173f34]">{comida.platillo || comida.nombre}</h2><p className="mt-1 text-sm text-[#48685c]">{fechaDietaLegible(fecha)} · {plan.nombre}</p></div>
              <button ref={volverRef} type="button" onClick={onCerrar} disabled={guardando} className="grid h-9 w-9 disabled:opacity-50 shrink-0 place-items-center rounded-xl bg-[#edf4f0] text-[#48685c]" aria-label="Cerrar"><X size={18} /></button>
            </div>

            <fieldset className="mt-6" disabled={guardando}>
              <legend className="mb-2 text-sm font-extrabold text-[#173f34]">¿Cómo consumiste esta comida?</legend>
              <div className="grid gap-2 sm:grid-cols-3">{estados.map((opcion) => <button key={opcion.value} type="button" aria-pressed={estado === opcion.value} onClick={() => setEstado(opcion.value)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${estado === opcion.value ? 'border-[#246b55] bg-[#dff0e7] text-[#246b55]' : 'border-[#d8e4de] bg-white text-slate-500'}`}>{opcion.label}</button>)}</div>
            </fieldset>

            <fieldset className="mt-5" disabled={guardando}>
              <legend className="mb-2 text-sm font-extrabold text-[#173f34]">¿Qué te pareció?</legend>
              <div className="grid gap-2 sm:grid-cols-3">{agrados.map((opcion) => <button key={opcion.value} type="button" aria-pressed={agrado === opcion.value} onClick={() => setAgrado(opcion.value)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${agrado === opcion.value ? 'border-[#9a7446] bg-[#f7f0e2] text-[#8a6840]' : 'border-[#e8e0d2] bg-white text-slate-500'}`}>{opcion.label}</button>)}</div>
            </fieldset>

            <label className="mt-5 block"><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#173f34]"><MessageCircle size={16} />Comentario opcional <span className="ml-auto font-normal">{comentario.length}/500</span></span><textarea disabled={guardando} value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={500} rows={3} placeholder="Ej. No conseguí un ingrediente." className="w-full resize-none rounded-xl border border-[#d7e3dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#4d816f]" /></label>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
            {!listo && <p className="mt-3 text-sm text-[#48685c]">Selecciona cómo comiste y qué te pareció para guardar.</p>}
            <div className="mt-6 nutria-acciones"><button type="button" onClick={onCerrar} disabled={guardando} className="rounded-xl border border-[#d5e2dc] disabled:opacity-50 px-5 py-3 font-bold text-[#48685c]">Cancelar</button><button type="submit" disabled={guardando || !listo || !cambios} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 font-extrabold text-white disabled:opacity-60">{guardando && <LoaderCircle className="animate-spin" size={17} />}{guardando ? 'Guardando…' : 'Guardar seguimiento'}</button></div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ModalSeguimientoComida
