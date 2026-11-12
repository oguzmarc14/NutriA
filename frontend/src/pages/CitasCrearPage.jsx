import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarPlus2, CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import client from '../api/client'
import SelectorCrearCita from '../components/citas/SelectorCrearCita'
import AvisoConfigurarCitas from '../components/citas/AvisoConfigurarCitas'
import { fechaActualDispositivo, rangoVistaAgenda } from '../utils/vistasAgenda'
import '../components/citas/agenda.css'

const TIPOS = [
  ['primera', 'Primera consulta'],
  ['seguimiento', 'Seguimiento'],
  ['otra', 'Otra consulta'],
]

export default function CitasCrearPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Vista Día por defecto; al cambiar entre vistas se conserva el día de referencia.
  const [vista, setVista] = useState('dia')
  const [fechaFoco, setFechaFoco] = useState(location.state?.fecha || fechaActualDispositivo())
  const [hoy, setHoy] = useState(null)
  const [data, setData] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [paciente, setPaciente] = useState('')
  const [tipo, setTipo] = useState('seguimiento')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cargandoPacientes, setCargandoPacientes] = useState(true)
  const [error, setError] = useState('')
  const [errorPacientes, setErrorPacientes] = useState('')
  const [ok, setOk] = useState('')
  const [reload, setReload] = useState(0)
  const [sinConfiguracion, setSinConfiguracion] = useState(false)
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const inicioSugerido = useRef(location.state?.inicio || null)
  const rango = useMemo(() => rangoVistaAgenda(vista, fechaFoco), [vista, fechaFoco])

  // No solicitar la lista completa de pacientes cada vez que se cambia de mes.
  useEffect(() => {
    const controller = new AbortController()
    setCargandoPacientes(true)
    client.get('/pacientes', { signal: controller.signal })
      .then(({ data: respuesta }) => {
        if (controller.signal.aborted) return
        setPacientes(Array.isArray(respuesta)
          ? respuesta : respuesta.pacientes || respuesta.data || [])
        setErrorPacientes('')
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setErrorPacientes(err.response?.data?.message || 'No se pudieron cargar los pacientes.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoPacientes(false)
      })
    return () => controller.abort()
  }, [])

  // Una consulta por periodo (día: 1, semana: 7, mes: 42 días).
  // Seleccionar otro día dentro de la misma semana/mes NO vuelve a consultar.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    client.get('/horario/disponibilidad', {
      params: { desde: rango.desde, dias: rango.dias },
      signal: controller.signal,
    }).then(({ data: respuesta }) => {
      if (controller.signal.aborted) return
      setData(respuesta)
      setSinConfiguracion(false)
      setMostrarAviso(false)
      if (respuesta.hoy) {
        setHoy(respuesta.hoy)
        if (fechaFoco < respuesta.hoy) setFechaFoco(respuesta.hoy)
      }

      const sugerido = inicioSugerido.current
      const encontrado = sugerido && respuesta.dias.find(d =>
        d.espacios.some(hora => hora.inicio === sugerido))
      if (encontrado) {
        const espacio = encontrado.espacios.find(hora => hora.inicio === sugerido)
        setSeleccion({ ...espacio, fecha: encontrado.fecha })
        setFechaFoco(encontrado.fecha)
        inicioSugerido.current = null
      } else {
        // Al refrescar no conservar un horario que otra cita haya ocupado.
        setSeleccion(actual => actual && respuesta.dias.some(d =>
          d.espacios.some(hora => hora.inicio === actual.inicio)) ? actual : null)
      }
    }).catch(err => {
      if (controller.signal.aborted) return
      setData(null)
      const mensaje = err.response?.data?.message || ''
      const requiereConfigurar = err.response?.status === 409 &&
        /configur|bloques de citas|horarios/i.test(mensaje)
      setSinConfiguracion(requiereConfigurar)
      setMostrarAviso(requiereConfigurar)
      if (!requiereConfigurar) {
        setError(mensaje || 'No fue posible consultar los horarios. Intenta actualizar la agenda.')
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [rango.desde, rango.dias, reload])

  async function registrar(event) {
    event.preventDefault()
    setError('')
    setOk('')
    if (!paciente || !seleccion) {
      setError('Selecciona un paciente y un horario disponible.')
      return
    }
    setGuardando(true)
    try {
      const respuesta = await client.post('/citas', {
        patient: paciente,
        inicio: seleccion.inicio,
        zonaHoraria: data.zonaHoraria,
        tipo,
        estado: 'programada',
        notas,
      })
      setOk('Cita registrada correctamente.' +
        (respuesta.data.calendarSynced === false ? ' Google Calendar no confirmó la sincronización.' : ''))
      setSeleccion(null)
      setNotas('')
      setReload(n => n + 1)
    } catch (err) {
      setError(err.response?.data?.message ||
        'No se pudo registrar la consulta. Actualiza la disponibilidad y elige otro horario.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1240px] space-y-5 overflow-x-clip p-4 pb-28 md:p-8">
      <header className="rounded-[27px] bg-linear-to-r from-[#194735] to-[#2b7553] p-6 text-white sm:p-8">
        <Link to="/citas" className="inline-flex min-h-9 items-center gap-2 text-sm font-bold text-[#dbf4e1]">
          <ArrowLeft size={17}/>Volver a ver citas
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <CalendarPlus2 size={30}/>
          <h1 className="text-2xl font-black sm:text-3xl">Crear cita</h1>
        </div>
        <p className="mt-2 text-sm text-[#d1eada]">
          Consulta la disponibilidad por día, semana o mes y registra un espacio libre.
        </p>
        <button type="button" onClick={() => setReload(n => n + 1)}
          className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/30 px-3 text-xs font-bold hover:bg-white/15">
          <RefreshCw size={15}/>Actualizar espacios
        </button>
      </header>

      {error && <div role="alert" className="nutria-agenda-error rounded-xl border p-4 text-sm font-semibold">{error}</div>}
      {errorPacientes && <div role="alert" className="nutria-agenda-error rounded-xl border p-4 text-sm font-semibold">{errorPacientes}</div>}
      {ok && <div role="status" className="nutria-agenda-success flex items-center gap-2 rounded-xl p-4 text-sm font-bold">
        <CheckCircle2 size={18}/>{ok}
      </div>}

      {!loading && !data ? (
        <div className="nutria-agenda-panel rounded-[24px] border p-6">
          <h2 className="text-xl font-extrabold">
            {sinConfiguracion ? 'Primero configura los horarios de consulta' : 'No se pudieron mostrar los espacios'}
          </h2>
          <p className="mt-2 text-sm opacity-80">
            {sinConfiguracion
              ? 'Define los bloques para mostrar solamente los horarios en los que atiendes.'
              : 'Actualiza la disponibilidad o revisa tu conexión.'}
          </p>
          {sinConfiguracion && (
            <button type="button" onClick={() => setMostrarAviso(true)}
              className="nutria-agenda-primary mt-4 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold">
              Configurar bloques de citas
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={registrar}
          className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="nutria-agenda-panel w-full min-w-0 max-w-full rounded-[24px] border p-3 sm:p-6">
            <h2 className="mb-4 text-lg font-extrabold">1. Selecciona fecha y hora</h2>
            {loading || !data ? (
              <p role="status" className="nutria-agenda-muted rounded-xl p-5 text-center text-sm">
                Cargando disponibilidad {vista === 'dia' ? 'diaria' : vista === 'semana' ? 'semanal' : 'mensual'}...
              </p>
            ) : (
              <SelectorCrearCita
                vista={vista} onVista={setVista}
                foco={fechaFoco} onFoco={setFechaFoco}
                hoy={hoy || data.hoy}
                dias={data.dias} seleccion={seleccion} onSelect={setSeleccion}
                zonaHoraria={data.zonaHoraria}
              />
            )}
          </section>

          <section className="nutria-agenda-panel w-full min-w-0 max-w-full rounded-[24px] border p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <ClipboardList size={19}/>2. Datos de la cita
            </h2>
            <div className="space-y-4">
              <label className="grid gap-2 text-sm font-bold">
                Paciente
                <select required value={paciente} onChange={e => setPaciente(e.target.value)}
                  className="nutria-agenda-input min-h-11 min-w-0 rounded-xl border p-3 text-sm">
                  <option value="">{cargandoPacientes ? 'Cargando pacientes...' : 'Selecciona un paciente'}</option>
                  {pacientes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Tipo de consulta
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  className="nutria-agenda-input min-h-11 rounded-xl border p-3 text-sm">
                  {TIPOS.map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Notas privadas (opcional)
                <textarea rows={3} maxLength={500} value={notas}
                  onChange={e => setNotas(e.target.value)}
                  className="nutria-agenda-input rounded-xl border p-3 text-sm"
                  placeholder="Detalles administrativos de esta consulta"/>
              </label>
              <div className="nutria-agenda-day rounded-xl border p-3 text-sm">
                {seleccion ? (
                  <p><strong>{seleccion.fecha}</strong> a las <strong>{seleccion.hora}</strong>
                    <span className="mt-1 block text-xs opacity-70">
                      {data?.zonaHoraria} · 60 minutos
                    </span>
                  </p>
                ) : <p className="opacity-70">Elige primero un horario disponible.</p>}
              </div>
              <button type="submit" disabled={guardando || loading || !seleccion || !paciente}
                className="nutria-agenda-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black disabled:opacity-50">
                <CalendarPlus2 size={18}/>{guardando ? 'Registrando cita…' : 'Confirmar y registrar cita'}
              </button>
              {ok && (
                <button type="button" onClick={() => navigate('/citas')}
                  className="nutria-agenda-text min-h-10 text-sm font-bold underline">
                  Ver citas registradas
                </button>
              )}
            </div>
          </section>
        </form>
      )}

      <AvisoConfigurarCitas
        abierto={mostrarAviso}
        onIr={() => navigate('/citas', { state:{ abrirConfiguracion:true } })}
        onCancelar={() => setMostrarAviso(false)}
      />
    </main>
  )
}
