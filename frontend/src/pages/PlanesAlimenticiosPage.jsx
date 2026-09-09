import { useEffect, useMemo, useState } from 'react'
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Plus,
  Search,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'

import client from '../api/client'

const comidaInicial = {
  nombre: '',
  descripcion: '',
}

const coloresPaciente = [
  {
    avatar: 'bg-[#d7f1e5] text-[#1f7a58]',
    borde: 'hover:border-[#4d816f]',
  },
  {
    avatar: 'bg-[#f7e3d5] text-[#9a684c]',
    borde: 'hover:border-[#c79572]',
  },
  {
    avatar: 'bg-[#e2e9f8] text-[#536da8]',
    borde: 'hover:border-[#8096c6]',
  },
  {
    avatar: 'bg-[#eeddf6] text-[#8c55a5]',
    borde: 'hover:border-[#a87ebb]',
  },
  {
    avatar: 'bg-[#e2f2d9] text-[#588b3f]',
    borde: 'hover:border-[#7fa465]',
  },
  {
    avatar: 'bg-[#f8dddd] text-[#b85959]',
    borde: 'hover:border-[#cf8585]',
  },
]

function PlanesAlimenticiosPage() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [planes, setPlanes] = useState([])

  const [busqueda, setBusqueda] = useState('')

  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')

  const [comidas, setComidas] = useState([
    { ...comidaInicial },
  ])

  const [loading, setLoading] = useState(true)
  const [cargandoPlanes, setCargandoPlanes] =
    useState(false)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  /*
   * ----------------------------------------------------
   * CARGAR PACIENTES
   * ----------------------------------------------------
   */

  useEffect(() => {
    async function cargarPacientes() {
      try {
        setLoading(true)
        setError('')

        const { data } =
          await client.get('/pacientes')

        setPacientes(
          data.pacientes || [],
        )
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

  /*
   * ----------------------------------------------------
   * CARGAR PLANES
   * ----------------------------------------------------
   */

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

        const { data } =
          await client.get(
            `/planes/${pacienteId}`,
          )

        setPlanes(
          data.planes || [],
        )
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

  /*
   * ----------------------------------------------------
   * PACIENTE SELECCIONADO / FILTRO
   * ----------------------------------------------------
   */

  const pacienteSeleccionado =
    pacientes.find(
      (paciente) =>
        paciente._id === pacienteId,
    )

  const pacientesFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLowerCase()

      if (!texto) {
        return pacientes
      }

      return pacientes.filter(
        (paciente) =>
          paciente.name
            ?.toLowerCase()
            .includes(texto),
      )
    }, [busqueda, pacientes])

  /*
   * ----------------------------------------------------
   * COMIDAS
   * ----------------------------------------------------
   */

  function agregarComida() {
    setComidas((actuales) => [
      ...actuales,
      { ...comidaInicial },
    ])
  }

  function eliminarComida(index) {
    setComidas((actuales) =>
      actuales.filter(
        (_, posicion) =>
          posicion !== index,
      ),
    )
  }

  function cambiarComida(
    index,
    campo,
    valor,
  ) {
    setComidas((actuales) =>
      actuales.map(
        (comida, posicion) =>
          posicion === index
            ? {
                ...comida,
                [campo]: valor,
              }
            : comida,
      ),
    )
  }

  /*
   * ----------------------------------------------------
   * GUARDAR PLAN
   * ----------------------------------------------------
   */

  async function guardarPlan(event) {
    event.preventDefault()

    if (!pacienteId) {
      setError(
        'Selecciona un paciente',
      )
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const comidasValidas =
        comidas.filter(
          (comida) =>
            comida.nombre.trim() &&
            comida.descripcion.trim(),
        )

      const { data } =
        await client.post(
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

      setComidas([
        { ...comidaInicial },
      ])

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

  /*
   * ----------------------------------------------------
   * HELPERS
   * ----------------------------------------------------
   */

  function calcularEdad(
    fechaNacimiento,
  ) {
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

  function obtenerInicial(nombrePaciente) {
    return (
      nombrePaciente
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() || 'P'
    )
  }

  function obtenerSexo(sex) {
    if (sex === 'male') {
      return 'Masculino'
    }

    if (sex === 'female') {
      return 'Femenino'
    }

    if (sex === 'other') {
      return 'Otro'
    }

    return 'Sin especificar'
  }

  function formatearFecha(fecha) {
    if (!fecha) {
      return 'Sin fecha'
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(new Date(fecha))
  }

  function seleccionarPaciente(id) {
    setPacienteId(id)
    setError('')
    setMensaje('')
  }

  function regresarPacientes() {
    setPacienteId('')
    setPlanes([])

    setNombre('')
    setObjetivo('')

    setComidas([
      { ...comidaInicial },
    ])

    setError('')
    setMensaje('')
  }

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-transparent px-5 py-7 md:px-8 md:py-9">
      <div className="mx-auto max-w-7xl">
        {/* LISTA DE PACIENTES */}

        {!pacienteId && (
          <>
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#4d816f]">
                  Planes alimenticios
                </p>

                <h1 className="text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                  Selecciona un paciente
                </h1>

                <p className="mt-2 max-w-2xl text-slate-500">
                  Elige un paciente para
                  crear un nuevo plan
                  alimenticio o consultar
                  los que ya tiene
                  registrados.
                </p>
              </div>

              {/* BUSCADOR */}

              <div className="w-full lg:max-w-md">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e9484]"
                  />

                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value,
                      )
                    }
                    placeholder="Buscar paciente por nombre..."
                    className="w-full rounded-2xl border border-[#c9ddd3] bg-white/85 py-3 pl-11 pr-4 text-sm text-[#173f34] shadow-[0_8px_24px_rgba(36,107,85,0.06)] outline-none backdrop-blur transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#cfe2d7]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-3xl border border-[#cfe0d6] bg-white/75 p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Cargando pacientes...
                </p>
              </div>
            ) : pacientesFiltrados.length ===
              0 ? (
              <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-12 text-center">
                <UserRound
                  size={34}
                  className="mx-auto mb-3 text-[#4d816f]"
                />

                <p className="font-extrabold text-[#173f34]">
                  No se encontraron
                  pacientes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otro nombre.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pacientesFiltrados.map(
                  (
                    paciente,
                    index,
                  ) => (
                    <PacientePlanCard
                      key={paciente._id}
                      paciente={paciente}
                      color={
                        coloresPaciente[
                          index %
                            coloresPaciente.length
                        ]
                      }
                      calcularEdad={
                        calcularEdad
                      }
                      obtenerInicial={
                        obtenerInicial
                      }
                      obtenerSexo={
                        obtenerSexo
                      }
                      onClick={() =>
                        seleccionarPaciente(
                          paciente._id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* DETALLE DEL PACIENTE */}

        {pacienteId && (
          <>
            <button
              type="button"
              onClick={
                regresarPacientes
              }
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#c8ddd2] bg-white/70 px-4 py-2 text-sm font-bold text-[#246b55] transition hover:bg-white"
            >
              <ArrowLeft
                size={16}
              />

              Volver a pacientes
            </button>

            <div className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
                Planes alimenticios
              </p>

              <h1 className="text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                {pacienteSeleccionado?.name ||
                  'Gestión de planes'}
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500">
                Crea un nuevo plan
                alimenticio y consulta el
                historial del paciente.
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

            {/* NUEVO PLAN */}

            <form
              onSubmit={guardarPlan}
              className="mb-6 rounded-3xl border border-[#cfe0d6] bg-gradient-to-br from-[#f8fbf8] to-[#edf5f0] p-5 shadow-[0_14px_40px_rgba(32,78,64,0.08)] md:p-6"
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9ebdf] text-[#246b55]">
                  <Apple
                    size={21}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#173f34]">
                    Nuevo plan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Registra el objetivo
                    y las comidas que
                    formarán parte del
                    plan alimenticio.
                  </p>
                </div>
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
                      setNombre(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-[#cbdcd3] bg-white/85 px-4 py-3 outline-none transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]"
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
                      setObjetivo(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-[#cbdcd3] bg-white/85 px-4 py-3 outline-none transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]"
                    placeholder="Mejorar hábitos alimenticios"
                  />
                </label>
              </div>

              {/* COMIDAS */}

              <div className="mt-7">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#173f34]">
                      Comidas
                    </h3>

                    <p className="text-sm text-slate-500">
                      Agrega las comidas
                      e indicaciones del
                      plan.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      agregarComida
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#dceee4] px-4 py-2.5 text-sm font-bold text-[#246b55] transition hover:bg-[#cfe5d8]"
                  >
                    <Plus
                      size={17}
                    />

                    Agregar comida
                  </button>
                </div>

                <div className="space-y-4">
                  {comidas.map(
                    (
                      comida,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-2xl border border-[#d8e4de] bg-white/70 p-4 shadow-sm"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm font-bold text-[#173f34]">
                            Comida{' '}
                            {index +
                              1}
                          </p>

                          {comidas.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                eliminarComida(
                                  index,
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                              aria-label="Eliminar comida"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
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
                              value={
                                comida.nombre
                              }
                              onChange={(
                                event,
                              ) =>
                                cambiarComida(
                                  index,
                                  'nombre',
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-full rounded-xl border border-[#d3dfd9] bg-white px-4 py-3 outline-none transition focus:border-[#4d816f]"
                              placeholder="Desayuno"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-semibold text-slate-700">
                              Descripción
                            </span>

                            <input
                              type="text"
                              value={
                                comida.descripcion
                              }
                              onChange={(
                                event,
                              ) =>
                                cambiarComida(
                                  index,
                                  'descripcion',
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-full rounded-xl border border-[#d3dfd9] bg-white px-4 py-3 outline-none transition focus:border-[#4d816f]"
                              placeholder="Avena con fruta y yogurt"
                            />
                          </label>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(36,107,85,0.2)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save
                    size={17}
                  />

                  {guardando
                    ? 'Guardando...'
                    : 'Guardar plan'}
                </button>
              </div>
            </form>

            {/* PLANES REGISTRADOS */}

            <div className="rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-[#fffaf1] to-[#f7efdf] p-5 shadow-[0_14px_40px_rgba(94,76,48,0.07)] md:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe2c6] text-[#8a6840]">
                  <Apple
                    size={19}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#173f34]">
                    Planes registrados
                  </h2>

                  <p className="text-sm text-slate-500">
                    Historial de planes
                    del paciente.
                  </p>
                </div>
              </div>

              {cargandoPlanes ? (
                <p className="text-sm text-slate-500">
                  Cargando planes...
                </p>
              ) : planes.length ===
                0 ? (
                <div className="rounded-2xl border border-dashed border-[#dacdb2] bg-white/45 p-8 text-center">
                  <Apple
                    className="mx-auto mb-3 text-[#9a7446]"
                    size={32}
                  />

                  <p className="font-bold text-[#173f34]">
                    Sin planes
                    registrados
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Crea el primer plan
                    alimenticio del
                    paciente.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {planes.map(
                    (plan) => (
                      <article
                        key={
                          plan._id
                        }
                        className="rounded-2xl border border-[#eadfc8] bg-white/70 p-5 shadow-sm"
                      >
                        <div className="mb-4">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">
                            {formatearFecha(
                              plan.fechaInicio,
                            )}
                          </p>

                          <h3 className="mt-1 text-lg font-extrabold text-[#173f34]">
                            {
                              plan.nombre
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {plan.objetivo ||
                              'Sin objetivo registrado'}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {plan.comidas
                            ?.length >
                          0 ? (
                            plan.comidas.map(
                              (
                                comida,
                                index,
                              ) => (
                                <div
                                  key={`${plan._id}-${index}`}
                                  className="rounded-xl bg-[#f7f2e7] p-3"
                                >
                                  <p className="text-sm font-bold text-[#173f34]">
                                    {
                                      comida.nombre
                                    }
                                  </p>

                                  <p className="mt-1 text-sm text-slate-600">
                                    {
                                      comida.descripcion
                                    }
                                  </p>
                                </div>
                              ),
                            )
                          ) : (
                            <p className="text-sm text-slate-500">
                              Sin comidas
                              registradas.
                            </p>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/*
 * ----------------------------------------------------
 * CARD DE PACIENTE
 * ----------------------------------------------------
 */

function PacientePlanCard({
  paciente,
  color,
  calcularEdad,
  obtenerInicial,
  obtenerSexo,
  onClick,
}) {
  const edad =
    calcularEdad(
      paciente.birthDate,
    )

  return (
    <article
      className={`group rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,107,85,0.14)] ${color.borde}`}
    >
      <div className="flex items-start gap-4">
        {/* AVATAR TEMPORAL */}

        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black ${color.avatar}`}
        >
          {obtenerInicial(
            paciente.name,
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold text-[#173f34]">
            {paciente.name}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <UserRound
                size={13}
              />

              {edad !== null
                ? `${edad} años`
                : 'Edad no registrada'}
            </span>

            <span>
              {obtenerSexo(
                paciente.sex,
              )}
            </span>
          </div>
        </div>
      </div>

      {/* DATOS BÁSICOS */}

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#edf2ef] py-4">
        <div>
          <p className="text-xs text-slate-400">
            Correo
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#173f34]">
            {paciente.email ||
              'Sin correo'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Teléfono
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#173f34]">
            {paciente.phone ||
              'Sin teléfono'}
          </p>
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <CalendarDays
            size={16}
            className="mt-0.5 text-[#4d816f]"
          />

          <div>
            <p className="text-[11px] text-slate-400">
              Plan alimenticio
            </p>

            <p className="text-xs font-bold text-[#48685c]">
              Consultar o crear
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-2.5 text-sm font-extrabold text-[#246b55] transition group-hover:bg-[#246b55] group-hover:text-white"
        >
          Ver planes

          <ArrowRight
            size={16}
          />
        </button>
      </div>
    </article>
  )
}

export default PlanesAlimenticiosPage