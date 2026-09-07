import { useEffect, useState } from 'react'
import {
  ClipboardPlus,
  Pencil,
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
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [pacienteEditando, setPacienteEditando] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicial)

  async function cargarPacientes() {
    try {
      setLoading(true)
      setError('')

      const { data } = await client.get('/pacientes')
      setPacientes(data.pacientes)
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
      sex: paciente.sex || 'unspecified',
      notes: paciente.notes || '',
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

  async function guardarPaciente(event) {
    event.preventDefault()

    try {
      setError('')

      const payload = {
        ...formulario,
      }

      if (!payload.birthDate) {
        delete payload.birthDate
      }

      if (pacienteEditando) {
        const { data } = await client.put(
          `/pacientes/${pacienteEditando._id}`,
          payload,
        )

        setPacientes((actuales) =>
          actuales.map((paciente) =>
            paciente._id === data.paciente._id
              ? data.paciente
              : paciente,
          ),
        )
      } else {
        const { data } = await client.post(
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
    }
  }

  function obtenerSexo(sex) {
    const opciones = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      unspecified: 'Sin especificar',
    }

    return opciones[sex] || 'Sin especificar'
  }

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
            Pacientes
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
            Gestión de pacientes
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta y administra la información general de tus pacientes.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevoPaciente}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d5947]"
        >
          <Plus size={18} />
          Nuevo paciente
        </button>
      </div>

      {mostrarFormulario && (
        <form
          onSubmit={guardarPaciente}
          className="mb-8 rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#173f34]">
                {pacienteEditando
                  ? 'Editar paciente'
                  : 'Nuevo paciente'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {pacienteEditando
                  ? 'Actualiza la información general del paciente.'
                  : 'Registra la información general del paciente.'}
              </p>
            </div>

            <button
              type="button"
              onClick={cancelarFormulario}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar formulario"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre *
              </span>

              <input
                type="text"
                name="name"
                value={formulario.name}
                onChange={manejarCambio}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                placeholder="Nombre completo"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Correo
              </span>

              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Teléfono
              </span>

              <input
                type="text"
                name="phone"
                value={formulario.phone}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                placeholder="4491234567"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Fecha de nacimiento
              </span>

              <input
                type="date"
                name="birthDate"
                value={formulario.birthDate}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Sexo
              </span>

              <select
                name="sex"
                value={formulario.sex}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#4d816f]"
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
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Notas
              </span>

              <textarea
                name="notes"
                value={formulario.notes}
                onChange={manejarCambio}
                rows="3"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                placeholder="Notas generales del paciente"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={cancelarFormulario}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-[#246b55] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d5947]"
            >
              {pacienteEditando
                ? 'Guardar cambios'
                : 'Guardar paciente'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw
            className="animate-spin"
            size={17}
          />
          Cargando pacientes...
        </div>
      ) : pacientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cfdcd6] bg-white p-10 text-center">
          <UserRound
            className="mx-auto mb-3 text-[#4d816f]"
            size={36}
          />

          <h2 className="font-bold text-[#173f34]">
            Aún no hay pacientes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Registra el primer paciente para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pacientes.map((paciente) => (
            <article
              key={paciente._id}
              className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-[#173f34]">
                      {paciente.name}
                    </h2>

                    <p className="truncate text-sm text-slate-500">
                      {paciente.email ||
                        'Sin correo registrado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => editarPaciente(paciente)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#246b55] transition hover:bg-[#e8f3ee]"
                  aria-label={`Editar ${paciente.name}`}
                >
                  <Pencil size={17} />
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">
                    Teléfono:
                  </span>{' '}
                  {paciente.phone || 'Sin registrar'}
                </p>

                <p>
                  <span className="font-semibold text-slate-700">
                    Sexo:
                  </span>{' '}
                  {obtenerSexo(paciente.sex)}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  to={`/pacientes/${paciente._id}/expediente`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e8f3ee] px-4 py-2.5 text-sm font-bold text-[#246b55] transition hover:bg-[#dcece5]"
                >
                  <ClipboardPlus size={17} />
                  Expediente
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PacientesPage