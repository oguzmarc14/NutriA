import { useEffect, useState } from 'react'
import { Plus, RefreshCw, UserRound, X } from 'lucide-react'

import CardPaciente from '../components/pacientes/CardPaciente'
import CampoPaciente from '../components/pacientes/CampoPaciente'
import ModalEliminarPaciente from '../components/pacientes/ModalEliminarPaciente'
import client from '../api/client'

const formularioInicial = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  sex: 'unspecified',
  notes: '',
}

function PacientesPage() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [reenviandoId, setReenviandoId] = useState(null)
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
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

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-transparent px-4 py-6 sm:px-5 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* ============================================
            HEADER
        ============================================ */}

        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4d816f] sm:text-sm">
              Pacientes
            </p>

            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#173f34] sm:text-3xl md:text-4xl">
              Gestión de pacientes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Consulta y administra la
              información general de tus
              pacientes.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNuevoPaciente
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#246b55] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(36,107,85,0.2)] transition hover:bg-[#1d5947] sm:w-auto"
          >
            <Plus
              size={18}
              className="shrink-0"
            />

            Nuevo paciente
          </button>
        </div>

        {/* ============================================
            FORMULARIO
        ============================================ */}

        {mostrarFormulario && (
          <form
            onSubmit={
              guardarPaciente
            }
            className="mb-7 overflow-hidden rounded-3xl border border-[#cfe0d6] bg-white/85 p-4 shadow-[0_14px_40px_rgba(32,78,64,0.08)] backdrop-blur sm:p-5 md:p-6"
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
        )}

        {/* ERROR */}

        {error && (
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
        ) : (
          /* ============================================
             CARDS
          ============================================ */

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pacientes.map(
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
