import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Apple, Bell, CalendarClock, ClipboardList, Search, X, ArrowRight, CircleCheck, Settings } from 'lucide-react'
import useModalAccesible from '../../hooks/useModalAccesible'
import client from '../../api/client'
import { reunirAvisos, fechaCitaLegible } from '../../utils/centroAvisos'
import './centroAvisos.css'

const filtros = [
  { id: 'todos', texto: 'Todos' },
  { id: 'dietas', texto: 'Dietas' },
  { id: 'citas', texto: 'Citas' },
  { id: 'datos', texto: 'Datos' },
  { id: 'expediente', texto: 'Seguimiento' },
]

export default function CentroAvisosNutriologo({ modo = 'escritorio', triggerRef }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [pacientes, setPacientes] = useState([])
  const [citas, setCitas] = useState([])
  const [pagos, setPagos] = useState({ citas: [], reviews: [] })
  const [configSeguimiento, setConfigSeguimiento] = useState(null)
  const [hoySeguimiento, setHoySeguimiento] = useState(null)
  const [zonaSeguimiento, setZonaSeguimiento] = useState(null)
  const [recargar, setRecargar] = useState(0)
  const [actualizando, setActualizando] = useState(true)
  const [errores, setErrores] = useState([])
  const [bandeja, setBandeja] = useState([])
  const [guardando, setGuardando] = useState(false)
  const { modalRef, volverRef } = useModalAccesible({ abierto, onVolver: () => setAbierto(false) })
  const [visibleEnPantalla, setVisibleEnPantalla] = useState(() => {
    const escritorio = window.matchMedia('(min-width: 768px)').matches
    return modo === 'escritorio' ? escritorio : !escritorio
  })

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const actualizar = () => setVisibleEnPantalla(modo === 'escritorio' ? media.matches : !media.matches)
    actualizar()
    media.addEventListener('change', actualizar)
    return () => media.removeEventListener('change', actualizar)
  }, [modo])

  useEffect(() => {
    if (!visibleEnPantalla) return undefined
    let activo = true
    async function cargar() {
      setActualizando(true)
      setErrores([])
      const ahora = new Date()
      const hasta = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
      const respuestas = await Promise.allSettled([
        client.get('/pacientes'),
        client.get('/citas', { params: { desde: ahora.toISOString(), hasta: hasta.toISOString() } }),
        client.get('/horario/seguimiento'),
        client.get('/agenda-cobros/revision'),
        client.get('/push/notices'),
      ])
      if (!activo) return

      const fallos = []
      if (respuestas[0].status === 'fulfilled') {
        setPacientes(Array.isArray(respuestas[0].value.data?.pacientes) ? respuestas[0].value.data.pacientes : [])
      } else {
        setPacientes([])
        fallos.push('No se pudieron consultar los avisos por paciente.')
      }
      if (respuestas[1].status === 'fulfilled') {
        setCitas(Array.isArray(respuestas[1].value.data) ? respuestas[1].value.data : [])
      } else {
        setCitas([])
        fallos.push('No se pudo consultar la agenda.')
      }
      if (respuestas[2].status === 'fulfilled') {
        setConfigSeguimiento(respuestas[2].value.data.configuracion)
        setHoySeguimiento(respuestas[2].value.data.hoy)
        setZonaSeguimiento(respuestas[2].value.data.zonaHoraria)
      } else {
        setConfigSeguimiento(null)
        fallos.push('No se pudo cargar la configuración de seguimiento.')
      }
      if (respuestas[3].status === 'fulfilled') {
        const pago = respuestas[3].value.data
        setPagos({ citas: pago.citas || [], reviews: pago.reviews || [] })
      }
      if (respuestas[4].status === 'fulfilled') setBandeja(respuestas[4].value.data.notices || [])
      else fallos.push('No se pudo consultar la bandeja de notificaciones.')
      setErrores(fallos)
      setActualizando(false)
    }
    cargar()
    return () => { activo = false }
  }, [location.pathname, recargar, visibleEnPantalla])

  useEffect(() => {
    const actualizar = () => setRecargar(n => n + 1)
    const volver = () => {
      if (document.visibilityState === 'visible') actualizar()
    }
    window.addEventListener('nutria-seguimiento-actualizado', actualizar)
    window.addEventListener('nutria-horario-actualizado', actualizar)
    document.addEventListener('visibilitychange', volver)
    const intervalo = window.setInterval(actualizar, 5 * 60 * 1000)
    return () => {
      window.removeEventListener('nutria-seguimiento-actualizado', actualizar)
      window.removeEventListener('nutria-horario-actualizado', actualizar)
      document.removeEventListener('visibilitychange', volver)
      window.clearInterval(intervalo)
    }
  }, [])

  const avisos = useMemo(() => {
    const pagosPendientes = [
      ...pagos.citas.map(cita => ({ ...cita, titulo: 'Cita confirmada y pagada', detalle: 'Marca la cita como enterado en la agenda.' })),
      ...pagos.reviews.map(pago => ({ ...pago, titulo: 'Pago recibido · Requiere revisión', detalle: pago.changeReason })),
    ].map(item => ({
      id: 'pago:' + item._id, tipo: 'pago', filtro: 'citas', categoria: 'Pagos de citas',
      titulo: item.titulo, detalle: item.detalle, pacienteNombre: item.patient?.name || 'Paciente',
    }))
    const citasEnRevision = new Set(pagos.citas.map(cita => cita._id))
    const mensajes = bandeja.filter(aviso => ['/planes', '/citas'].includes(aviso.route)).map(aviso => {
      const dieta = aviso.route === '/planes'
      return { ...aviso, id: 'bandeja:' + aviso.id, tipo: 'mensaje', filtro: dieta ? 'dietas' : 'citas', categoria: dieta ? 'Dietas' : 'Citas' }
    })
    return [...mensajes, ...pagosPendientes, ...reunirAvisos(pacientes, citas.filter(cita => !citasEnRevision.has(cita._id)),
      new Date(), configSeguimiento, hoySeguimiento, zonaSeguimiento)]
  }, [bandeja, pacientes, citas, pagos, configSeguimiento, hoySeguimiento, zonaSeguimiento])
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    return avisos.filter((aviso) =>
      (filtro === 'todos' || aviso.filtro === filtro) &&
      (!termino || [aviso.pacienteNombre, aviso.titulo, aviso.categoria].some((valor) =>
        String(valor).toLocaleLowerCase('es').includes(termino))),
    )
  }, [avisos, filtro, busqueda])

  function abrir() {
    setFiltro('todos')
    setBusqueda('')
    setAbierto(true)
    setRecargar((n) => n + 1)
  }

  function atender(aviso) {
    setAbierto(false)
    if (aviso.tipo === 'mensaje') {
      navigate(aviso.route)
    } else if (aviso.tipo === 'cita' || aviso.tipo === 'pago') {
      navigate('/citas')
    } else {
      // No cambiar silenciosamente de paciente; se abre el panel ya existente.
      navigate('/pacientes', { state: { abrirAvisosPacienteId: aviso.pacienteId } })
    }
  }

  const mensajesSinLeer = bandeja.filter(aviso => ['/planes', '/citas'].includes(aviso.route) && !aviso.seen)
  async function marcarLeidos() {
    if (guardando || !mensajesSinLeer.length) return
    setGuardando(true)
    const ids = mensajesSinLeer.map(aviso => aviso.id)
    try {
      await client.post('/push/notices/seen', { ids })
      setBandeja(actual => actual.map(aviso => ids.includes(aviso.id) ? { ...aviso, seen: true } : aviso))
    } catch {
      setErrores(actual => [...new Set([...actual, 'No se pudieron marcar las notificaciones como leídas.'])])
    } finally {
      setGuardando(false)
    }
  }

  const numero = avisos.filter(aviso => !aviso.seen).length
  const badge = numero > 99 ? '99+' : String(numero)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={abrir} title="Notificaciones" aria-label={`Notificaciones: ${numero} avisos por revisar`}
        aria-haspopup="dialog" aria-expanded={abierto}
        className="nutria-centro-trigger relative grid size-11 shrink-0 place-items-center rounded-xl border transition" >
        <Bell size={19} aria-hidden="true"/>
        {!actualizando && !errores.length && numero > 0 && (
          <span aria-hidden="true" className="nutria-centro-count absolute -right-2 -top-2 min-w-[21px] rounded-full px-1 py-0.5 text-center text-[10px] font-black leading-none">{badge}</span>
        )}
      </button>

      {abierto && createPortal(
        <div className="nutria-centro-overlay fixed inset-0 z-[180] grid place-items-center p-3 sm:p-6"
          onClick={(event) => { if (event.target === event.currentTarget) setAbierto(false) }}>
          <section ref={modalRef} id="nutria-centro-aviso-dialog" role="dialog" aria-modal="true"
            aria-labelledby="nutria-centro-titulo" aria-describedby="nutria-centro-descripcion"
            className="nutria-centro-dialog flex max-h-[min(90dvh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border shadow-2xl">
            <header className="flex items-start gap-3 border-b border-current/10 px-4 py-4 sm:px-6 sm:py-5">
              <span className="nutria-centro-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl"><Bell size={22}/></span>
              <div className="min-w-0 flex-1">
                <h2 id="nutria-centro-titulo" className="text-xl font-black">Notificaciones</h2>
                <p id="nutria-centro-descripcion" className="mt-1 text-xs leading-5 opacity-80">
                  Dietas, citas y seguimiento de tu consultorio.
                </p>
              </div>
              <button ref={volverRef} type="button" onClick={() => setAbierto(false)}
                className="nutria-centro-secondary grid h-9 w-9 shrink-0 place-items-center rounded-xl border" aria-label="Cerrar notificaciones">
                <X size={18}/>
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold" aria-live="polite">
                  {actualizando ? 'Cargando avisos…' : errores.length ? 'Datos parcialmente disponibles' : `${numero} ${numero === 1 ? 'asunto' : 'asuntos'} por revisar`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/editar-perfil#recordatorios-seguimiento" onClick={() => setAbierto(false)}
                    className="nutria-centro-secondary inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold">
                    <Settings size={16} aria-hidden="true"/> Configuración
                  </Link>
                  {mensajesSinLeer.length > 0 && <button type="button" onClick={marcarLeidos} disabled={guardando}
                    className="nutria-centro-primary min-h-10 rounded-xl px-3 text-sm font-bold disabled:opacity-60">
                    Marcar como leídas
                  </button>}
                </div>
              </div>

              {errores.length > 0 && <div role="alert" className="nutria-centro-error mt-3 rounded-xl border p-3 text-sm">{errores.join(' ')}</div>}

              <label className="nutria-centro-search relative mt-4 block">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/>
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar paciente o aviso..." aria-label="Buscar avisos"
                  className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none"/>
              </label>

              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar avisos">
                {filtros.map((item) => (
                  <button type="button" key={item.id} onClick={() => setFiltro(item.id)} aria-pressed={filtro === item.id}
                    className={`nutria-centro-filter min-h-10 flex-1 whitespace-nowrap rounded-xl border px-3 text-sm font-bold ${filtro === item.id ? 'nutria-centro-filter--active' : ''}`}>
                    {item.texto}
                  </button>
                ))}
              </div>

              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pb-2" aria-live="polite">
                {actualizando && !avisos.length && <p className="py-6 text-center text-sm opacity-75">Consultando pendientes y agenda...</p>}
                {!actualizando && visibles.length === 0 && (
                  <div className="nutria-centro-item flex flex-col items-center gap-2 rounded-2xl border p-6 text-center">
                    <CircleCheck size={28} aria-hidden="true"/>
                    <p className="text-sm font-bold">{errores.length ? 'No hay datos suficientes para mostrar avisos.' : 'No hay avisos con estos filtros.'}</p>
                  </div>
                )}
                {!actualizando && visibles.map((aviso) => (
                  <article key={aviso.id} className="nutria-centro-item flex flex-wrap items-start gap-3 rounded-2xl border p-3 sm:flex-nowrap sm:p-4">
                    <span className="nutria-centro-icon mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl">
                      {aviso.filtro === 'dietas' ? <Apple size={18}/> : aviso.filtro === 'citas' ? <CalendarClock size={18}/> : <ClipboardList size={18}/>}
                    </span>
                    <div className="min-w-[8rem] flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{aviso.categoria}{aviso.tipo === 'mensaje' && !aviso.seen ? ' · Sin leer' : ''}</p>
                      <h3 className="mt-1 break-words text-sm font-extrabold">{aviso.titulo}</h3>
                      {aviso.pacienteNombre && <p className="mt-1 break-words text-xs font-bold">{aviso.pacienteNombre}</p>}
                      <p className="mt-1 text-xs leading-5 opacity-80">
                        {aviso.tipo === 'cita' ? `Programada para ${fechaCitaLegible(aviso.fecha, aviso.zonaHoraria)}` : aviso.detalle}
                      </p>
                    </div>
                    <button type="button" onClick={() => atender(aviso)} aria-label={aviso.filtro === 'dietas' ? 'Ver planes alimenticios' : aviso.tipo === 'mensaje' ? 'Ver citas' : `Revisar ${aviso.titulo} de ${aviso.pacienteNombre}`}
                      className="nutria-centro-primary inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-bold">
                      {aviso.filtro === 'dietas' ? 'Ver planes' : aviso.tipo === 'mensaje' ? 'Ver citas' : 'Revisar'} <ArrowRight size={13}/>
                    </button>
                  </article>
                ))}
              </div>
            </div>
            <footer className="flex items-center justify-between gap-2 border-t border-current/10 px-4 py-3 sm:px-6">
              <p className="text-[11px] opacity-70">Citas próximas y seguimientos configurados · No son alertas clínicas</p>
              <button type="button" onClick={() => setAbierto(false)} className="nutria-centro-secondary min-h-9 rounded-lg border px-4 text-xs font-bold">Cerrar</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}
