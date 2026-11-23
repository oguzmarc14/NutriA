import { useEffect, useState } from 'react'
import { Award, CalendarCheck2, Flame, Heart, Leaf, MessageCircle, PauseCircle, PlayCircle, Sparkles, Sun } from 'lucide-react'
import client from '../../api/client'
import { Link } from 'react-router-dom'
import CompartirReconocimiento from './CompartirReconocimiento.jsx'

const fechaActividad = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' })

const ICONOS = {
  sprout: Leaf,
  heart: Heart,
  message: MessageCircle,
  sun: Sun,
  flower: Sparkles,
  flame: Flame,
  calendar: CalendarCheck2,
}

export default function MiCaminoNutriA() {
  const [preferencias, setPreferencias] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const { data } = await client.get('/gamificacion/mi-resumen')
        if (!activo) return
        setPreferencias(data.preferencias)
        setResumen(data.resumen)
      } catch (err) {
        if (activo) setError(err.response?.data?.message || 'No pudimos cargar tus reconocimientos.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  async function cambiarParticipacion() {
    if (guardando || !preferencias?.permitidaPorNutriologo) return
    setGuardando(true)
    setError('')
    try {
      const participar = !preferencias.participa
      const { data } = await client.patch('/gamificacion/mi-preferencia', { participa: participar })
      setPreferencias(data.preferencias)
      if (data.preferencias.activa) {
        const respuesta = await client.get('/gamificacion/mi-resumen')
        setResumen(respuesta.data.resumen)
        setPreferencias(respuesta.data.preferencias)
      } else {
        setResumen(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar tu preferencia.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#c6dcd0] bg-gradient-to-br from-[#e3f1e8] via-[#eff5e9] to-[#f8efe3] p-5 shadow-[0_12px_32px_rgba(36,107,85,0.07)] sm:p-6" aria-labelledby="mi-camino-titulo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#d0e8d8] text-[#246b55]"><Leaf size={24} /></span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#4d816f]">Bienestar a tu ritmo</p>
            <h2 id="mi-camino-titulo" className="mt-1 text-xl font-black text-[#173f34] sm:text-2xl">Mi camino en NutriA</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#52695f]">Un espacio opcional para reconocer tu dedicación. No hay competencia, castigos ni días perfectos que conseguir.</p>
          </div>
        </div>
      </div>

      {cargando && <p className="mt-5 text-sm text-[#52695f]">Cargando tu espacio...</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff3ef] p-3 text-sm text-[#9c5045]">{error}</p>}

      {!cargando && preferencias && (
        <>
          {!preferencias.permitidaPorNutriologo ? (
            <p className="mt-5 rounded-2xl bg-white/65 p-4 text-sm leading-6 text-[#52695f]">
              Este espacio está pausado por tu profesional de nutrición. Tu seguimiento sigue disponible y no se ha borrado.
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d2e4d8] bg-white/65 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#173f34]">{preferencias.activa ? 'Tus reconocimientos están activos' : 'Tú decides si participar'}</p>
                <p className="mt-1 text-sm text-[#60766b]">{preferencias.activa ? 'Puedes pausarlos cuando quieras; tu historial de salud permanece igual.' : 'Puedes activar este espacio sin cambiar tu plan alimenticio ni tus registros.'}</p>
              </div>
              <button type="button" disabled={guardando} aria-pressed={preferencias.activa} onClick={cambiarParticipacion}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#1e5b49] disabled:opacity-60">
                {preferencias.activa ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                {guardando ? 'Guardando...' : preferencias.activa ? 'Pausar reconocimientos' : 'Activar reconocimientos'}
              </button>
            </div>
          )}
          {preferencias.activa && resumen && (
            <div className="mt-5">
              <p className="rounded-2xl bg-[#d6ebdd]/75 p-4 text-sm font-semibold leading-6 text-[#315d4b]">{resumen.mensaje}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl bg-white/75 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#658173]">Días en que te expresaste</p>
                  <p className="mt-1 text-3xl font-black text-[#173f34]">{resumen.diasConRegistro}</p>
                  <p className="text-xs text-[#60766b]">Sin necesidad de que sean consecutivos.</p>
                </article>
                <article className="rounded-2xl bg-white/75 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#658173]">Últimos 14 días</p>
                  <p className="mt-1 text-3xl font-black text-[#173f34]">{resumen.diasUltimos14}</p>
                  <p className="text-xs text-[#60766b]">Días con algún registro, sin objetivos obligatorios.</p>
                </article>
              </div>
              {!!resumen.actividadReciente?.length && <section className="mt-4 rounded-2xl border border-[#c7dfce] bg-white/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-extrabold text-[#173f34]">Tu actividad reciente</h3>
                  <Link to="/mi-plan" className="min-h-10 content-center rounded-xl bg-[#246b55] px-3 text-sm font-bold text-white">Ir a mi plan</Link>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5" role="list" aria-label="Registro de los últimos 14 días">
                  {resumen.actividadReciente.map(dia => {
                    const label = fechaActividad.format(new Date(dia.fecha + 'T12:00:00Z')) + (dia.conRegistro ? ', con registro' : ', sin registro')
                    return <div key={dia.fecha} role="listitem" aria-label={label} title={label}
                      className={'grid min-h-9 place-items-center rounded-lg text-xs font-bold ' +
                        (dia.conRegistro ? 'bg-[#246b55] text-white' : 'bg-[#eef4f0] text-[#567162]')}>
                      {Number(dia.fecha.slice(-2))}
                    </div>
                  })}
                </div>
                <p className="mt-2 text-xs text-[#52695f]">Los días marcados tienen al menos una experiencia registrada.</p>
              </section>}
              {resumen.rachas && (
                <div className="mt-4 rounded-2xl border border-[#c7dfce] bg-[#eaf4eb] p-4 dark:border-[#568268] dark:bg-[#2b4838]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Flame size={19} className="text-[#267452] dark:text-[#c1e8cb]" aria-hidden="true" />
                    <h3 className="text-sm font-black text-[#173f34] dark:text-[#e5f7eb]">Rachas de seguimiento</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#587261] dark:text-[#bfdac7]">
                    Días seguidos en que registraste alguna experiencia. Son opcionales: no miden cuánto comiste ni califican tu salud.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/85 p-3 dark:bg-[#365845]">
                      <p className="text-xs font-semibold text-[#5b7968] dark:text-[#c3dbca]">Racha actual</p>
                      <p className="mt-1 text-2xl font-black tabular-nums text-[#184c38] dark:text-[#e5f7eb]">{resumen.rachas.actual} <span className="text-xs font-bold">días</span></p>
                    </div>
                    <div className="rounded-xl bg-white/85 p-3 dark:bg-[#365845]">
                      <p className="text-xs font-semibold text-[#5b7968] dark:text-[#c3dbca]">Mejor racha</p>
                      <p className="mt-1 text-2xl font-black tabular-nums text-[#184c38] dark:text-[#e5f7eb]">{resumen.rachas.maxima} <span className="text-xs font-bold">días</span></p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#587261] dark:text-[#bfdac7]">
                    {resumen.rachas.actual > 0
                      ? 'Hoy o ayer registraste una experiencia. ¡Gracias por darte ese espacio!'
                      : 'Puedes retomar cuando quieras. Tu mejor racha se conserva.'}
                  </p>
                </div>
              )}
              <div className="mt-6 flex items-center gap-2"><Award className="text-[#246b55]" size={21} /><h3 className="text-lg font-black text-[#173f34]">Momentos reconocidos</h3></div>
              {resumen.reconocimientos.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {resumen.reconocimientos.map((logro) => {
                    const Icono = ICONOS[logro.icono] || Award
                    return (
                      <article key={logro.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm transition hover:border-[#afcfba] dark:border-[#568268] dark:bg-[#2b4838]">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dceee4] text-[#246b55]"><Icono size={23} /></span>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[#173f34]">{logro.titulo}</h4>
                          <p className="mt-1 text-sm leading-5 text-[#60766b]">{logro.descripcion}</p>
                          <CompartirReconocimiento logro={logro}/>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-white/65 p-4 text-sm text-[#60766b]">Cuando quieras compartir tu primera experiencia, este espacio te acompañará.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
