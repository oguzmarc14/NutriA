import { useEffect, useState } from 'react'
import {
  Apple,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import client from '../api/client'

const comidaInicial = {
  nombre: '',
  descripcion: '',
}

function PlanesAlimenticiosPage() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [planes, setPlanes] = useState([])
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [comidas, setComidas] = useState([
    { ...comidaInicial },
  ])

  const [loading, setLoading] = useState(true)
  const [cargandoPlanes, setCargandoPlanes] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
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

    cargarPacientes()
  }, [])

  useEffect(() => {
    if (!pacienteId) {
      setPlanes([])
      return
    }

    async function cargarPlanes() {
      try {
        setCargandoPlanes(true)
        setError('')
        setMensaje('')

        const { data } = await client.get(
          `/planes/${pacienteId}`,
        )

        setPlanes(data.planes)
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar los planes alimenticios',
        )
      } finally {
        setCargandoPlanes(false)
      }
    }

    cargarPlanes()
  }, [pacienteId])

  function agregarComida() {
    setComidas((actuales) => [
      ...actuales,
      { ...comidaInicial },
    ])
  }

  function eliminarComida(index) {
    setComidas((actuales) =>
      actuales.filter((_, posicion) => posicion !== index),
    )
  }

  function cambiarComida(index, campo, valor) {
    setComidas((actuales) =>
      actuales.map((comida, posicion) =>
        posicion === index
          ? {
              ...comida,
              [campo]: valor,
            }
          : comida,
      ),
    )
  }

  async function guardarPlan(event) {
    event.preventDefault()

    if (!pacienteId) {
      setError('Selecciona un paciente')
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const comidasValidas = comidas.filter(
        (comida) =>
          comida.nombre.trim() &&
          comida.descripcion.trim(),
      )

      const { data } = await client.post(
        `/planes/${pacienteId}`,
        {
          nombre,
          objetivo,
          comidas: comidasValidas,
        },
      )

      setPlanes((actuales) => [
        data.plan,
        ...actuales,
      ])

      setNombre('')
      setObjetivo('')
      setComidas([{ ...comidaInicial }])

      setMensaje(
        'Plan alimenticio creado correctamente',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible crear el plan alimenticio',
      )
    } finally {
      setGuardando(false)
    }
  }

  function formatearFecha(fecha) {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(fecha))
  }

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
          Planes alimenticios
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
          Gestión de planes alimenticios
        </h1>

        <p className="mt-2 text-slate-500">
          Crea y consulta planes alimenticios para cada paciente.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {mensaje}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Paciente
          </span>

          <select
            value={pacienteId}
            onChange={(event) =>
              setPacienteId(event.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#4d816f]"
          >
            <option value="">
              Selecciona un paciente
            </option>

            {pacientes.map((paciente) => (
              <option
                key={paciente._id}
                value={paciente._id}
              >
                {paciente.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pacienteId && (
        <>
          <form
            onSubmit={guardarPlan}
            className="mb-6 rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#173f34]">
                Nuevo plan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registra el objetivo y las comidas del plan.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Nombre del plan *
                </span>

                <input
                  type="text"
                  value={nombre}
                  onChange={(event) =>
                    setNombre(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                  placeholder="Plan para control de peso"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Objetivo
                </span>

                <input
                  type="text"
                  value={objetivo}
                  onChange={(event) =>
                    setObjetivo(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                  placeholder="Mejorar hábitos alimenticios"
                />
              </label>
            </div>

            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-[#173f34]">
                    Comidas
                  </h3>

                  <p className="text-sm text-slate-500">
                    Agrega las comidas e indicaciones del plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={agregarComida}
                  className="flex items-center gap-2 rounded-xl bg-[#e8f3ee] px-4 py-2.5 text-sm font-bold text-[#246b55]"
                >
                  <Plus size={17} />
                  Agregar comida
                </button>
              </div>

              <div className="space-y-4">
                {comidas.map((comida, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#173f34]">
                        Comida {index + 1}
                      </p>

                      {comidas.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            eliminarComida(index)
                          }
                          className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                          aria-label="Eliminar comida"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Nombre
                        </span>

                        <input
                          type="text"
                          value={comida.nombre}
                          onChange={(event) =>
                            cambiarComida(
                              index,
                              'nombre',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                          placeholder="Desayuno"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Descripción
                        </span>

                        <input
                          type="text"
                          value={comida.descripcion}
                          onChange={(event) =>
                            cambiarComida(
                              index,
                              'descripcion',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                          placeholder="Avena con fruta y yogurt"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {guardando
                  ? 'Guardando...'
                  : 'Guardar plan'}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                <Apple size={19} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#173f34]">
                  Planes registrados
                </h2>

                <p className="text-sm text-slate-500">
                  Historial de planes del paciente.
                </p>
              </div>
            </div>

            {cargandoPlanes ? (
              <p className="text-sm text-slate-500">
                Cargando planes...
              </p>
            ) : planes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfdcd6] p-8 text-center">
                <Apple
                  className="mx-auto mb-3 text-[#4d816f]"
                  size={32}
                />

                <p className="font-bold text-[#173f34]">
                  Sin planes registrados
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Crea el primer plan alimenticio del paciente.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {planes.map((plan) => (
                  <article
                    key={plan._id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d816f]">
                        {formatearFecha(plan.fechaInicio)}
                      </p>

                      <h3 className="mt-1 text-lg font-extrabold text-[#173f34]">
                        {plan.nombre}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {plan.objetivo ||
                          'Sin objetivo registrado'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {plan.comidas?.length > 0 ? (
                        plan.comidas.map((comida, index) => (
                          <div
                            key={`${plan._id}-${index}`}
                            className="rounded-lg bg-[#f6f8f6] p-3"
                          >
                            <p className="text-sm font-bold text-[#173f34]">
                              {comida.nombre}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {comida.descripcion}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Sin comidas registradas.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default PlanesAlimenticiosPage