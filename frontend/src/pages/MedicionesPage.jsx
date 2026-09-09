import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bone,
  Calculator,
  CalendarDays,
  CircleGauge,
  Dumbbell,
  History,
  Info,
  Ruler,
  Save,
  Scale,
  Search,
  Sparkles,
  UserRound,
  Weight,
} from 'lucide-react'

import client from '../api/client'

const nivelesActividad = [
  {
    nivel: 1,
    nombre: 'Sedentario',
    descripcion: 'Poco o ningún ejercicio',
  },
  {
    nivel: 2,
    nombre: 'Ligero',
    descripcion: '1-2 días por semana',
  },
  {
    nivel: 3,
    nombre: 'Moderado',
    descripcion: '3-5 días por semana',
  },
  {
    nivel: 4,
    nombre: 'Activo',
    descripcion: '6-7 días por semana',
  },
  {
    nivel: 5,
    nombre: 'Muy activo',
    descripcion: 'Ejercicio intenso frecuente',
  },
]

const estadoInicialAntropometricas = {
  grasaCorporal: '',
  grasaVisceral: '',
  masaMuscular: '',
  masaOsea: '',
  proteina: '',
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

function MedicionesPage() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [mediciones, setMediciones] = useState([])

  const [busqueda, setBusqueda] = useState('')

  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [estatura, setEstatura] = useState('')

  const [nivelActividadFisica, setNivelActividadFisica] =
    useState(3)

  const [antropometricas, setAntropometricas] = useState(
    estadoInicialAntropometricas,
  )

  const [loading, setLoading] = useState(true)
  const [cargandoHistorial, setCargandoHistorial] =
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

        const { data } = await client.get('/pacientes')

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

    cargarPacientes()
  }, [])

  /*
   * ----------------------------------------------------
   * CARGAR HISTORIAL
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (!pacienteId) {
      setMediciones([])
      setEdad('')
      return
    }

    async function cargarHistorial() {
      try {
        setCargandoHistorial(true)
        setError('')
        setMensaje('')

        const { data } = await client.get(
          `/mediciones/${pacienteId}`,
        )

        setMediciones(data.mediciones || [])

        if (data.paciente?.birthDate) {
          setEdad(
            calcularEdad(
              data.paciente.birthDate,
            ).toString(),
          )
        } else {
          setEdad('')
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar el historial de mediciones',
        )
      } finally {
        setCargandoHistorial(false)
      }
    }

    cargarHistorial()
  }, [pacienteId])

  /*
   * ----------------------------------------------------
   * DATOS CALCULADOS
   * ----------------------------------------------------
   */

  const pacienteSeleccionado = pacientes.find(
    (paciente) => paciente._id === pacienteId,
  )

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase()

    if (!texto) {
      return pacientes
    }

    return pacientes.filter((paciente) =>
      paciente.name
        ?.toLowerCase()
        .includes(texto),
    )
  }, [busqueda, pacientes])

  const esPrimeraMedicion =
    mediciones.length === 0

  const nivelSeleccionado =
    nivelesActividad.find(
      ({ nivel }) =>
        nivel === nivelActividadFisica,
    ) || nivelesActividad[2]

  const imcPreview = useMemo(() => {
    const pesoNumero = Number(peso)
    const estaturaNumero =
      Number(estatura)

    if (
      !pesoNumero ||
      !estaturaNumero ||
      estaturaNumero <= 0
    ) {
      return null
    }

    return Number(
      (
        pesoNumero /
        estaturaNumero ** 2
      ).toFixed(2),
    )
  }, [peso, estatura])

  /*
   * ----------------------------------------------------
   * GUARDAR MEDICIÓN
   * ----------------------------------------------------
   */

  async function registrarMedicion(event) {
    event.preventDefault()

    if (!pacienteId) {
      setError('Selecciona un paciente')
      return
    }

    if (!edad) {
      setError('Ingresa la edad del paciente')
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const { data } = await client.post(
        `/mediciones/${pacienteId}`,
        {
          edad,
          nivelActividadFisica,
          peso,
          estatura,

          grasaCorporal:
            antropometricas.grasaCorporal,

          grasaVisceral:
            antropometricas.grasaVisceral,

          masaMuscular:
            antropometricas.masaMuscular,

          masaOsea:
            antropometricas.masaOsea,

          proteina:
            antropometricas.proteina,
        },
      )

      setMediciones((actuales) => [
        data.medicion,
        ...actuales,
      ])

      /*
       * Actualizamos también la card del paciente
       * para que la última medición cambie sin
       * tener que recargar toda la página.
       */
      setPacientes((actuales) =>
        actuales.map((paciente) =>
          paciente._id === pacienteId
            ? {
                ...paciente,
                ultimaMedicion: {
                  peso: data.medicion.peso,
                  estatura:
                    data.medicion.estatura,
                  imc: data.medicion.imc,
                  fecha: data.medicion.fecha,
                },
              }
            : paciente,
        ),
      )

      setPeso('')
      setEstatura('')
      setNivelActividadFisica(3)

      setAntropometricas(
        estadoInicialAntropometricas,
      )

      setMensaje(
        data.message ||
          'Medición registrada correctamente',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible registrar la medición',
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

  function actualizarAntropometrica(
    campo,
    valor,
  ) {
    setAntropometricas((actuales) => ({
      ...actuales,
      [campo]: valor,
    }))
  }

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) {
      return null
    }

    const nacimiento =
      new Date(fechaNacimiento)

    const hoy = new Date()

    let edadCalculada =
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
      edadCalculada -= 1
    }

    return edadCalculada
  }

  function formatearFecha(fecha) {
    if (!fecha) {
      return 'Sin mediciones'
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

  function clasificarIMC(imc) {
    if (imc < 18.5) {
      return 'Bajo peso'
    }

    if (imc < 25) {
      return 'Peso normal'
    }

    if (imc < 30) {
      return 'Sobrepeso'
    }

    return 'Obesidad'
  }

  function obtenerInicial(nombre) {
    return (
      nombre
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

  function seleccionarPaciente(id) {
    setPacienteId(id)
    setError('')
    setMensaje('')
  }

  function regresarPacientes() {
    setPacienteId('')
    setMediciones([])

    setPeso('')
    setEstatura('')
    setEdad('')

    setNivelActividadFisica(3)

    setAntropometricas(
      estadoInicialAntropometricas,
    )

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
        {/* ============================================
            VISTA PRINCIPAL DE PACIENTES
        ============================================ */}

        {!pacienteId && (
          <>
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#4d816f]">
                  Mediciones
                </p>

                <h1 className="text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                  Selecciona un paciente
                </h1>

                <p className="mt-2 max-w-2xl text-slate-500">
                  Elige un paciente para registrar
                  una nueva medición o consultar su
                  historial.
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
                  No se encontraron pacientes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otro nombre.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pacientesFiltrados.map(
                  (paciente, index) => (
                    <PacienteCard
                      key={paciente._id}
                      paciente={paciente}
                      color={
                        coloresPaciente[
                          index %
                            coloresPaciente.length
                        ]
                      }
                      onClick={() =>
                        seleccionarPaciente(
                          paciente._id,
                        )
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
                      formatearFecha={
                        formatearFecha
                      }
                    />
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================
            DETALLE DE MEDICIONES
        ============================================ */}

        {pacienteId && (
          <>
            <button
              type="button"
              onClick={regresarPacientes}
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#c8ddd2] bg-white/70 px-4 py-2 text-sm font-bold text-[#246b55] transition hover:bg-white"
            >
              <ArrowLeft size={16} />

              Volver a pacientes
            </button>

            <div className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
                Mediciones
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34] md:text-4xl">
                {pacienteSeleccionado?.name ||
                  'Seguimiento de mediciones'}
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500">
                Registra la evolución corporal del
                paciente y consulta su historial.
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

            {/* FORMULARIO */}

            <form
              onSubmit={registrarMedicion}
              className="mb-6"
            >
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                {/* COLUMNA IZQUIERDA */}

                <div className="space-y-6">
                  {/* INFORMACIÓN GENERAL */}

                  <article className="rounded-3xl border border-[#cfe0d6] bg-gradient-to-br from-[#f4faf6] to-[#eaf4ed] p-5 shadow-[0_14px_40px_rgba(32,78,64,0.08)] md:p-6">
                    <div className="mb-6 flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d9ebdf] text-[#246b55]">
                        <UserRound size={21} />
                      </div>

                      <div>
                        <h2 className="text-xl font-extrabold text-[#173f34]">
                          Información general
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Datos generales para el
                          seguimiento del paciente.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* EDAD */}

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Edad{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </span>

                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={edad}
                            onChange={(event) =>
                              setEdad(
                                event.target.value,
                              )
                            }
                            required
                            className="w-full rounded-xl border border-[#c9d9d1] bg-white/80 px-4 py-3 pr-16 outline-none transition focus:border-[#4d816f]"
                            placeholder="27"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            años
                          </span>
                        </div>
                      </label>

                      {/* TIPO */}

                      <div className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Tipo de medición
                        </span>

                        <div className="rounded-xl border border-white/70 bg-white/65 px-4 py-3 shadow-sm">
                          <p className="font-bold text-[#173f34]">
                            {cargandoHistorial
                              ? 'Comprobando historial...'
                              : esPrimeraMedicion
                                ? 'Primera medición'
                                : 'Medición de seguimiento'}
                          </p>

                          {!cargandoHistorial && (
                            <p className="mt-1 text-xs text-slate-500">
                              {esPrimeraMedicion
                                ? 'El paciente aún no tiene mediciones registradas.'
                                : `El paciente tiene ${mediciones.length} mediciones previas.`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTIVIDAD */}

                    <div className="mt-7">
                      <div className="mb-4 flex items-center gap-2">
                        <Activity
                          size={18}
                          className="text-[#246b55]"
                        />

                        <span className="text-sm font-semibold text-slate-700">
                          Nivel de actividad física{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {nivelesActividad.map(
                          ({ nivel }) => (
                            <button
                              key={nivel}
                              type="button"
                              onClick={() =>
                                setNivelActividadFisica(
                                  nivel,
                                )
                              }
                              className={`h-11 rounded-xl border transition ${
                                nivel <=
                                nivelActividadFisica
                                  ? 'border-[#5e9478] bg-[#72a98c]'
                                  : 'border-[#d7e1dc] bg-white/70 hover:bg-white'
                              }`}
                            />
                          ),
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-5 gap-2 text-center">
                        {nivelesActividad.map(
                          ({ nivel }) => (
                            <span
                              key={nivel}
                              className={`text-xs font-bold ${
                                nivel ===
                                nivelActividadFisica
                                  ? 'text-[#246b55]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {nivel}
                            </span>
                          ),
                        )}
                      </div>

                      <div className="mt-5 rounded-xl border border-[#cfe0d6] bg-white/60 p-4">
                        <p className="font-bold text-[#246b55]">
                          Nivel {nivelSeleccionado.nivel} ·{' '}
                          {nivelSeleccionado.nombre}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {
                            nivelSeleccionado.descripcion
                          }
                        </p>
                      </div>
                    </div>
                  </article>

                  {/* MEDIDAS CORPORALES */}

                  <article className="rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-[#fffaf1] to-[#f7efdf] p-5 shadow-[0_14px_40px_rgba(94,76,48,0.07)] md:p-6">
                    <div className="mb-6 flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#efe2c6] text-[#8a6840]">
                        <Ruler size={21} />
                      </div>

                      <div>
                        <h2 className="text-xl font-extrabold text-[#173f34]">
                          Medidas corporales
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Registra peso y estatura. El
                          IMC se calcula automáticamente.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* PESO */}

                      <label className="space-y-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Scale size={16} />
                          Peso *
                        </span>

                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={peso}
                            onChange={(event) =>
                              setPeso(
                                event.target.value,
                              )
                            }
                            required
                            className="w-full rounded-xl border border-[#dfd3bd] bg-white/80 px-4 py-3 pr-12 outline-none transition focus:border-[#b48d5b]"
                            placeholder="70"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            kg
                          </span>
                        </div>
                      </label>

                      {/* ESTATURA */}

                      <label className="space-y-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Ruler size={16} />
                          Estatura *
                        </span>

                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.5"
                            max="3"
                            value={estatura}
                            onChange={(event) =>
                              setEstatura(
                                event.target.value,
                              )
                            }
                            required
                            className="w-full rounded-xl border border-[#dfd3bd] bg-white/80 px-4 py-3 pr-10 outline-none transition focus:border-[#b48d5b]"
                            placeholder="1.75"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            m
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* IMC */}

                    <div className="mt-5 rounded-xl border border-[#eadfc8] bg-white/65 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4ead7] text-[#8a6840]">
                          <Calculator size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            IMC estimado
                          </p>

                          {imcPreview ? (
                            <>
                              <p className="text-xl font-extrabold text-[#173f34]">
                                {imcPreview}
                              </p>

                              <p className="text-sm font-semibold text-[#9a7446]">
                                {clasificarIMC(
                                  imcPreview,
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">
                              Ingresa peso y estatura.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                {/* ANTROPOMÉTRICAS */}

                <article className="h-fit rounded-3xl border border-[#ead8ce] bg-gradient-to-br from-[#fff8f4] to-[#f6ebe5] p-5 shadow-[0_14px_40px_rgba(115,75,55,0.07)] md:p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0ddd2] text-[#9a684c]">
                      <CircleGauge size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-[#173f34]">
                        Medidas antropométricas
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Información adicional del paciente.
                        Todos estos campos son opcionales.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <CampoAntropometrico
                      icon={Sparkles}
                      label="Grasa corporal"
                      unidad="%"
                      value={
                        antropometricas.grasaCorporal
                      }
                      onChange={(valor) =>
                        actualizarAntropometrica(
                          'grasaCorporal',
                          valor,
                        )
                      }
                    />

                    <CampoAntropometrico
                      icon={CircleGauge}
                      label="Grasa visceral"
                      unidad="nivel"
                      value={
                        antropometricas.grasaVisceral
                      }
                      onChange={(valor) =>
                        actualizarAntropometrica(
                          'grasaVisceral',
                          valor,
                        )
                      }
                    />

                    <CampoAntropometrico
                      icon={Dumbbell}
                      label="Masa muscular"
                      unidad="kg"
                      value={
                        antropometricas.masaMuscular
                      }
                      onChange={(valor) =>
                        actualizarAntropometrica(
                          'masaMuscular',
                          valor,
                        )
                      }
                    />

                    <CampoAntropometrico
                      icon={Bone}
                      label="Masa ósea"
                      unidad="kg"
                      value={
                        antropometricas.masaOsea
                      }
                      onChange={(valor) =>
                        actualizarAntropometrica(
                          'masaOsea',
                          valor,
                        )
                      }
                    />

                    <CampoAntropometrico
                      icon={Activity}
                      label="Proteína"
                      unidad="%"
                      value={
                        antropometricas.proteina
                      }
                      onChange={(valor) =>
                        actualizarAntropometrica(
                          'proteina',
                          valor,
                        )
                      }
                    />
                  </div>

                  <div className="mt-6 flex gap-3 rounded-xl border border-[#e4cfc2] bg-white/55 p-4">
                    <Info
                      size={19}
                      className="mt-0.5 shrink-0 text-[#9a684c]"
                    />

                    <p className="text-sm leading-6 text-slate-600">
                      Estas medidas son opcionales.
                      Regístralas cuando estén disponibles.
                    </p>
                  </div>
                </article>
              </div>

              {/* GUARDAR */}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 rounded-xl bg-[#246b55] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(36,107,85,0.2)] transition hover:bg-[#1d5947] disabled:opacity-60"
                >
                  <Save size={17} />

                  {guardando
                    ? 'Guardando...'
                    : esPrimeraMedicion
                      ? 'Guardar primera medición'
                      : 'Guardar medición'}
                </button>
              </div>
            </form>

            {/* HISTORIAL */}

            <div className="rounded-3xl border border-[#d5e1e3] bg-gradient-to-br from-[#f7fbfb] to-[#edf4f4] p-5 shadow-[0_14px_40px_rgba(40,76,80,0.06)] md:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcebed] text-[#3e6e73]">
                  <History size={19} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#173f34]">
                    Historial de mediciones
                  </h2>

                  <p className="text-sm text-slate-500">
                    Evolución registrada del paciente.
                  </p>
                </div>
              </div>

              {cargandoHistorial ? (
                <p className="text-sm text-slate-500">
                  Cargando historial...
                </p>
              ) : mediciones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#cfdcd6] bg-white/50 p-8 text-center">
                  <Calculator
                    className="mx-auto mb-3 text-[#4d816f]"
                    size={30}
                  />

                  <p className="font-bold text-[#173f34]">
                    Sin mediciones
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Esta será la primera medición.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead>
                      <tr className="border-b border-[#dbe6e8] text-sm text-slate-500">
                        <th className="px-3 py-3 font-semibold">
                          Fecha
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Edad
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Peso
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Estatura
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          IMC
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Actividad
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Tipo
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {mediciones.map(
                        (medicion) => (
                          <tr
                            key={medicion._id}
                            className="border-b border-[#e4ecee] text-sm text-slate-700 last:border-0"
                          >
                            <td className="px-3 py-4">
                              {formatearFecha(
                                medicion.fecha,
                              )}
                            </td>

                            <td className="px-3 py-4">
                              {medicion.edad
                                ? `${medicion.edad} años`
                                : '—'}
                            </td>

                            <td className="px-3 py-4 font-semibold">
                              {medicion.peso} kg
                            </td>

                            <td className="px-3 py-4">
                              {medicion.estatura} m
                            </td>

                            <td className="px-3 py-4">
                              <span className="rounded-lg bg-[#dcebed] px-3 py-1.5 font-bold text-[#3e6e73]">
                                {medicion.imc}
                              </span>
                            </td>

                            <td className="px-3 py-4">
                              {medicion.nivelActividadFisica
                                ? `Nivel ${medicion.nivelActividadFisica}`
                                : '—'}
                            </td>

                            <td className="px-3 py-4">
                              {medicion.esPrimeraMedicion
                                ? 'Primera'
                                : 'Seguimiento'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
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
 * CARD DEL PACIENTE
 * ----------------------------------------------------
 */

function PacienteCard({
  paciente,
  color,
  onClick,
  calcularEdad,
  obtenerInicial,
  obtenerSexo,
  formatearFecha,
}) {
  const edad =
    calcularEdad(
      paciente.birthDate,
    )

  const ultimaMedicion =
    paciente.ultimaMedicion

  return (
    <article
      className={`group rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,107,85,0.14)] ${color.borde}`}
    >
      {/* HEADER */}

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
              <UserRound size={13} />

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

      {/* DATOS DE ÚLTIMA MEDICIÓN */}

      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#edf2ef] py-4">
        {/* PESO */}

        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[#4d816f]">
            <Weight size={16} />

            <span className="text-xs text-slate-400">
              Peso
            </span>
          </div>

          <p className="text-sm font-extrabold text-[#173f34]">
            {ultimaMedicion?.peso
              ? `${ultimaMedicion.peso} kg`
              : '—'}
          </p>
        </div>

        {/* ESTATURA */}

        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[#4d816f]">
            <Ruler size={16} />

            <span className="text-xs text-slate-400">
              Estatura
            </span>
          </div>

          <p className="text-sm font-extrabold text-[#173f34]">
            {ultimaMedicion?.estatura
              ? `${ultimaMedicion.estatura} m`
              : '—'}
          </p>
        </div>

        {/* IMC */}

        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[#4d816f]">
            <Activity size={16} />

            <span className="text-xs text-slate-400">
              IMC
            </span>
          </div>

          <p className="text-sm font-extrabold text-[#173f34]">
            {ultimaMedicion?.imc ??
              '—'}
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
              Última medición
            </p>

            <p className="text-xs font-bold text-[#48685c]">
              {ultimaMedicion?.fecha
                ? formatearFecha(
                    ultimaMedicion.fecha,
                  )
                : 'Sin mediciones'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-2.5 text-sm font-extrabold text-[#246b55] transition group-hover:bg-[#246b55] group-hover:text-white"
        >
          Ver mediciones

          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  )
}

/*
 * ----------------------------------------------------
 * CAMPO ANTROPOMÉTRICO
 * ----------------------------------------------------
 */

function CampoAntropometrico({
  icon: Icon,
  label,
  unidad,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#715b50]">
        <Icon
          size={16}
          className="text-[#a87552]"
        />

        {label}

        <span className="ml-auto text-xs font-normal text-[#b29a8c]">
          Opcional
        </span>
      </span>

      <div className="relative">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-[#dfd1c8] bg-white/80 px-4 py-3 pr-16 outline-none transition focus:border-[#a87552]"
          placeholder="—"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#aa9689]">
          {unidad}
        </span>
      </div>
    </label>
  )
}

export default MedicionesPage