import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Search, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import CardPaciente from '../components/pacientes/CardPaciente'
import CampoPaciente from '../components/pacientes/CampoPaciente'
import ModalEliminarPaciente from '../components/pacientes/ModalEliminarPaciente'
import ModalPacienteCreado from '../components/pacientes/ModalPacienteCreado'
import client from '../api/client'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'

const formularioInicial = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  sex: 'unspecified',
  notes: '',
}

function PacientesPage() {
  const navigate = useNavigate()
  const { cerrarTrabajo, iniciarTrabajo, pacienteTrabajo } = usePacienteTrabajo()
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [reenviandoId, setReenviandoId] = useState(null)
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [pacienteCreado, setPacienteCreado] = useState(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [pacienteEditando, setPacienteEditando] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  /*
   * ----------------------------------------------------
   * CARGAR PACIENTES
   * ----------------------------------------------------
   */

  async function cargarPacientes() {
    try {
      setLoading(true)
      setError('')

      const { data } =
        await client.get('/pacientes')

      setPacientes(data.pacientes || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible cargar los pacientes',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPacientes()
  }, [])

  /*
   * ----------------------------------------------------
   * FORMULARIO
   * ----------------------------------------------------
   */

  function manejarCambio(event) {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  function abrirNuevoPaciente() {
    setPacienteEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMostrarFormulario(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function editarPaciente(paciente) {
    setPacienteEditando(paciente)

    setFormulario({
      name: paciente.name || '',
      email: paciente.email || '',
      phone: paciente.phone || '',

      birthDate: paciente.birthDate
        ? paciente.birthDate.slice(0, 10)
        : '',

      sex:
        paciente.sex ||
        'unspecified',

      notes:
        paciente.notes ||
        '',
    })

    setError('')
    setMostrarFormulario(true)

  }

  function cancelarFormulario() {
    setMostrarFormulario(false)
    setPacienteEditando(null)
    setFormulario(formularioInicial)
    setError('')
  }

  /*
   * ----------------------------------------------------
   * GUARDAR
   * ----------------------------------------------------
   */

  async function guardarPaciente(event) {
    event.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const payload = {
        ...formulario,
      }

      if (!payload.birthDate) {
        delete payload.birthDate
      }

      if (pacienteEditando) {
        const { data } =
          await client.put(
            `/pacientes/${pacienteEditando._id}`,
            payload,
          )

        setPacientes((actuales) =>
          actuales.map((paciente) =>
            paciente._id ===
            data.paciente._id
              ? {
                  ...paciente,
                  ...data.paciente,
                }
              : paciente,
          ),
        )

        if (pacienteTrabajo?.id === data.paciente._id) {
          iniciarTrabajo(data.paciente)
        }
      } else {
        const { data } =
          await client.post(
            '/pacientes',
            payload,
          )

        setPacientes((actuales) => [
          data.paciente,
          ...actuales,
        ])

        setFormulario(formularioInicial)
        setMostrarFormulario(false)
        setPacienteCreado(data.paciente)
        return
      }

      setFormulario(formularioInicial)
      setPacienteEditando(null)
      setMostrarFormulario(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (pacienteEditando
            ? 'No fue posible actualizar el paciente'
            : 'No fue posible registrar el paciente'),
      )
    } finally {
      setGuardando(false)
    }
  }

  async function reenviarInvitacion(paciente) {
    try {
      setReenviandoId(paciente._id)
      setError('')
      await client.post(`/pacientes/${paciente._id}/reenviar-invitacion`)
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible reenviar la invitación')
    } finally {
      setReenviandoId(null)
    }
  }

  async function eliminarPaciente() {
    if (!pacienteAEliminar) return

    try {
      setEliminando(true)
      setError('')
      setMensaje('')

      const { data } = await client.delete(`/pacientes/${pacienteAEliminar._id}`)

      setPacientes((actuales) =>
        actuales.filter((paciente) => paciente._id !== pacienteAEliminar._id),
      )

      if (pacienteTrabajo?.id === pacienteAEliminar._id) {
        cerrarTrabajo()
      }
      setMensaje(data.message || 'Paciente eliminado correctamente')
      setPacienteAEliminar(null)
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible eliminar al paciente')
    } finally {
      setEliminando(false)
    }
  }

  /*
   * ----------------------------------------------------
   * HELPERS
   * ----------------------------------------------------
   */

  function obtenerSexo(sex) {
    const opciones = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      unspecified:
        'Sin especificar',
    }

    return (
      opciones[sex] ||
      'Sin especificar'
    )
  }

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) {
      return null
    }

    const nacimiento =
      new Date(fechaNacimiento)

    const hoy = new Date()

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear()

    const diferenciaMes =
      hoy.getMonth() -
      nacimiento.getMonth()

    if (
      diferenciaMes < 0 ||
      (diferenciaMes === 0 &&
        hoy.getDate() <
          nacimiento.getDate())
    ) {
      edad -= 1
    }

    return edad
  }

  function obtenerInicial(nombre) {
    return (
      nombre
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() ||
      'P'
    )
  }

  const terminoBusqueda = busqueda.trim().toLocaleLowerCase('es')
  const pacientesFiltrados = pacientes.filter((paciente) =>
    [paciente.name, paciente.email, paciente.phone]
      .some((valor) => String(valor || '').toLocaleLowerCase('es').includes(terminoBusqueda)),
  )

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-transparent px-4 py-6 sm:px-5 md:px-8 md:py-8">
      <ModalPacienteCreado
        paciente={pacienteCreado}
        onAceptar={() => {
          iniciarTrabajo(pacienteCreado)
          navigate(`/pacientes/${pacienteCreado._id}/expediente`)
        }}
      />
      <div className="mx-auto w-full max-w-6xl">
        {/* ============================================
            HEADER
        ============================================ */}

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[27px] font-black leading-tight tracking-tight text-[#173f34] sm:text-3xl">
              Pacientes
            </h1>
            <p className="mt-1 text-xs font-medium text-[#648476]">
              {loading ? 'Cargando...' : `${pacientes.length} ${pacientes.length === 1 ? 'paciente' : 'pacientes'} registrados`}
            </p>
            {pacienteTrabajo && (
              <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#b8d6c4] bg-[#e6f2e9] py-1.5 pl-3 pr-1.5">
                <span className="min-w-0 truncate text-xs font-semibold text-[#246b55]" title={pacienteTrabajo.name || 'Paciente activo'}>
                  Trabajando con: {pacienteTrabajo.name || 'Paciente activo'}
                </span>
                <button type="button" onClick={cerrarTrabajo} title="Dejar de trabajar con este paciente" aria-label="Dejar de trabajar con el paciente" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-[#a63c3c] transition hover:bg-red-50">
                  <X size={13}/> Cerrar
                </button>
              </div>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
            <label className="relative block min-w-0 flex-1 sm:min-w-[240px] lg:w-[300px]">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#729384]" />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar paciente..."
                aria-label="Buscar pacientes por nombre, correo o teléfono"
                className="h-11 w-full rounded-xl border border-[#cadfd1] bg-white/80 pl-10 pr-4 text-sm text-[#173f34] outline-none transition placeholder:text-[#8b9d93] focus:border-[#4d816f] focus:ring-2 focus:ring-[#cce3d4]"
              />
            </label>
            <button
              type="button"
              onClick={abrirNuevoPaciente}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(36,107,85,.16)] transition hover:bg-[#1d5947]"
            >
              <Plus size={18} className="shrink-0" />
              Nuevo paciente
            </button>
          </div>
        </div>

        {/* ============================================
            FORMULARIO
        ============================================ */}

        {mostrarFormulario && (
          <div className={pacienteEditando ? 'fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#102e24]/55 p-3 backdrop-blur-[3px] sm:p-6' : ''}>
          <form
            onSubmit={
              guardarPaciente
            }
            role={pacienteEditando ? 'dialog' : undefined}
            aria-modal={pacienteEditando ? 'true' : undefined}
            aria-label={pacienteEditando ? 'Editar paciente' : undefined}
            className={`overflow-hidden rounded-3xl border border-[#cfe0d6] bg-white/95 p-4 shadow-[0_14px_40px_rgba(32,78,64,0.08)] backdrop-blur sm:p-5 md:p-6 ${pacienteEditando ? 'my-auto max-h-[calc(100dvh-24px)] w-full max-w-2xl overflow-y-auto sm:max-h-[calc(100dvh-48px)]' : 'mb-7'}`}
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#4d816f]">
                  {pacienteEditando
                    ? 'Edición'
                    : 'Registro'}
                </p>

                <h2 className="text-xl font-extrabold text-[#173f34] sm:text-2xl">
                  {pacienteEditando
                    ? 'Editar paciente'
                    : 'Nuevo paciente'}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {pacienteEditando
                    ? 'Actualiza la información general del paciente.'
                    : 'Registra los datos generales del nuevo paciente.'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cancelarFormulario
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Cerrar formulario"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* NOMBRE */}

              <CampoPaciente
                label="Nombre"
                required
              >
                <input
                  type="text"
                  name="name"
                  value={
                    formulario.name
                  }
                  onChange={
                    manejarCambio
                  }
                  required
                  className={inputClass}
                  placeholder="Nombre completo"
                />
              </CampoPaciente>

              {/* CORREO */}

              <CampoPaciente label="Correo" required={!pacienteEditando}>
                <input
                  type="email"
                  name="email"
                  value={
                    formulario.email
                  }
                  onChange={
                    manejarCambio
                  }
                  required={!pacienteEditando}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                />
              </CampoPaciente>

              {/* TELÉFONO */}

              <CampoPaciente label="Teléfono">
                <input
                  type="tel"
                  name="phone"
                  value={
                    formulario.phone
                  }
                  onChange={
                    manejarCambio
                  }
                  className={inputClass}
                  placeholder="4491234567"
                />
              </CampoPaciente>

              {/* NACIMIENTO */}

              <CampoPaciente label="Fecha de nacimiento">
                <input
                  type="date"
                  name="birthDate"
                  value={
                    formulario.birthDate
                  }
                  onChange={
                    manejarCambio
                  }
                  className={inputClass}
                />
              </CampoPaciente>

              {/* SEXO */}

              <CampoPaciente label="Sexo">
                <select
                  name="sex"
                  value={
                    formulario.sex
                  }
                  onChange={
                    manejarCambio
                  }
                  className={`${inputClass} bg-white`}
                >
                  <option value="unspecified">
                    Sin especificar
                  </option>

                  <option value="male">
                    Masculino
                  </option>

                  <option value="female">
                    Femenino
                  </option>

                  <option value="other">
                    Otro
                  </option>
                </select>
              </CampoPaciente>

              {/* NOTAS */}

              <div className="md:col-span-2">
                <CampoPaciente label="Notas">
                  <textarea
                    name="notes"
                    value={
                      formulario.notes
                    }
                    onChange={
                      manejarCambio
                    }
                    rows="3"
                    className={`${inputClass} resize-none`}
                    placeholder="Notas generales del paciente"
                  />
                </CampoPaciente>
              </div>
            </div>

            {pacienteEditando && error && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            {/* BOTONES */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  cancelarFormulario
                }
                disabled={
                  guardando
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  guardando
                }
                className="w-full rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(36,107,85,0.17)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {guardando
                  ? 'Guardando...'
                  : pacienteEditando
                    ? 'Guardar cambios'
                    : 'Guardar paciente'}
              </button>
            </div>
          </form>
          </div>
        )}

        {/* ERROR */}

        {error && !pacienteEditando && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {mensaje}
          </div>
        )}

        {/* ============================================
            ESTADOS
        ============================================ */}

        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/55 p-5 text-sm text-slate-500">
            <RefreshCw
              className="animate-spin"
              size={17}
            />

            Cargando pacientes...
          </div>
        ) : pacientes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-8 text-center sm:p-10">
            <UserRound
              className="mx-auto mb-3 text-[#4d816f]"
              size={36}
            />

            <h2 className="font-bold text-[#173f34]">
              Aún no hay pacientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registra el primer
              paciente para comenzar.
            </p>

            <button
              type="button"
              onClick={
                abrirNuevoPaciente
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white"
            >
              <Plus size={17} />

              Nuevo paciente
            </button>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-[#d5e4d9] bg-white/70 px-6 py-10 text-center">
            <Search size={26} className="mx-auto mb-3 text-[#699581]" />
            <p className="font-bold text-[#173f34]">No encontramos pacientes</p>
            <p className="mt-1 text-sm text-slate-500">Prueba con otro nombre, correo o teléfono.</p>
            <button type="button" onClick={() => setBusqueda('')} className="mt-4 text-sm font-bold text-[#246b55] hover:underline">Limpiar búsqueda</button>
          </div>
        ) : (
          /* ============================================
             CARDS
          ============================================ */

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pacientesFiltrados.map(
              (paciente) => (
                <CardPaciente
                  key={
                    paciente._id
                  }
                  paciente={
                    paciente
                  }
                  onEditar={() =>
                    editarPaciente(
                      paciente,
                    )
                  }
                  onEliminar={() => {
                    setError('')
                    setMensaje('')
                    setPacienteAEliminar(paciente)
                  }}
                  onTrabajar={() => {
                    iniciarTrabajo(paciente)
                    navigate(`/pacientes/${paciente._id}/expediente`)
                  }}
                  trabajando={pacienteTrabajo?.id === paciente._id}
                  obtenerSexo={
                    obtenerSexo
                  }
                  calcularEdad={
                    calcularEdad
                  }
                  obtenerInicial={
                    obtenerInicial
                  }
                  onReenviar={() => reenviarInvitacion(paciente)}
                  reenviando={reenviandoId === paciente._id}
                  eliminando={eliminando && pacienteAEliminar?._id === paciente._id}
                />
              ),
            )}
          </div>
        )}
      </div>

      <ModalEliminarPaciente
        paciente={pacienteAEliminar}
        eliminando={eliminando}
        onCancelar={() => !eliminando && setPacienteAEliminar(null)}
        onConfirmar={eliminarPaciente}
      />
    </section>
  )
}

/*
 * ----------------------------------------------------
 * ESTILO INPUT
 * ----------------------------------------------------
 */

const inputClass =
  'w-full min-w-0 rounded-xl border border-[#d5e1db] bg-white/90 px-4 py-3 text-sm text-[#173f34] outline-none transition placeholder:text-slate-400 focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]'

export default PacientesPage
