import { confirmarAccion } from '../../utils/alertasAccion'
import { useEffect, useState } from 'react'
import { HeartHandshake, PauseCircle, PlayCircle } from 'lucide-react'
import client from '../../api/client'

export default function ControlGamificacionNutriologo({ pacienteId }) {
  const [preferencias, setPreferencias] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pacienteId) {
      return
    }
    let activo = true
    async function cargar() {
      setCargando(true)
      setPreferencias(null)
      setError('')
      try {
        const { data } = await client.get(`/gamificacion/paciente/${pacienteId}`)
        if (activo) setPreferencias(data.preferencias)
      } catch (err) {
        if (activo) setError(err.response?.data?.message || 'No se pudo consultar la configuración.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [pacienteId])

  async function cambiarPermiso() {
    if (!preferencias || guardando) return
    if (!(await confirmarAccion('¿Cambiar el acceso al seguimiento de logros?'))) return
    setGuardando(true)
    setError('')
    try {
      const { data } = await client.patch(`/gamificacion/paciente/${pacienteId}/configuracion`, {
        permitidaPorNutriologo: !preferencias.permitidaPorNutriologo,
      })
      setPreferencias(data.preferencias)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar la configuración.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-[#cbded4] bg-[#eaf3ed]/80 p-5" aria-labelledby="control-gamificacion-titulo">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#d7eadd] text-[#246b55]"><HeartHandshake size={22} /></span>
        <div>
          <h2 id="control-gamificacion-titulo" className="text-lg font-black text-[#173f34]">Reconocimientos y bienestar</h2>
          <p className="mt-1 text-sm leading-6 text-[#52695f]">Puedes pausar la gamificación para este paciente cuando consideres que no contribuye a su bienestar. Nunca cambia su expediente o plan clínico.</p>
        </div>
      </div>
      {cargando && <p className="mt-4 text-sm text-[#52695f]">Consultando preferencias...</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff3ef] p-3 text-sm text-[#9c5045]">{error}</p>}
      {preferencias && !cargando && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#173f34]">{preferencias.permitidaPorNutriologo ? 'Disponible para el paciente' : 'Pausada para este paciente'}</p>
            <p className="mt-1 text-sm text-[#60766b]">
              {preferencias.permitidaPorNutriologo
                ? preferencias.participa ? 'El paciente decidió participar.' : 'El paciente todavía no ha decidido activarla.'
                : 'Se ocultarán sus reconocimientos hasta que vuelvas a permitirlos. El paciente conserva su elección.'}
            </p>
          </div>
          <button type="button" disabled={guardando} aria-pressed={preferencias.permitidaPorNutriologo} onClick={cambiarPermiso}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#1e5b49] disabled:opacity-60">
            {preferencias.permitidaPorNutriologo ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
            {guardando ? 'Guardando...' : preferencias.permitidaPorNutriologo ? 'Pausar para paciente' : 'Volver a permitir'}
          </button>
        </div>
      )}
    </section>
  )
}
