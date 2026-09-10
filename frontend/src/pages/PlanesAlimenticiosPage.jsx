import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Apple,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  LoaderCircle,
  Plus,
  Search,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
  X,
} from 'lucide-react'

import client from '../api/client'

/*
 * ----------------------------------------------------
 * HELPERS INICIALES
 * ----------------------------------------------------
 */

function crearComidaInicial() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    nombre: '',
    descripcion: '',
    alimentos: [],
  }
}

function crearFormularioPersonalizado() {
  return {
    nombre: '',
    grupo: '',
    cantidadPorcion: '1',
    unidad: 'porción',
    gramos: '',
    descripcionPorcion: '',
    kcal: '',
    proteina: '',
    carbohidratos: '',
    grasas: '',
    fibra: '',
    sodio: '',
  }
}

const coloresPaciente = [
  {
    avatar:
      'bg-[#d7f1e5] text-[#1f7a58]',
    borde:
      'hover:border-[#4d816f]',
  },
  {
    avatar:
      'bg-[#f7e3d5] text-[#9a684c]',
    borde:
      'hover:border-[#c79572]',
  },
  {
    avatar:
      'bg-[#e2e9f8] text-[#536da8]',
    borde:
      'hover:border-[#8096c6]',
  },
  {
    avatar:
      'bg-[#eeddf6] text-[#8c55a5]',
    borde:
      'hover:border-[#a87ebb]',
  },
  {
    avatar:
      'bg-[#e2f2d9] text-[#588b3f]',
    borde:
      'hover:border-[#7fa465]',
  },
  {
    avatar:
      'bg-[#f8dddd] text-[#b85959]',
    borde:
      'hover:border-[#cf8585]',
  },
]

/*
 * ----------------------------------------------------
 * PÁGINA
 * ----------------------------------------------------
 */

function PlanesAlimenticiosPage() {
  /*
   * PACIENTES
   */

  const [pacientes, setPacientes] =
    useState([])

  const [pacienteId, setPacienteId] =
    useState('')

  const [planes, setPlanes] =
    useState([])

  const [busqueda, setBusqueda] =
    useState('')

  /*
   * NUEVO PLAN
   */

  const [nombre, setNombre] =
    useState('')

  const [objetivo, setObjetivo] =
    useState('')

  const [comidas, setComidas] =
    useState([
      crearComidaInicial(),
    ])

  /*
   * CATÁLOGO DE ALIMENTOS
   */

  const [
    busquedasAlimentos,
    setBusquedasAlimentos,
  ] = useState({})

  const [
    resultadosAlimentos,
    setResultadosAlimentos,
  ] = useState({})

  const [
    buscandoAlimentos,
    setBuscandoAlimentos,
  ] = useState({})

  const [
    mostrarResultados,
    setMostrarResultados,
  ] = useState({})

  const timersBusqueda =
    useRef({})

  /*
   * ALIMENTO PERSONALIZADO
   */

  const [
    mostrarPersonalizado,
    setMostrarPersonalizado,
  ] = useState({})

  const [
    formulariosPersonalizados,
    setFormulariosPersonalizados,
  ] = useState({})

  /*
   * UI
   */

  const [loading, setLoading] =
    useState(true)

  const [
    cargandoPlanes,
    setCargandoPlanes,
  ] = useState(false)

  const [guardando, setGuardando] =
    useState(false)

  const [error, setError] =
    useState('')

  const [mensaje, setMensaje] =
    useState('')

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
          await client.get(
            '/pacientes',
          )

        setPacientes(
          data.pacientes || [],
        )
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
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
          err.response?.data
            ?.message ||
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
   * PACIENTE SELECCIONADO
   * ----------------------------------------------------
   */

  const pacienteSeleccionado =
    pacientes.find(
      (paciente) =>
        paciente._id ===
        pacienteId,
    )

  const pacientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
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
    }, [
      busqueda,
      pacientes,
    ])

  /*
   * ----------------------------------------------------
   * COMIDAS
   * ----------------------------------------------------
   */

  function agregarComida() {
    setComidas(
      (actuales) => [
        ...actuales,
        crearComidaInicial(),
      ],
    )
  }

  function eliminarComida(
    comidaId,
  ) {
    setComidas(
      (actuales) =>
        actuales.filter(
          (comida) =>
            comida.id !==
            comidaId,
        ),
    )

    setBusquedasAlimentos(
      (actual) => {
        const copia = {
          ...actual,
        }

        delete copia[comidaId]

        return copia
      },
    )

    setResultadosAlimentos(
      (actual) => {
        const copia = {
          ...actual,
        }

        delete copia[comidaId]

        return copia
      },
    )
  }

  function cambiarComida(
    comidaId,
    campo,
    valor,
  ) {
    setComidas(
      (actuales) =>
        actuales.map(
          (comida) =>
            comida.id ===
            comidaId
              ? {
                  ...comida,
                  [campo]:
                    valor,
                }
              : comida,
        ),
    )
  }

  /*
   * ----------------------------------------------------
   * BUSCAR ALIMENTOS
   * ----------------------------------------------------
   */

  function cambiarBusquedaAlimento(
    comidaId,
    valor,
  ) {
    setBusquedasAlimentos(
      (actual) => ({
        ...actual,
        [comidaId]:
          valor,
      }),
    )

    if (
      timersBusqueda.current[
        comidaId
      ]
    ) {
      clearTimeout(
        timersBusqueda.current[
          comidaId
        ],
      )
    }

    if (
      valor.trim().length < 2
    ) {
      setResultadosAlimentos(
        (actual) => ({
          ...actual,
          [comidaId]: [],
        }),
      )

      setMostrarResultados(
        (actual) => ({
          ...actual,
          [comidaId]:
            false,
        }),
      )

      return
    }

    timersBusqueda.current[
      comidaId
    ] = setTimeout(() => {
      buscarAlimentos(
        comidaId,
        valor,
      )
    }, 350)
  }

  async function buscarAlimentos(
    comidaId,
    texto,
  ) {
    try {
      setBuscandoAlimentos(
        (actual) => ({
          ...actual,
          [comidaId]:
            true,
        }),
      )

      const { data } =
        await client.get(
          '/alimentos',
          {
            params: {
              q: texto.trim(),
              activo: true,
              limit: 12,
            },
          },
        )

      setResultadosAlimentos(
        (actual) => ({
          ...actual,
          [comidaId]:
            data.alimentos ||
            [],
        }),
      )

      setMostrarResultados(
        (actual) => ({
          ...actual,
          [comidaId]:
            true,
        }),
      )
    } catch (err) {
      setResultadosAlimentos(
        (actual) => ({
          ...actual,
          [comidaId]: [],
        }),
      )

      setError(
        err.response?.data
          ?.message ||
          'No fue posible buscar alimentos',
      )
    } finally {
      setBuscandoAlimentos(
        (actual) => ({
          ...actual,
          [comidaId]:
            false,
        }),
      )
    }
  }

  /*
   * ----------------------------------------------------
   * AGREGAR ALIMENTO DEL CATÁLOGO
   * ----------------------------------------------------
   */

  function agregarAlimentoCatalogo(
    comidaId,
    alimento,
  ) {
    setComidas(
      (actuales) =>
        actuales.map(
          (comida) => {
            if (
              comida.id !==
              comidaId
            ) {
              return comida
            }

            const yaExiste =
              comida.alimentos.some(
                (item) =>
                  item.tipo ===
                    'catalogo' &&
                  item.alimentoId ===
                    alimento._id,
              )

            if (yaExiste) {
              return {
                ...comida,
                alimentos:
                  comida.alimentos.map(
                    (item) =>
                      item.tipo ===
                        'catalogo' &&
                      item.alimentoId ===
                        alimento._id
                        ? {
                            ...item,
                            cantidad:
                              Number(
                                item.cantidad ||
                                  1,
                              ) +
                              1,
                          }
                        : item,
                  ),
              }
            }

            const nuevo = {
              id:
                `${Date.now()}-${Math.random()}`,

              tipo:
                'catalogo',

              alimentoId:
                alimento._id,

              nombre:
                alimento.nombre,

              grupo:
                alimento.grupo ||
                '',

              porcion:
                alimento.porcion ||
                {
                  cantidad: 1,
                  unidad:
                    'porción',
                  gramos:
                    null,
                  descripcion:
                    '',
                },

              nutrimentos:
                alimento.nutrimentos ||
                {
                  kcal: 0,
                  proteina: 0,
                  carbohidratos:
                    0,
                  grasas: 0,
                  fibra: null,
                  sodio: null,
                },

              cantidad: 1,

              notas: '',
            }

            return {
              ...comida,
              alimentos: [
                ...comida.alimentos,
                nuevo,
              ],
            }
          },
        ),
    )

    setBusquedasAlimentos(
      (actual) => ({
        ...actual,
        [comidaId]: '',
      }),
    )

    setResultadosAlimentos(
      (actual) => ({
        ...actual,
        [comidaId]: [],
      }),
    )

    setMostrarResultados(
      (actual) => ({
        ...actual,
        [comidaId]:
          false,
      }),
    )
  }

  /*
   * ----------------------------------------------------
   * ACTUALIZAR ALIMENTO EN COMIDA
   * ----------------------------------------------------
   */

  function cambiarAlimento(
    comidaId,
    alimentoId,
    campo,
    valor,
  ) {
    setComidas(
      (actuales) =>
        actuales.map(
          (comida) =>
            comida.id ===
            comidaId
              ? {
                  ...comida,
                  alimentos:
                    comida.alimentos.map(
                      (
                        alimento,
                      ) =>
                        alimento.id ===
                        alimentoId
                          ? {
                              ...alimento,
                              [campo]:
                                valor,
                            }
                          : alimento,
                    ),
                }
              : comida,
        ),
    )
  }

  function eliminarAlimento(
    comidaId,
    alimentoId,
  ) {
    setComidas(
      (actuales) =>
        actuales.map(
          (comida) =>
            comida.id ===
            comidaId
              ? {
                  ...comida,
                  alimentos:
                    comida.alimentos.filter(
                      (
                        alimento,
                      ) =>
                        alimento.id !==
                        alimentoId,
                    ),
                }
              : comida,
        ),
    )
  }

  /*
   * ----------------------------------------------------
   * ALIMENTO PERSONALIZADO
   * ----------------------------------------------------
   */

  function abrirPersonalizado(
    comidaId,
  ) {
    setMostrarPersonalizado(
      (actual) => ({
        ...actual,
        [comidaId]:
          !actual[
            comidaId
          ],
      }),
    )

    setFormulariosPersonalizados(
      (actual) => ({
        ...actual,
        [comidaId]:
          actual[
            comidaId
          ] ||
          crearFormularioPersonalizado(),
      }),
    )
  }

  function cambiarPersonalizado(
    comidaId,
    campo,
    valor,
  ) {
    setFormulariosPersonalizados(
      (actual) => ({
        ...actual,
        [comidaId]: {
          ...(
            actual[
              comidaId
            ] ||
            crearFormularioPersonalizado()
          ),
          [campo]:
            valor,
        },
      }),
    )
  }

  function agregarPersonalizado(
    comidaId,
  ) {
    const formulario =
      formulariosPersonalizados[
        comidaId
      ]

    if (
      !formulario?.nombre
        ?.trim()
    ) {
      setError(
        'Escribe el nombre del alimento personalizado.',
      )

      return
    }

    if (
      formulario.kcal ===
        '' ||
      Number(
        formulario.kcal,
      ) < 0
    ) {
      setError(
        'Ingresa las calorías del alimento personalizado.',
      )

      return
    }

    const gramos =
      formulario.gramos ===
      ''
        ? null
        : Number(
            formulario.gramos,
          )

    const nuevo = {
      id:
        `${Date.now()}-${Math.random()}`,

      tipo:
        'personalizado',

      alimentoId: null,

      nombre:
        formulario.nombre.trim(),

      grupo:
        formulario.grupo.trim(),

      porcion: {
        cantidad:
          Number(
            formulario
              .cantidadPorcion,
          ) || 1,

        unidad:
          formulario.unidad.trim() ||
          'porción',

        gramos,

        descripcion:
          formulario
            .descripcionPorcion
            .trim(),
      },

      nutrimentos: {
        kcal:
          Number(
            formulario.kcal,
          ) || 0,

        proteina:
          Number(
            formulario.proteina,
          ) || 0,

        carbohidratos:
          Number(
            formulario
              .carbohidratos,
          ) || 0,

        grasas:
          Number(
            formulario.grasas,
          ) || 0,

        fibra:
          formulario.fibra ===
          ''
            ? null
            : Number(
                formulario
                  .fibra,
              ),

        sodio:
          formulario.sodio ===
          ''
            ? null
            : Number(
                formulario
                  .sodio,
              ),
      },

      cantidad: 1,
      notas: '',
    }

    setComidas(
      (actuales) =>
        actuales.map(
          (comida) =>
            comida.id ===
            comidaId
              ? {
                  ...comida,
                  alimentos: [
                    ...comida.alimentos,
                    nuevo,
                  ],
                }
              : comida,
        ),
    )

    setFormulariosPersonalizados(
      (actual) => ({
        ...actual,
        [comidaId]:
          crearFormularioPersonalizado(),
      }),
    )

    setMostrarPersonalizado(
      (actual) => ({
        ...actual,
        [comidaId]:
          false,
      }),
    )

    setError('')
  }

  /*
   * ----------------------------------------------------
   * TOTALES
   * ----------------------------------------------------
   */

  function calcularTotales(
    alimentos = [],
  ) {
    return alimentos.reduce(
      (total, alimento) => {
        const cantidad =
          Number(
            alimento.cantidad,
          ) || 0

        const nutrimentos =
          alimento.nutrimentos ||
          {}

        total.kcal +=
          (Number(
            nutrimentos.kcal,
          ) || 0) *
          cantidad

        total.proteina +=
          (Number(
            nutrimentos.proteina,
          ) || 0) *
          cantidad

        total.carbohidratos +=
          (Number(
            nutrimentos.carbohidratos,
          ) || 0) *
          cantidad

        total.grasas +=
          (Number(
            nutrimentos.grasas,
          ) || 0) *
          cantidad

        if (
          nutrimentos.fibra !==
            null &&
          nutrimentos.fibra !==
            undefined
        ) {
          total.fibra +=
            (Number(
              nutrimentos.fibra,
            ) || 0) *
            cantidad
        }

        return total
      },
      {
        kcal: 0,
        proteina: 0,
        carbohidratos: 0,
        grasas: 0,
        fibra: 0,
      },
    )
  }

  const totalesPlan =
    useMemo(() => {
      return comidas.reduce(
        (total, comida) => {
          const subtotal =
            calcularTotales(
              comida.alimentos,
            )

          total.kcal +=
            subtotal.kcal

          total.proteina +=
            subtotal.proteina

          total.carbohidratos +=
            subtotal.carbohidratos

          total.grasas +=
            subtotal.grasas

          total.fibra +=
            subtotal.fibra

          return total
        },
        {
          kcal: 0,
          proteina: 0,
          carbohidratos: 0,
          grasas: 0,
          fibra: 0,
        },
      )
    }, [comidas])

  /*
   * ----------------------------------------------------
   * GUARDAR PLAN
   * ----------------------------------------------------
   */

  async function guardarPlan(
    event,
  ) {
    event.preventDefault()

    if (!pacienteId) {
      setError(
        'Selecciona un paciente.',
      )
      return
    }

    if (!nombre.trim()) {
      setError(
        'Escribe el nombre del plan.',
      )
      return
    }

    const comidasValidas =
      comidas.filter(
        (comida) =>
          comida.nombre
            .trim() &&
          comida.alimentos
            .length > 0,
      )

    if (
      comidasValidas.length ===
      0
    ) {
      setError(
        'Agrega por lo menos una comida con un alimento.',
      )
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const comidasPayload =
        comidasValidas.map(
          (comida) => ({
            nombre:
              comida.nombre.trim(),

            descripcion:
              comida.descripcion.trim(),

            alimentos:
              comida.alimentos.map(
                (
                  alimento,
                ) => {
                  const cantidad =
                    Math.max(
                      0.1,
                      Number(
                        alimento.cantidad,
                      ) || 1,
                    )

                  if (
                    alimento.tipo ===
                    'catalogo'
                  ) {
                    return {
                      tipo:
                        'catalogo',

                      alimentoId:
                        alimento.alimentoId,

                      cantidad,

                      notas:
                        alimento.notas
                          ?.trim() ||
                        '',
                    }
                  }

                  return {
                    tipo:
                      'personalizado',

                    nombre:
                      alimento.nombre,

                    grupo:
                      alimento.grupo ||
                      '',

                    porcion:
                      alimento.porcion,

                    nutrimentos:
                      alimento.nutrimentos,

                    cantidad,

                    notas:
                      alimento.notas
                        ?.trim() ||
                      '',
                  }
                },
              ),
          }),
        )

      const { data } =
        await client.post(
          `/planes/${pacienteId}`,
          {
            nombre:
              nombre.trim(),

            objetivo:
              objetivo.trim(),

            comidas:
              comidasPayload,
          },
        )

      setPlanes(
        (actuales) => [
          data.plan,
          ...actuales,
        ],
      )

      setNombre('')
      setObjetivo('')

      setComidas([
        crearComidaInicial(),
      ])

      setBusquedasAlimentos(
        {},
      )

      setResultadosAlimentos(
        {},
      )

      setMostrarResultados(
        {},
      )

      setMostrarPersonalizado(
        {},
      )

      setFormulariosPersonalizados(
        {},
      )

      setMensaje(
        'Plan alimenticio creado correctamente.',
      )
    } catch (err) {
      console.error(
        'Error guardando plan:',
        err,
      )

      setError(
        err.response?.data
          ?.message ||
          'No fue posible crear el plan alimenticio.',
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
      new Date(
        fechaNacimiento,
      )

    const hoy =
      new Date()

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear()

    const diferenciaMes =
      hoy.getMonth() -
      nacimiento.getMonth()

    if (
      diferenciaMes < 0 ||
      (
        diferenciaMes ===
          0 &&
        hoy.getDate() <
          nacimiento.getDate()
      )
    ) {
      edad -= 1
    }

    return edad
  }

  function obtenerInicial(
    nombrePaciente,
  ) {
    return (
      nombrePaciente
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() ||
      'P'
    )
  }

  function obtenerSexo(
    sex,
  ) {
    if (sex === 'male') {
      return 'Masculino'
    }

    if (
      sex === 'female'
    ) {
      return 'Femenino'
    }

    if (sex === 'other') {
      return 'Otro'
    }

    return 'Sin especificar'
  }

  function formatearFecha(
    fecha,
  ) {
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
    ).format(
      new Date(fecha),
    )
  }

  function numero(
    valor,
    decimales = 1,
  ) {
    const resultado =
      Number(valor || 0)

    return resultado.toLocaleString(
      'es-MX',
      {
        maximumFractionDigits:
          decimales,
      },
    )
  }

  function seleccionarPaciente(
    id,
  ) {
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
      crearComidaInicial(),
    ])

    setBusquedasAlimentos(
      {},
    )

    setResultadosAlimentos(
      {},
    )

    setMostrarResultados(
      {},
    )

    setMostrarPersonalizado(
      {},
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
    <section className="min-h-screen overflow-x-hidden bg-transparent px-4 py-6 sm:px-5 md:px-8 md:py-9">
      <div className="mx-auto max-w-7xl">
        {/* ============================================
            SELECCIÓN DE PACIENTE
        ============================================ */}

        {!pacienteId && (
          <>
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#4d816f]">
                  Planes alimenticios
                </p>

                <h1 className="text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                  Selecciona un
                  paciente
                </h1>

                <p className="mt-2 max-w-2xl text-slate-500">
                  Elige un
                  paciente para
                  crear un nuevo
                  plan alimenticio
                  o consultar los
                  planes que ya
                  tiene
                  registrados.
                </p>
              </div>

              <div className="w-full lg:max-w-md">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e9484]"
                  />

                  <input
                    type="search"
                    value={
                      busqueda
                    }
                    onChange={(
                      event,
                    ) =>
                      setBusqueda(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Buscar paciente por nombre..."
                    className="w-full rounded-2xl border border-[#c9ddd3] bg-white/85 py-3 pl-11 pr-4 text-sm text-[#173f34] shadow-[0_8px_24px_rgba(36,107,85,0.06)] outline-none backdrop-blur transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#cfe2d7]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <AlertaError
                mensaje={
                  error
                }
              />
            )}

            {loading ? (
              <div className="rounded-3xl border border-[#cfe0d6] bg-white/75 p-10 text-center shadow-sm">
                <LoaderCircle
                  size={28}
                  className="mx-auto mb-3 animate-spin text-[#246b55]"
                />

                <p className="text-sm text-slate-500">
                  Cargando
                  pacientes...
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
                  No se
                  encontraron
                  pacientes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otro
                  nombre.
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
                      key={
                        paciente._id
                      }
                      paciente={
                        paciente
                      }
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

        {/* ============================================
            PLANES DEL PACIENTE
        ============================================ */}

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

              Volver a
              pacientes
            </button>

            <div className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
                Planes
                alimenticios
              </p>

              <h1 className="break-words text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                {pacienteSeleccionado
                  ?.name ||
                  'Gestión de planes'}
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500">
                Crea el plan
                utilizando el
                catálogo de
                alimentos de
                NutriA.
              </p>
            </div>

            {error && (
              <AlertaError
                mensaje={
                  error
                }
              />
            )}

            {mensaje && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {mensaje}
              </div>
            )}

            {/* ============================================
                NUEVO PLAN
            ============================================ */}

            <form
              onSubmit={
                guardarPlan
              }
              className="mb-7 rounded-3xl border border-[#cfe0d6] bg-gradient-to-br from-[#f8fbf8] to-[#edf5f0] p-4 shadow-[0_14px_40px_rgba(32,78,64,0.08)] sm:p-5 md:p-6"
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d9ebdf] text-[#246b55]">
                  <Apple
                    size={21}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#173f34]">
                    Nuevo plan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Busca
                    alimentos,
                    asigna
                    cantidades y
                    NutriA
                    calculará los
                    nutrimentos.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Nombre del plan *"
                  value={
                    nombre
                  }
                  onChange={
                    setNombre
                  }
                  placeholder="Plan para control de peso"
                  required
                />

                <CampoTexto
                  label="Objetivo"
                  value={
                    objetivo
                  }
                  onChange={
                    setObjetivo
                  }
                  placeholder="Mejorar hábitos alimenticios"
                />
              </div>

              {/* RESUMEN GENERAL */}

              <ResumenNutricional
                titulo="Resumen del plan"
                totales={
                  totalesPlan
                }
                numero={
                  numero
                }
                className="mt-6"
              />

              {/* COMIDAS */}

              <div className="mt-7">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#173f34]">
                      Comidas
                    </h3>

                    <p className="text-sm text-slate-500">
                      Puedes crear
                      desayuno,
                      colación,
                      comida,
                      cena o las
                      comidas que
                      necesites.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      agregarComida
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#dceee4] px-4 py-2.5 text-sm font-bold text-[#246b55] transition hover:bg-[#cfe5d8] sm:w-auto"
                  >
                    <Plus
                      size={17}
                    />

                    Agregar comida
                  </button>
                </div>

                <div className="space-y-5">
                  {comidas.map(
                    (
                      comida,
                      index,
                    ) => {
                      const subtotal =
                        calcularTotales(
                          comida.alimentos,
                        )

                      const resultados =
                        resultadosAlimentos[
                          comida.id
                        ] ||
                        []

                      const cargando =
                        buscandoAlimentos[
                          comida.id
                        ]

                      return (
                        <article
                          key={
                            comida.id
                          }
                          className="min-w-0 overflow-hidden rounded-3xl border border-[#d8e4de] bg-white/75 shadow-sm"
                        >
                          {/* CABECERA COMIDA */}

                          <div className="border-b border-[#e5eee9] bg-gradient-to-r from-[#eef6f1] to-white px-4 py-4 sm:px-5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#dceee4] text-[#246b55]">
                                  <Utensils
                                    size={
                                      18
                                    }
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6e9484]">
                                    Comida{' '}
                                    {index +
                                      1}
                                  </p>

                                  <p className="truncate font-extrabold text-[#173f34]">
                                    {comida
                                      .nombre ||
                                      'Sin nombre'}
                                  </p>
                                </div>
                              </div>

                              {comidas.length >
                                1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    eliminarComida(
                                      comida.id,
                                    )
                                  }
                                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-red-500 transition hover:bg-red-50"
                                  aria-label="Eliminar comida"
                                >
                                  <Trash2
                                    size={
                                      17
                                    }
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-5 p-4 sm:p-5">
                            {/* DATOS COMIDA */}

                            <div className="grid gap-4 md:grid-cols-2">
                              <CampoTexto
                                label="Nombre de la comida *"
                                value={
                                  comida.nombre
                                }
                                onChange={(
                                  valor,
                                ) =>
                                  cambiarComida(
                                    comida.id,
                                    'nombre',
                                    valor,
                                  )
                                }
                                placeholder="Desayuno"
                              />

                              <CampoTexto
                                label="Indicaciones"
                                value={
                                  comida.descripcion
                                }
                                onChange={(
                                  valor,
                                ) =>
                                  cambiarComida(
                                    comida.id,
                                    'descripcion',
                                    valor,
                                  )
                                }
                                placeholder="Ej. consumir entre 8:00 y 9:00 am"
                              />
                            </div>

                            {/* BUSCADOR */}

                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="text-sm font-semibold text-slate-700">
                                  Buscar
                                  alimento
                                </label>

                                <span className="text-xs font-semibold text-[#4d816f]">
                                  Catálogo
                                  NutriA
                                </span>
                              </div>

                              <div className="relative">
                                <Search
                                  size={
                                    18
                                  }
                                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e9484]"
                                />

                                <input
                                  type="search"
                                  value={
                                    busquedasAlimentos[
                                      comida
                                        .id
                                    ] ||
                                    ''
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    cambiarBusquedaAlimento(
                                      comida.id,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  onFocus={() => {
                                    if (
                                      resultados.length >
                                      0
                                    ) {
                                      setMostrarResultados(
                                        (
                                          actual,
                                        ) => ({
                                          ...actual,
                                          [comida.id]:
                                            true,
                                        }),
                                      )
                                    }
                                  }}
                                  placeholder="Ej. tortilla, pollo, aguacate..."
                                  className="w-full rounded-2xl border border-[#cbdcd3] bg-white py-3.5 pl-11 pr-12 text-sm text-[#173f34] outline-none transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]"
                                />

                                {cargando && (
                                  <LoaderCircle
                                    size={
                                      18
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#246b55]"
                                  />
                                )}
                              </div>

                              {(busquedasAlimentos[
                                comida
                                  .id
                              ] ||
                                '')
                                .trim()
                                .length ===
                                1 && (
                                <p className="mt-2 text-xs text-slate-400">
                                  Escribe
                                  por lo
                                  menos 2
                                  caracteres.
                                </p>
                              )}

                              {/* RESULTADOS */}

                              {mostrarResultados[
                                comida.id
                              ] &&
                                !cargando && (
                                  <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-[#d4e3db] bg-white p-2 shadow-[0_16px_40px_rgba(32,78,64,0.12)]">
                                    {resultados.length ===
                                    0 ? (
                                      <div className="p-5 text-center">
                                        <Search
                                          size={
                                            24
                                          }
                                          className="mx-auto mb-2 text-[#8eaa9e]"
                                        />

                                        <p className="text-sm font-bold text-[#173f34]">
                                          No
                                          encontramos
                                          ese
                                          alimento
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                          Puedes
                                          agregarlo
                                          manualmente
                                          para
                                          este
                                          plan.
                                        </p>
                                      </div>
                                    ) : (
                                      resultados.map(
                                        (
                                          alimento,
                                        ) => (
                                          <ResultadoAlimento
                                            key={
                                              alimento._id
                                            }
                                            alimento={
                                              alimento
                                            }
                                            numero={
                                              numero
                                            }
                                            onAgregar={() =>
                                              agregarAlimentoCatalogo(
                                                comida.id,
                                                alimento,
                                              )
                                            }
                                          />
                                        ),
                                      )
                                    )}
                                  </div>
                                )}

                              <button
                                type="button"
                                onClick={() =>
                                  abrirPersonalizado(
                                    comida.id,
                                  )
                                }
                                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#246b55] transition hover:text-[#173f34]"
                              >
                                <CirclePlus
                                  size={
                                    17
                                  }
                                />

                                ¿No lo
                                encuentras?
                                Agregar
                                alimento
                                personalizado

                                {mostrarPersonalizado[
                                  comida
                                    .id
                                ] ? (
                                  <ChevronUp
                                    size={
                                      16
                                    }
                                  />
                                ) : (
                                  <ChevronDown
                                    size={
                                      16
                                    }
                                  />
                                )}
                              </button>
                            </div>

                            {/* FORM PERSONALIZADO */}

                            {mostrarPersonalizado[
                              comida.id
                            ] && (
                              <FormularioPersonalizado
                                formulario={
                                  formulariosPersonalizados[
                                    comida
                                      .id
                                  ] ||
                                  crearFormularioPersonalizado()
                                }
                                onChange={(
                                  campo,
                                  valor,
                                ) =>
                                  cambiarPersonalizado(
                                    comida.id,
                                    campo,
                                    valor,
                                  )
                                }
                                onAgregar={() =>
                                  agregarPersonalizado(
                                    comida.id,
                                  )
                                }
                                onCancelar={() =>
                                  setMostrarPersonalizado(
                                    (
                                      actual,
                                    ) => ({
                                      ...actual,
                                      [comida.id]:
                                        false,
                                    }),
                                  )
                                }
                              />
                            )}

                            {/* ALIMENTOS AGREGADOS */}

                            <div>
                              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                  <h4 className="font-extrabold text-[#173f34]">
                                    Alimentos
                                    agregados
                                  </h4>

                                  <p className="text-xs text-slate-500">
                                    {
                                      comida
                                        .alimentos
                                        .length
                                    }{' '}
                                    alimento
                                    {comida
                                      .alimentos
                                      .length !==
                                    1
                                      ? 's'
                                      : ''}
                                  </p>
                                </div>

                                {comida
                                  .alimentos
                                  .length >
                                  0 && (
                                  <p className="text-sm font-black text-[#246b55]">
                                    {numero(
                                      subtotal.kcal,
                                      0,
                                    )}{' '}
                                    kcal
                                  </p>
                                )}
                              </div>

                              {comida
                                .alimentos
                                .length ===
                              0 ? (
                                <div className="rounded-2xl border border-dashed border-[#cadcd2] bg-[#f7faf8] p-7 text-center">
                                  <Apple
                                    size={
                                      28
                                    }
                                    className="mx-auto mb-2 text-[#84a496]"
                                  />

                                  <p className="text-sm font-bold text-[#173f34]">
                                    Aún no
                                    hay
                                    alimentos
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Utiliza
                                    el
                                    buscador
                                    de arriba
                                    para
                                    comenzar.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {comida.alimentos.map(
                                    (
                                      alimento,
                                    ) => (
                                      <AlimentoAgregado
                                        key={
                                          alimento.id
                                        }
                                        alimento={
                                          alimento
                                        }
                                        numero={
                                          numero
                                        }
                                        onCantidad={(
                                          valor,
                                        ) =>
                                          cambiarAlimento(
                                            comida.id,
                                            alimento.id,
                                            'cantidad',
                                            valor,
                                          )
                                        }
                                        onNotas={(
                                          valor,
                                        ) =>
                                          cambiarAlimento(
                                            comida.id,
                                            alimento.id,
                                            'notas',
                                            valor,
                                          )
                                        }
                                        onEliminar={() =>
                                          eliminarAlimento(
                                            comida.id,
                                            alimento.id,
                                          )
                                        }
                                      />
                                    ),
                                  )}
                                </div>
                              )}
                            </div>

                            {comida
                              .alimentos
                              .length >
                              0 && (
                              <ResumenNutricional
                                titulo={`Total de ${
                                  comida.nombre ||
                                  `comida ${
                                    index +
                                    1
                                  }`
                                }`}
                                totales={
                                  subtotal
                                }
                                numero={
                                  numero
                                }
                              />
                            )}
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              </div>

              {/* GUARDAR */}

              <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-[#cfe0d6] bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-extrabold text-[#173f34]">
                    Total del plan
                  </p>

                  <p className="text-sm text-slate-500">
                    {numero(
                      totalesPlan.kcal,
                      0,
                    )}{' '}
                    kcal ·{' '}
                    {numero(
                      totalesPlan.proteina,
                    )}{' '}
                    g proteína
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(36,107,85,0.2)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {guardando ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {guardando
                    ? 'Guardando...'
                    : 'Guardar plan'}
                </button>
              </div>
            </form>

            {/* ============================================
                PLANES REGISTRADOS
            ============================================ */}

            <div className="rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-[#fffaf1] to-[#f7efdf] p-4 shadow-[0_14px_40px_rgba(94,76,48,0.07)] sm:p-5 md:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#efe2c6] text-[#8a6840]">
                  <Apple
                    size={19}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#173f34]">
                    Planes
                    registrados
                  </h2>

                  <p className="text-sm text-slate-500">
                    Historial de
                    planes del
                    paciente.
                  </p>
                </div>
              </div>

              {cargandoPlanes ? (
                <div className="py-8 text-center">
                  <LoaderCircle
                    size={28}
                    className="mx-auto mb-3 animate-spin text-[#8a6840]"
                  />

                  <p className="text-sm text-slate-500">
                    Cargando
                    planes...
                  </p>
                </div>
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
                    Crea el primer
                    plan
                    alimenticio
                    del paciente.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {planes.map(
                    (plan) => (
                      <PlanRegistrado
                        key={
                          plan._id
                        }
                        plan={
                          plan
                        }
                        formatearFecha={
                          formatearFecha
                        }
                        numero={
                          numero
                        }
                        calcularTotales={
                          calcularTotales
                        }
                      />
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
 * RESULTADO DEL BUSCADOR
 * ----------------------------------------------------
 */

function ResultadoAlimento({
  alimento,
  numero,
  onAgregar,
}) {
  const porcion =
    alimento.porcion ||
    {}

  const nutrimentos =
    alimento.nutrimentos ||
    {}

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-[#f0f7f3]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e2f1e9] text-[#246b55]">
        <Apple
          size={18}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-extrabold text-[#173f34]">
          {alimento.nombre}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {obtenerTextoPorcion(
            porcion,
          )}
        </p>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-[#648578]">
          <span>
            {numero(
              nutrimentos.kcal,
              0,
            )}{' '}
            kcal
          </span>

          <span>
            P{' '}
            {numero(
              nutrimentos.proteina,
            )}{' '}
            g
          </span>

          <span>
            C{' '}
            {numero(
              nutrimentos.carbohidratos,
            )}{' '}
            g
          </span>

          <span>
            G{' '}
            {numero(
              nutrimentos.grasas,
            )}{' '}
            g
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onAgregar
        }
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#246b55] text-white transition hover:bg-[#173f34] sm:flex sm:w-auto sm:gap-1.5 sm:px-3"
        aria-label="Agregar alimento"
      >
        <Plus
          size={16}
        />

        <span className="hidden text-xs font-bold sm:block">
          Agregar
        </span>
      </button>
    </div>
  )
}

/*
 * ----------------------------------------------------
 * ALIMENTO AGREGADO
 * ----------------------------------------------------
 */

function AlimentoAgregado({
  alimento,
  numero,
  onCantidad,
  onNotas,
  onEliminar,
}) {
  const cantidad =
    Number(
      alimento.cantidad,
    ) || 0

  const nutrimentos =
    alimento.nutrimentos ||
    {}

  const kcal =
    (Number(
      nutrimentos.kcal,
    ) || 0) *
    cantidad

  const proteina =
    (Number(
      nutrimentos.proteina,
    ) || 0) *
    cantidad

  const carbohidratos =
    (Number(
      nutrimentos.carbohidratos,
    ) || 0) *
    cantidad

  const grasas =
    (Number(
      nutrimentos.grasas,
    ) || 0) *
    cantidad

  return (
    <div className="rounded-2xl border border-[#dde8e2] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f2eb] text-[#246b55]">
          <Apple
            size={17}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-extrabold text-[#173f34]">
                {
                  alimento.nombre
                }
              </p>

              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#edf5f1] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4d816f]">
                  {alimento.tipo ===
                  'personalizado'
                    ? 'Personalizado'
                    : 'Catálogo'}
                </span>

                {alimento.grupo && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    {
                      alimento.grupo
                    }
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={
                onEliminar
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
              aria-label="Eliminar alimento"
            >
              <X
                size={16}
              />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            1 porción ={' '}
            {obtenerTextoPorcion(
              alimento.porcion,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr]">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Porciones
          </span>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={
              alimento.cantidad
            }
            onChange={(
              event,
            ) =>
              onCantidad(
                event
                  .target
                  .value,
              )
            }
            className="w-full rounded-xl border border-[#d3dfd9] bg-white px-3 py-2.5 text-sm font-bold text-[#173f34] outline-none transition focus:border-[#4d816f]"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Nota opcional
          </span>

          <input
            type="text"
            value={
              alimento.notas ||
              ''
            }
            onChange={(
              event,
            ) =>
              onNotas(
                event.target
                  .value,
              )
            }
            placeholder="Ej. asado, sin aceite..."
            className="w-full rounded-xl border border-[#d3dfd9] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#4d816f]"
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniNutrimento
          label="Energía"
          value={`${numero(
            kcal,
            0,
          )} kcal`}
        />

        <MiniNutrimento
          label="Proteína"
          value={`${numero(
            proteina,
          )} g`}
        />

        <MiniNutrimento
          label="Carbohidratos"
          value={`${numero(
            carbohidratos,
          )} g`}
        />

        <MiniNutrimento
          label="Grasas"
          value={`${numero(
            grasas,
          )} g`}
        />
      </div>
    </div>
  )
}

/*
 * ----------------------------------------------------
 * FORMULARIO PERSONALIZADO
 * ----------------------------------------------------
 */

function FormularioPersonalizado({
  formulario,
  onChange,
  onAgregar,
  onCancelar,
}) {
  return (
    <div className="rounded-2xl border border-[#cfe0d6] bg-[#f4f9f6] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              size={17}
              className="text-[#246b55]"
            />

            <h4 className="font-extrabold text-[#173f34]">
              Alimento
              personalizado
            </h4>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Se guardará
            únicamente dentro
            de este plan. No
            modifica el
            catálogo general.
          </p>
        </div>

        <button
          type="button"
          onClick={
            onCancelar
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white"
        >
          <X
            size={16}
          />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CampoFormulario
          label="Nombre *"
          value={
            formulario.nombre
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'nombre',
              valor,
            )
          }
          placeholder="Ej. Ensalada de la casa"
        />

        <CampoFormulario
          label="Grupo"
          value={
            formulario.grupo
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'grupo',
              valor,
            )
          }
          placeholder="Ej. Verduras"
        />
      </div>

      <p className="mb-3 mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#4d816f]">
        Porción base
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CampoFormulario
          label="Cantidad"
          type="number"
          step="0.1"
          value={
            formulario.cantidadPorcion
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'cantidadPorcion',
              valor,
            )
          }
          placeholder="1"
        />

        <CampoFormulario
          label="Unidad"
          value={
            formulario.unidad
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'unidad',
              valor,
            )
          }
          placeholder="pieza"
        />

        <CampoFormulario
          label="Gramos"
          type="number"
          step="0.1"
          value={
            formulario.gramos
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'gramos',
              valor,
            )
          }
          placeholder="30"
        />

        <CampoFormulario
          label="Descripción"
          value={
            formulario.descripcionPorcion
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'descripcionPorcion',
              valor,
            )
          }
          placeholder="1 pieza"
        />
      </div>

      <p className="mb-3 mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#4d816f]">
        Nutrimentos por
        porción
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <CampoFormulario
          label="kcal *"
          type="number"
          step="0.1"
          value={
            formulario.kcal
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'kcal',
              valor,
            )
          }
          placeholder="0"
        />

        <CampoFormulario
          label="Proteína g"
          type="number"
          step="0.1"
          value={
            formulario.proteina
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'proteina',
              valor,
            )
          }
          placeholder="0"
        />

        <CampoFormulario
          label="Carbs g"
          type="number"
          step="0.1"
          value={
            formulario.carbohidratos
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'carbohidratos',
              valor,
            )
          }
          placeholder="0"
        />

        <CampoFormulario
          label="Grasas g"
          type="number"
          step="0.1"
          value={
            formulario.grasas
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'grasas',
              valor,
            )
          }
          placeholder="0"
        />

        <CampoFormulario
          label="Fibra g"
          type="number"
          step="0.1"
          value={
            formulario.fibra
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'fibra',
              valor,
            )
          }
          placeholder="0"
        />

        <CampoFormulario
          label="Sodio mg"
          type="number"
          step="0.1"
          value={
            formulario.sodio
          }
          onChange={(
            valor,
          ) =>
            onChange(
              'sodio',
              valor,
            )
          }
          placeholder="0"
        />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={
            onCancelar
          }
          className="rounded-xl border border-[#cbdcd3] bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={
            onAgregar
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173f34]"
        >
          <Plus
            size={16}
          />

          Agregar a la
          comida
        </button>
      </div>
    </div>
  )
}

/*
 * ----------------------------------------------------
 * RESUMEN NUTRICIONAL
 * ----------------------------------------------------
 */

function ResumenNutricional({
  titulo,
  totales,
  numero,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-[#cfe0d6] bg-gradient-to-r from-[#e8f3ee] to-[#f6faf8] p-4 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles
          size={16}
          className="text-[#246b55]"
        />

        <p className="text-sm font-extrabold text-[#173f34]">
          {titulo}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <DatoResumen
          label="Energía"
          value={`${numero(
            totales.kcal,
            0,
          )} kcal`}
        />

        <DatoResumen
          label="Proteína"
          value={`${numero(
            totales.proteina,
          )} g`}
        />

        <DatoResumen
          label="Carbohidratos"
          value={`${numero(
            totales.carbohidratos,
          )} g`}
        />

        <DatoResumen
          label="Grasas"
          value={`${numero(
            totales.grasas,
          )} g`}
        />

        <DatoResumen
          label="Fibra"
          value={`${numero(
            totales.fibra,
          )} g`}
        />
      </div>
    </div>
  )
}

function DatoResumen({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-white/75 p-3">
      <p className="text-[11px] font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#173f34]">
        {value}
      </p>
    </div>
  )
}

function MiniNutrimento({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-[#f5f9f7] p-2.5">
      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-extrabold text-[#173f34]">
        {value}
      </p>
    </div>
  )
}

/*
 * ----------------------------------------------------
 * PLAN REGISTRADO
 * ----------------------------------------------------
 */

function PlanRegistrado({
  plan,
  formatearFecha,
  numero,
  calcularTotales,
}) {
  const [abierto, setAbierto] =
    useState(false)

  const todosAlimentos =
    plan.comidas?.flatMap(
      (comida) =>
        comida.alimentos ||
        [],
    ) || []

  const totales =
    calcularTotales(
      todosAlimentos,
    )

  return (
    <article className="min-w-0 rounded-2xl border border-[#eadfc8] bg-white/75 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7446]">
            {formatearFecha(
              plan.fechaInicio ||
                plan.createdAt,
            )}
          </p>

          <h3 className="mt-1 break-words text-lg font-extrabold text-[#173f34]">
            {plan.nombre}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {plan.objetivo ||
              'Sin objetivo registrado'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setAbierto(
              (actual) =>
                !actual,
            )
          }
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f5eddb] text-[#8a6840]"
        >
          {abierto ? (
            <ChevronUp
              size={17}
            />
          ) : (
            <ChevronDown
              size={17}
            />
          )}
        </button>
      </div>

      {todosAlimentos.length >
        0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniNutrimento
            label="Energía"
            value={`${numero(
              totales.kcal,
              0,
            )} kcal`}
          />

          <MiniNutrimento
            label="Proteína"
            value={`${numero(
              totales.proteina,
            )} g`}
          />

          <MiniNutrimento
            label="Carbohidratos"
            value={`${numero(
              totales.carbohidratos,
            )} g`}
          />

          <MiniNutrimento
            label="Grasas"
            value={`${numero(
              totales.grasas,
            )} g`}
          />
        </div>
      )}

      {abierto && (
        <div className="mt-4 space-y-3 border-t border-[#efe5d2] pt-4">
          {plan.comidas
            ?.length > 0 ? (
            plan.comidas.map(
              (
                comida,
                index,
              ) => (
                <div
                  key={
                    comida._id ||
                    `${plan._id}-${index}`
                  }
                  className="rounded-xl bg-[#f7f2e7] p-3"
                >
                  <p className="font-bold text-[#173f34]">
                    {
                      comida.nombre
                    }
                  </p>

                  {comida.descripcion && (
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        comida.descripcion
                      }
                    </p>
                  )}

                  {comida
                    .alimentos
                    ?.length >
                  0 ? (
                    <div className="mt-3 space-y-2">
                      {comida.alimentos.map(
                        (
                          alimento,
                          alimentoIndex,
                        ) => {
                          const cantidad =
                            Number(
                              alimento.cantidad,
                            ) ||
                            1

                          const kcal =
                            (Number(
                              alimento
                                .nutrimentos
                                ?.kcal,
                            ) ||
                              0) *
                            cantidad

                          return (
                            <div
                              key={
                                alimento._id ||
                                `${index}-${alimentoIndex}`
                              }
                              className="flex items-center justify-between gap-3 rounded-lg bg-white/75 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="break-words text-xs font-bold text-[#173f34]">
                                  {
                                    alimento.nombre
                                  }
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {numero(
                                    cantidad,
                                  )}{' '}
                                  porción
                                  {cantidad !==
                                  1
                                    ? 'es'
                                    : ''}
                                </p>
                              </div>

                              <p className="shrink-0 text-xs font-black text-[#8a6840]">
                                {numero(
                                  kcal,
                                  0,
                                )}{' '}
                                kcal
                              </p>
                            </div>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Plan
                      anterior sin
                      alimentos
                      individualizados.
                    </p>
                  )}
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
      )}
    </article>
  )
}

/*
 * ----------------------------------------------------
 * CARD PACIENTE
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
      className={`group min-w-0 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_35px_rgba(36,107,85,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,107,85,0.14)] ${color.borde}`}
    >
      <div className="flex items-start gap-4">
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

      <div className="mt-5 grid grid-cols-1 gap-3 border-y border-[#edf2ef] py-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            Correo
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#173f34]">
            {paciente.email ||
              'Sin correo'}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            Teléfono
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#173f34]">
            {paciente.phone ||
              'Sin teléfono'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <CalendarDays
            size={16}
            className="mt-0.5 text-[#4d816f]"
          />

          <div>
            <p className="text-[11px] text-slate-400">
              Plan
              alimenticio
            </p>

            <p className="text-xs font-bold text-[#48685c]">
              Consultar o
              crear
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            onClick
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e5f2eb] px-4 py-2.5 text-sm font-extrabold text-[#246b55] transition group-hover:bg-[#246b55] group-hover:text-white sm:w-auto"
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

/*
 * ----------------------------------------------------
 * CAMPOS
 * ----------------------------------------------------
 */

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label className="min-w-0 space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        required={
          required
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-[#cbdcd3] bg-white/85 px-4 py-3 text-[#173f34] outline-none transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]"
      />
    </label>
  )
}

function CampoFormulario({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        min={
          type ===
          'number'
            ? '0'
            : undefined
        }
        step={step}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-[#d3dfd9] bg-white px-3 py-2.5 text-sm text-[#173f34] outline-none transition focus:border-[#4d816f]"
      />
    </label>
  )
}

/*
 * ----------------------------------------------------
 * ALERTA
 * ----------------------------------------------------
 */

function AlertaError({
  mensaje,
}) {
  return (
    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
      {mensaje}
    </div>
  )
}

/*
 * ----------------------------------------------------
 * TEXTO DE PORCIÓN
 * ----------------------------------------------------
 */

function obtenerTextoPorcion(
  porcion,
) {
  if (!porcion) {
    return 'Porción no especificada'
  }

  if (
    porcion.descripcion
      ?.trim()
  ) {
    if (
      porcion.gramos !==
        null &&
      porcion.gramos !==
        undefined
    ) {
      return `${porcion.descripcion} · ${porcion.gramos} g`
    }

    return porcion.descripcion
  }

  const cantidad =
    porcion.cantidad ?? 1

  const unidad =
    porcion.unidad ||
    'porción'

  if (
    porcion.gramos !==
      null &&
    porcion.gramos !==
      undefined
  ) {
    return `${cantidad} ${unidad} · ${porcion.gramos} g`
  }

  return `${cantidad} ${unidad}`
}

export default PlanesAlimenticiosPage