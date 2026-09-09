import { useEffect, useState } from 'react'
import {
  CalendarDays,
  ClipboardPlus,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react'

import { Link } from 'react-router-dom'
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

  const [error, setError] = useState('')

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

              <CampoFormulario
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
              </CampoFormulario>

              {/* CORREO */}

              <CampoFormulario label="Correo">
                <input
                  type="email"
                  name="email"
                  value={
                    formulario.email
                  }
                  onChange={
                    manejarCambio
                  }
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                />
              </CampoFormulario>

              {/* TELÉFONO */}

              <CampoFormulario label="Teléfono">
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
              </CampoFormulario>

              {/* NACIMIENTO */}

              <CampoFormulario label="Fecha de nacimiento">
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
              </CampoFormulario>

              {/* SEXO */}

              <CampoFormulario label="Sexo">
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
              </CampoFormulario>

              {/* NOTAS */}

              <div className="md:col-span-2">
                <CampoFormulario label="Notas">
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
                </CampoFormulario>
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
                <PacienteCard
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
                  obtenerSexo={
                    obtenerSexo
                  }
                  calcularEdad={
                    calcularEdad
                  }
                  obtenerInicial={
                    obtenerInicial
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
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

/*
 * ----------------------------------------------------
 * CAMPO FORMULARIO
 * ----------------------------------------------------
 */

function CampoFormulario({
  label,
  required,
  children,
}) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}

/*
 * ----------------------------------------------------
 * CARD PACIENTE
 * ----------------------------------------------------
 */

function PacienteCard({
  paciente,
  onEditar,
  obtenerSexo,
  calcularEdad,
  obtenerInicial,
}) {
  const edad =
    calcularEdad(
      paciente.birthDate,
    )

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_17px_38px_rgba(36,107,85,0.12)] sm:p-5">
      {/* HEADER CARD */}

      <div className="flex min-w-0 items-start gap-3">
        {/* AVATAR */}

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e3f1ea] text-base font-black text-[#246b55] sm:h-13 sm:w-13">
          {obtenerInicial(
            paciente.name,
          )}
        </div>

        {/* NOMBRE */}

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-extrabold leading-5 text-[#173f34]">
            {paciente.name}
          </h2>

          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
            {edad !== null && (
              <span>
                {edad} años
              </span>
            )}

            <span>
              {obtenerSexo(
                paciente.sex,
              )}
            </span>
          </div>
        </div>

        {/* EDITAR */}

        <button
          type="button"
          onClick={onEditar}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf5f1] text-[#246b55] transition hover:bg-[#dcece5]"
          aria-label={`Editar ${paciente.name}`}
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* DATOS */}

      <div className="mt-5 space-y-3 border-y border-[#edf2ef] py-4">
        {/* EMAIL */}

        <DatoPaciente
          icon={Mail}
          label="Correo"
          value={
            paciente.email ||
            'Sin correo registrado'
          }
        />

        {/* TELÉFONO */}

        <DatoPaciente
          icon={Phone}
          label="Teléfono"
          value={
            paciente.phone ||
            'Sin registrar'
          }
        />

        {/* NACIMIENTO */}

        {paciente.birthDate && (
          <DatoPaciente
            icon={CalendarDays}
            label="Fecha de nacimiento"
            value={new Intl.DateTimeFormat(
              'es-MX',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              },
            ).format(
              new Date(
                paciente.birthDate,
              ),
            )}
          />
        )}
      </div>

      {/* NOTAS */}

      {paciente.notes && (
        <div className="mt-4 rounded-xl bg-[#f8faf9] p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#83958d]">
            Notas
          </p>

          <p className="break-words text-sm leading-5 text-slate-600">
            {paciente.notes}
          </p>
        </div>
      )}

      {/* EXPEDIENTE */}

      <div className="mt-4">
        <Link
          to={`/pacientes/${paciente._id}/expediente`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-3 text-sm font-extrabold text-[#246b55] transition hover:bg-[#246b55] hover:text-white"
        >
          <ClipboardPlus
            size={17}
            className="shrink-0"
          />

          Expediente
        </Link>
      </div>
    </article>
  )
}

/*
 * ----------------------------------------------------
 * DATO CARD
 * ----------------------------------------------------
 */

function DatoPaciente({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#edf5f1] text-[#4d816f]">
        <Icon size={14} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">
          {label}
        </p>

        <p className="break-words text-sm font-semibold leading-5 text-[#405b51]">
          {value}
        </p>
      </div>
    </div>
  )
}

export default PacientesPage