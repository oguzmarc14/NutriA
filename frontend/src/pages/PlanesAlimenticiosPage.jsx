import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  Apple,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ChartNoAxesColumnIncreasing,
  Target,
  ListChecks,
  PanelRightClose,
  PanelRightOpen,
  CirclePlus,
  LoaderCircle,
  Plus,
  Search,
  Save,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  UserRound,
  Utensils,
  X,
} from 'lucide-react'

import client from '../api/client'
import CardPacientePlanes from '../components/planes/CardPacientePlanes'
import CardPlanRegistrado from '../components/planes/CardPlanRegistrado'
import ModalPlanGuardado from '../components/planes/ModalPlanGuardado'
import TarjetaSelectorComida from '../components/planes/TarjetaSelectorComida'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'

/*
 * ----------------------------------------------------
 * HELPERS INICIALES
 * ----------------------------------------------------
 */

function crearComidaInicial(
  nombre = '',
  hora = '',
) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    nombre,
    platillo: '',
    hora,
    alimentos: [],
  }
}

function crearComidasIniciales() {
  return [
    crearComidaInicial('Desayuno', '08:00'),
    crearComidaInicial('Comida', '14:30'),
    crearComidaInicial('Cena', '20:30'),
  ]
}

function obtenerFechaActual() {
  const hoy = new Date()
  const desplazamiento = hoy.getTimezoneOffset() * 60000
  return new Date(hoy - desplazamiento).toISOString().slice(0, 10)
}

function formatearHora(hora) {
  if (!hora) return 'Sin hora'

  const [horas, minutos] = hora.split(':').map(Number)
  const periodo = horas >= 12 ? 'pm' : 'am'
  const horas12 = horas % 12 || 12

  return `${horas12}:${String(minutos).padStart(2, '0')} ${periodo}`
}

function IconoComida({ nombre = '', size = 18 }) {
  const texto = nombre.toLowerCase()

  if (texto.includes('desayuno')) return <Sun size={size} />
  if (texto.includes('cena')) return <Moon size={size} />
  if (texto.includes('colación') || texto.includes('snack')) return <Apple size={size} />

  return <Utensils size={size} />
}

const opcionesComida = [
  'Colación',
  'Snack',
  'Pre-entreno',
  'Post-entreno',
  'Otra / personalizada',
]

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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [referenciaNutricional, setReferenciaNutricional] = useState(null)
  const [errorReferencia, setErrorReferencia] = useState('')
  const [modoAsistido, setModoAsistido] = useState(false)
  const [mostrarGuia, setMostrarGuia] = useState(false)
  const [mostrarEleccion, setMostrarEleccion] = useState(false)
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null)
  const eleccionMostrada = useRef('')
  const [distribucion, setDistribucion] = useState([25, 40, 35])
  const [asistenteEquivalentes, setAsistenteEquivalentes] = useState(null)
  const [mostrarEquivalentes, setMostrarEquivalentes] = useState(false)
  const [panelBalanceVisible, setPanelBalanceVisible] = useState(true)
  const [grupoSugerido, setGrupoSugerido] = useState('')
  const [errorEquivalentes, setErrorEquivalentes] = useState('')
  const { cerrarTrabajo, iniciarTrabajo, pacienteTrabajo } =
    usePacienteTrabajo()
  const pacienteSolicitado = searchParams.get('paciente') || ''
  /*
   * PACIENTES
   */

  const [pacientes, setPacientes] =
    useState([])

  const [pacienteId, setPacienteId] =
    useState(pacienteSolicitado || pacienteTrabajo?.id || '')

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

  const [fechaPlan, setFechaPlan] =
    useState(obtenerFechaActual)

  const [planEditandoId, setPlanEditandoId] =
    useState('')

  const formularioPlanRef = useRef(null)

  const [comidas, setComidas] =
    useState(crearComidasIniciales)

  const [comidaActivaId, setComidaActivaId] =
    useState('')

  const [mostrarMenuComidas, setMostrarMenuComidas] =
    useState(false)

  const [comidaArrastradaId, setComidaArrastradaId] =
    useState('')

  const comidaActiva =
    comidas.find((comida) => comida.id === comidaActivaId) ||
    comidas[0]

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

  const [avisoPlanGuardado, setAvisoPlanGuardado] =
    useState(null)

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

  useEffect(() => {
    if (!pacienteSolicitado || !pacientes.length) return

    const paciente = pacientes.find(
      (item) => item._id === pacienteSolicitado,
    )

    if (paciente && pacienteTrabajo?.id !== paciente._id) {
      iniciarTrabajo(paciente)
    }
  }, [
    iniciarTrabajo,
    pacienteSolicitado,
    pacienteTrabajo?.id,
    pacientes,
  ])

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

  useEffect(() => {
    if (!pacienteId) { setReferenciaNutricional(null); setErrorReferencia(''); return }
    let activo = true
    setReferenciaNutricional(null)
    setErrorReferencia('')
    // Consultar el expediente directamente: los objetivos son independientes
    // de que el paciente tenga un cálculo nutricional guardado.
    Promise.allSettled([
      client.get('/expedientes/' + pacienteId),
      client.get('/calculo-nutricional/' + pacienteId),
    ]).then(([expedienteRespuesta, calculoRespuesta]) => {
      if (!activo) return
      const expediente = expedienteRespuesta.status === 'fulfilled'
        ? expedienteRespuesta.value.data.expediente : null
      const calculo = calculoRespuesta.status === 'fulfilled'
        ? calculoRespuesta.value.data.calculos?.[0] || null : null
      setReferenciaNutricional({ expediente, calculo })
      if (expedienteRespuesta.status === 'rejected') {
        setErrorReferencia('No fue posible cargar el expediente clínico. Comprueba la conexión.')
      }
    })
    return () => { activo = false }
  }, [pacienteId])

  useEffect(() => {
    if (!pacienteId) { setAsistenteEquivalentes(null); return }
    let vigente = true
    setAsistenteEquivalentes(null)
    setErrorEquivalentes('')
    client.get('/asistente-equivalentes/' + pacienteId)
      .then(({ data }) => { if (vigente) setAsistenteEquivalentes(data) })
      .catch(() => { if (vigente) setErrorEquivalentes('No se pudo cargar el catálogo de equivalencias verificadas.') })
    return () => { vigente = false }
  }, [pacienteId])

  useEffect(() => {
    if (!pacienteId || !referenciaNutricional || planEditandoId) return
    if (eleccionMostrada.current === pacienteId) return
    eleccionMostrada.current = pacienteId
    setModalidadSeleccionada(null)
    setMostrarEleccion(true)
  }, [pacienteId, referenciaNutricional, planEditandoId])

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

  function agregarComida(tipo = 'Colación') {
    const personalizada = tipo === 'Otra / personalizada'
    const nueva = crearComidaInicial(
      personalizada ? 'Nueva comida' : tipo,
      '',
    )

    setComidas((actuales) => [...actuales, nueva])
    setComidaActivaId(nueva.id)
    setMostrarMenuComidas(false)
  }

  function eliminarComida(
    comidaId,
  ) {
    setComidas(
      (actuales) => {
        const restantes = actuales.filter(
          (comida) =>
            comida.id !==
            comidaId,
        )

        if (comidaActivaId === comidaId) {
          setComidaActivaId(restantes[0]?.id || '')
        }

        return restantes
      },
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

  function iniciarArrastreComida(event, comidaId) {
    setComidaArrastradaId(comidaId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', comidaId)
  }

  function soltarComida(event, destinoId) {
    event.preventDefault()

    const origenId =
      event.dataTransfer.getData('text/plain') || comidaArrastradaId

    if (!origenId || origenId === destinoId) {
      setComidaArrastradaId('')
      return
    }

    const limites = event.currentTarget.getBoundingClientRect()
    const colocarDespues = event.clientX > limites.left + limites.width / 2

    setComidas((actuales) => {
      const origen = actuales.findIndex((comida) => comida.id === origenId)
      const destinoOriginal = actuales.findIndex((comida) => comida.id === destinoId)

      if (origen < 0 || destinoOriginal < 0) return actuales

      const reordenadas = [...actuales]
      const [movida] = reordenadas.splice(origen, 1)
      const destino = reordenadas.findIndex((comida) => comida.id === destinoId)
      reordenadas.splice(destino + (colocarDespues ? 1 : 0), 0, movida)
      return reordenadas
    })

    setComidaArrastradaId('')
  }

  function moverComida(comidaId, direccion) {
    setComidas((actuales) => {
      const origen = actuales.findIndex((comida) => comida.id === comidaId)
      const destino = origen + direccion

      if (origen < 0 || destino < 0 || destino >= actuales.length) return actuales

      const reordenadas = [...actuales]
      const [movida] = reordenadas.splice(origen, 1)
      reordenadas.splice(destino, 0, movida)
      return reordenadas
    })
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

        const gramosPorPorcion = Number(alimento.porcion?.gramos)
        if (Number.isFinite(gramosPorPorcion) && gramosPorPorcion > 0) {
          total.gramos += gramosPorPorcion * cantidad
        }

        return total
      },
      {
        kcal: 0,
        proteina: 0,
        carbohidratos: 0,
        grasas: 0,
        fibra: 0,
        gramos: 0,
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

          total.gramos +=
            subtotal.gramos

          return total
        },
        {
          kcal: 0,
          proteina: 0,
          carbohidratos: 0,
          grasas: 0,
          fibra: 0,
          gramos: 0,
        },
      )
    }, [comidas])

  const calculoReferencia = referenciaNutricional?.calculo
  const objetivosReferencia = calculoReferencia?.resultado
  const metas = [
    ['Energía', 'kcal', 'kcal', objetivosReferencia?.objetivoKcal],
    ['Proteína', 'proteina', 'g', objetivosReferencia?.proteinasGramos],
    ['Carbohidratos', 'carbohidratos', 'g', objetivosReferencia?.carbohidratosGramos],
    ['Grasas', 'grasas', 'g', objetivosReferencia?.grasasGramos],
  ]
  const comidasBalance = comidas.map(comida => ({
    ...comida,
    totales: calcularTotales(comida.alimentos),
  }))
  const gruposCatalogo = comidas.flatMap(comida => comida.alimentos || []).reduce((acc, alimento) => {
    const grupo = alimento.grupo?.trim() || 'Sin clasificar'
    acc[grupo] = (acc[grupo] || 0) + (Number(alimento.cantidad) || 0)
    return acc
  }, {})
  function confirmarModalidad() {
    if (!modalidadSeleccionada) return
    if (modalidadSeleccionada === 'asistido') prepararPlanAsistido()
    if (modalidadSeleccionada === 'duplicar' && planes.length) duplicarPlan(planes[0])
    if (modalidadSeleccionada === 'libre') {
      if (comidas.some(c => c.alimentos.length > 0) && !window.confirm('¿Reiniciar el borrador actual?')) return
      cancelarEdicion()
      setModoAsistido(false)
      setMostrarEleccion(false)
    }
    setModalidadSeleccionada(null)
  }
  function prepararPlanAsistido() {
    if (!objetivosReferencia) {
      setError('Para preparar un plan asistido, guarda primero un cálculo nutricional.')
      return
    }
    if (planEditandoId && !window.confirm('¿Reemplazar las comidas de la edición actual por una estructura vacía?')) return
    if (comidas.some(comida => comida.alimentos.length > 0) && !window.confirm('¿Reemplazar las comidas actuales? Se perderán los alimentos aún no guardados.')) return
    const nutricion = referenciaNutricional?.expediente?.nutricion || {}
    const objetivos = Array.isArray(nutricion.objetivos) ? nutricion.objetivos : []
    const cantidadComidas = Number(nutricion.numeroComidasDia)
    const nombres = cantidadComidas === 4
      ? ['Desayuno', 'Colación', 'Comida', 'Cena']
      : cantidadComidas >= 5
        ? ['Desayuno', 'Colación matutina', 'Comida', 'Colación vespertina', 'Cena']
        : ['Desayuno', 'Comida', 'Cena']
    const horasPredeterminadas = nombres.length === 3 ? ['08:00', '14:30', '20:30'] :
      nombres.length === 4 ? ['08:00', '11:30', '14:30', '20:30'] :
      ['08:00', '11:30', '14:30', '17:30', '20:30']
    // El expediente registra primera y última comida, no el horario de cada una.
    // Respetamos los extremos y distribuimos los tiempos intermedios de forma editable.
    const convertirMinutos = valor => {
      if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(valor || '')) return null
      const [h, m] = valor.split(':').map(Number)
      return h * 60 + m
    }
    const inicio = convertirMinutos(nutricion.primeraComida)
    const fin = convertirMinutos(nutricion.ultimaComida)
    const minutosHora = minutos => String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0')
    const horas = inicio !== null && fin !== null && fin > inicio
      ? nombres.map((_, i) => minutosHora(Math.round((inicio + (fin - inicio) * i / (nombres.length - 1)) / 5) * 5))
      : horasPredeterminadas.map((hora, i) => i === 0 && inicio !== null ? minutosHora(inicio) : i === nombres.length - 1 && fin !== null ? minutosHora(fin) : hora)
    const nuevas = nombres.map((n, i) => crearComidaInicial(n, horas[i]))
    setComidas(nuevas)
    setComidaActivaId(nuevas[0].id)
    setPlanEditandoId('')
    setNombre('Plan nutricional - ' + obtenerFechaActual())
    setObjetivo(objetivos.map(v => ({
      perdida_peso: 'Pérdida de peso', incremento_masa: 'Incremento de masa muscular',
      salud: 'Mejorar la salud', rendimiento_deportivo: 'Rendimiento deportivo',
      control_enfermedades: 'Control de enfermedades',
    }[v] || v)).join(', '))
    setDistribucion(nombres.length === 3 ? [25, 40, 35] :
      nombres.length === 4 ? [25, 10, 40, 25] : [20, 10, 35, 10, 25])
    setModoAsistido(true)
    setMostrarEleccion(false)
    setError('')
    setMensaje('')
  }
  function duplicarPlan(plan) {
    if (comidas.some(comida => comida.alimentos.length > 0) && !window.confirm('¿Reemplazar el borrador actual con una copia del plan seleccionado?')) return
    const copias = (plan.comidas || []).map(comida => ({
      id: `${Date.now()}-${Math.random()}`,
      nombre: comida.nombre || '',
      platillo: comida.platillo || '',
      hora: comida.hora || '',
      alimentos: (comida.alimentos || []).map(alimento => ({
        ...alimento, id: `${Date.now()}-${Math.random()}`,
        alimentoId: typeof alimento.alimento === 'object' ? alimento.alimento?._id : alimento.alimento,
      })),
    }))
    setComidas(copias.length ? copias : crearComidasIniciales())
    setComidaActivaId(copias[0]?.id || '')
    setPlanEditandoId('')
    setNombre((plan.nombre || 'Plan') + ' (copia)')
    setObjetivo(plan.objetivo || '')
    setFechaPlan(obtenerFechaActual())
    setModoAsistido(false)
    setMostrarEleccion(false)
    setError('')
    setMensaje('Plan anterior duplicado como borrador nuevo. Revisa los alimentos y cantidades antes de guardar.')
    formularioPlanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

    if (!fechaPlan) {
      setError('Selecciona la fecha del menú.')
      return
    }

    const comidasValidas =
      comidas.filter(
        (comida) =>
          comida.nombre
            .trim() &&
          comida.platillo
            .trim() &&
          comida.alimentos
            .length > 0,
      )

    if (
      comidasValidas.length ===
      0
    ) {
      setError(
        'Agrega el nombre del platillo y por lo menos un alimento.',
      )
      return
    }

    try {
      const tipoGuardado = planEditandoId ? 'editado' : 'creado'

      setGuardando(true)
      setError('')
      setMensaje('')

      const comidasPayload =
        comidasValidas.map(
          (comida) => ({
            ...(/^[a-f\d]{24}$/i.test(comida.id)
              ? { _id: comida.id }
              : {}),

            nombre:
              comida.nombre.trim(),

            platillo:
              comida.platillo?.trim() || '',

            hora:
              comida.hora || '',

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

      const payload = {
        nombre: nombre.trim(),
        objetivo: objetivo.trim(),
        fechaInicio: `${fechaPlan}T12:00:00.000Z`,
        comidas: comidasPayload,
      }

      const { data } = planEditandoId
        ? await client.put(`/planes/${pacienteId}/${planEditandoId}`, payload)
        : await client.post(`/planes/${pacienteId}`, payload)

      setPlanes((actuales) =>
        planEditandoId
          ? actuales.map((plan) => plan._id === planEditandoId ? data.plan : plan)
          : [data.plan, ...actuales],
      )

      setNombre('')
      setObjetivo('')
      setFechaPlan(obtenerFechaActual())
      setPlanEditandoId('')

      const comidasNuevas = crearComidasIniciales()
      setComidas(comidasNuevas)
      setComidaActivaId(comidasNuevas[0].id)

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

      setAvisoPlanGuardado({
        tipo: tipoGuardado,
        mensaje: tipoGuardado === 'editado'
          ? 'Los cambios del plan alimenticio fueron guardados correctamente.'
          : 'El nuevo plan alimenticio fue registrado correctamente para el paciente.',
      })
    } catch (err) {
      console.error(
        'Error guardando plan:',
        err,
      )

      setError(
        err.response?.data
          ?.message ||
          'No fue posible guardar el plan alimenticio.',
      )
    } finally {
      setGuardando(false)
    }
  }

  function editarPlan(plan) {
    const comidasEditables = (plan.comidas || []).map((comida) => ({
      id: comida._id || `${Date.now()}-${Math.random()}`,
      nombre: comida.nombre || '',
      platillo: comida.platillo || '',
      hora: comida.hora || '',
      alimentos: (comida.alimentos || []).map((alimento) => ({
        ...alimento,
        id: alimento._id || `${Date.now()}-${Math.random()}`,
        alimentoId:
          typeof alimento.alimento === 'object'
            ? alimento.alimento?._id
            : alimento.alimento,
      })),
    }))

    setPlanEditandoId(plan._id)
    setNombre(plan.nombre || '')
    setObjetivo(plan.objetivo || '')
    setFechaPlan((plan.fechaInicio || plan.createdAt || '').slice(0, 10))
    setComidas(comidasEditables.length > 0 ? comidasEditables : crearComidasIniciales())
    setComidaActivaId(comidasEditables[0]?.id || '')
    setBusquedasAlimentos({})
    setResultadosAlimentos({})
    setMostrarResultados({})
    setError('')
    setMensaje('Editando plan alimenticio.')
    formularioPlanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelarEdicion() {
    const nuevas = crearComidasIniciales()
    setPlanEditandoId('')
    setNombre('')
    setObjetivo('')
    setFechaPlan(obtenerFechaActual())
    setComidas(nuevas)
    setComidaActivaId(nuevas[0].id)
    setError('')
    setMensaje('')
  }

  async function eliminarPlan(plan) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el plan "${plan.nombre}"?`,
    )

    if (!confirmado) return

    try {
      setError('')
      const { data } = await client.delete(`/planes/${pacienteId}/${plan._id}`)
      setPlanes((actuales) => actuales.filter((item) => item._id !== plan._id))
      if (planEditandoId === plan._id) cancelarEdicion()
      setMensaje(data.message || 'Plan alimenticio eliminado correctamente.')
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible eliminar el plan alimenticio.')
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
    paciente,
  ) {
    iniciarTrabajo(paciente)
    setPacienteId(paciente._id)
    setError('')
    setMensaje('')
    setAvisoPlanGuardado(null)
  }

  function regresarPacientes() {
    cerrarTrabajo()
    setPacienteId('')
    setPlanes([])

    setNombre('')
    setObjetivo('')
    setFechaPlan(obtenerFechaActual())
    setPlanEditandoId('')

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
    setAvisoPlanGuardado(null)
  }

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-transparent px-4 py-6 sm:px-5 md:px-6 md:py-7">
      {avisoPlanGuardado && (
        <ModalPlanGuardado
          tipo={avisoPlanGuardado.tipo}
          mensaje={avisoPlanGuardado.mensaje}
          onCerrar={() => setAvisoPlanGuardado(null)}
        />
      )}

      <div className="mx-auto w-full max-w-[1800px]">
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
                    <CardPacientePlanes
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
                      onClick={() => seleccionarPaciente(paciente)}
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

            {referenciaNutricional && <div className={`mb-5 overflow-hidden rounded-3xl border border-[#cbded2] bg-white shadow-[0_12px_30px_rgba(24,73,53,0.06)] ${panelBalanceVisible ? 'xl:mr-[330px] 2xl:mr-[370px]' : ''}`}>
              <button type="button" aria-expanded={mostrarGuia} onClick={() => setMostrarGuia(v => !v)}
                className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-[#f3f9f5] to-white px-5 py-4 text-left transition hover:bg-[#edf6f0]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e1f0e7] text-[#246b55]"><Sparkles size={19}/></span>
                  <span className="min-w-0"><strong className="block text-sm font-extrabold text-[#173f34] sm:text-base">Guía clínica del paciente</strong>
                    <span className="mt-0.5 block text-xs text-[#648073]">Objetivos, horarios y consideraciones alimentarias</span></span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#246b55] shadow-sm">{mostrarGuia ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
              </button>
              {mostrarGuia && <div className="border-t border-[#e4eee6] p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Target size={16} className="text-[#246b55]"/>
                  <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-[#52716a]">Objetivos clínicos</span>
                  {(referenciaNutricional.expediente?.nutricion?.objetivos || []).length ?
                    referenciaNutricional.expediente.nutricion.objetivos.map(v =>
                      <span key={v} className="rounded-full border border-[#d6e9dc] bg-[#eef7f0] px-3 py-1 text-xs font-semibold text-[#246b55]">{({
                        perdida_peso:'Pérdida de peso', incremento_masa:'Incremento de masa muscular',
                        rendimiento_deportivo:'Rendimiento deportivo', salud:'Mejorar la salud',
                        control_enfermedades:'Control de enfermedades', imagen_personal:'Imagen personal',
                      })[v] || v}</span>) : <span className="text-xs text-[#82968b]">Sin objetivos registrados</span>}
                </div>
                {objetivosReferencia && <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ['Energía', objetivosReferencia.objetivoKcal, 'kcal'],
                    ['Proteína', objetivosReferencia.proteinasGramos, 'g'],
                    ['Carbohidratos', objetivosReferencia.carbohidratosGramos, 'g'],
                    ['Grasas', objetivosReferencia.grasasGramos, 'g'],
                  ].map(([titulo, valor, unidad]) => <div key={titulo} className="rounded-2xl border border-[#e0ece3] bg-[#f5f9f6] p-3">
                    <p className="text-[11px] font-semibold text-[#648073]">{titulo}</p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-[#173f34]">{numero(Number(valor) || 0, 1)} <span className="text-xs font-medium text-[#648073]">{unidad}</span></p>
                  </div>)}
                </div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e0ece3] p-3">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#173f34]"><CalendarDays size={15} className="text-[#246b55]"/> Hábitos de alimentación</h4>
                    <p className="text-xs leading-6 text-[#52716a]">Comidas al día: <strong>{referenciaNutricional.expediente?.nutricion?.numeroComidasDia || 'Sin registrar'}</strong></p>
                    <p className="text-xs leading-6 text-[#52716a]">Primera comida: <strong>{referenciaNutricional.expediente?.nutricion?.primeraComida || 'Sin registrar'}</strong></p>
                    <p className="text-xs leading-6 text-[#52716a]">Última comida: <strong>{referenciaNutricional.expediente?.nutricion?.ultimaComida || 'Sin registrar'}</strong></p>
                  </div>
                  <div className="rounded-2xl border border-[#e0ece3] p-3">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#173f34]"><Apple size={15} className="text-[#246b55]"/> Restricciones y cuidados</h4>
                    <p className="text-xs leading-6 text-[#52716a]">Alergias: <strong>{referenciaNutricional.expediente?.alergias || 'Sin registrar'}</strong></p>
                    <p className="text-xs leading-6 text-[#52716a]">Intolerancias: <strong>{referenciaNutricional.expediente?.nutricion?.intoleranciasAlimentarias || 'Sin registrar'}</strong></p>
                  </div>
                </div>
                <button type="button" onClick={() => navigate('/calculo-nutricional')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e7f2eb] px-3 py-2 text-xs font-bold text-[#246b55] transition hover:bg-[#d6e9dc]">
                  <ChartNoAxesColumnIncreasing size={15}/> Ver cálculo nutricional <ArrowLeft size={14} className="rotate-180"/>
                </button>
              </div>}
            </div>}

            {errorReferencia && <p className="mb-4 text-xs text-amber-800">{errorReferencia}</p>}

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

            {!panelBalanceVisible && <button type="button" onClick={() => setPanelBalanceVisible(true)}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#c9dfd0] bg-white px-3 py-2 text-xs font-bold text-[#246b55] shadow-sm hover:bg-[#eaf3ed]">
              <PanelRightOpen size={16}/> Mostrar seguimiento del plan
            </button>}

            <div className={`mb-7 grid items-start gap-5 ${panelBalanceVisible ? 'xl:grid-cols-[minmax(0,1fr)_310px] 2xl:grid-cols-[minmax(0,1fr)_350px]' : 'grid-cols-1'}`}>
              <div className="min-w-0">
            <form
              ref={formularioPlanRef}
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
                    {planEditandoId ? 'Editar plan' : 'Nuevo plan'}
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

                <label className="block min-w-0 max-w-full overflow-hidden">
                  <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={16} /> Fecha del menú *
                  </span>
                  <input
                    type="date"
                    required
                    value={fechaPlan}
                    onChange={(event) => setFechaPlan(event.target.value)}
                    className="block min-w-0 max-w-full w-full rounded-xl border border-[#d3dfd9] bg-white px-3 py-2.5 text-sm font-bold text-[#173f34] outline-none transition focus:border-[#4d816f]"
                  />
                </label>
              </div>

              {!planEditandoId && <button type="button" onClick={() => { setModalidadSeleccionada(null); setMostrarEleccion(true) }}
                className="mb-5 flex w-full items-center justify-between gap-3 rounded-xl border border-[#c9dfd0] bg-white px-4 py-3 text-left text-sm font-bold text-[#246b55] hover:bg-[#edf5f0]">
                <span className="flex items-center gap-2"><Sparkles size={17}/> {modoAsistido ? 'Plan asistido activo · Cambiar modalidad' : 'Elegir modalidad de creación del plan'}</span>
                <ChevronDown size={17}/>
              </button>}

              {modoAsistido && <div className="mb-6 overflow-hidden rounded-2xl border border-[#c9dfd0] bg-white">
                <button type="button" aria-expanded={mostrarEquivalentes} onClick={() => setMostrarEquivalentes(v => !v)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-[#173f34]">
                  <span className="flex items-center gap-2"><Apple size={17} className="text-[#246b55]"/> Asistente de equivalentes y alimentos</span>
                  {mostrarEquivalentes ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {mostrarEquivalentes && <div className="border-t border-[#e1eae3] p-4">
                  <p className="mb-3 text-xs text-[#648073]">Solo se muestran alimentos con equivalencia documentada y revisión registrada. Las recomendaciones deben validarse según el expediente.</p>
                  {errorEquivalentes && <p className="mb-3 text-sm text-amber-800">{errorEquivalentes}</p>}
                  {asistenteEquivalentes && <>
                    <p className="mb-3 text-xs font-semibold text-[#52716a]">{asistenteEquivalentes.alimentosVerificados.length} alimentos con equivalencia verificable disponibles</p>
                    {asistenteEquivalentes.alimentosVerificados.length ? <>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setGrupoSugerido('')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!grupoSugerido ? 'bg-[#246b55] text-white' : 'bg-[#eaf3ed] text-[#246b55]'}`}>Todos</button>
                        {[...new Set(asistenteEquivalentes.alimentosVerificados.map(a => a.grupo))].map(grupo =>
                          <button type="button" key={grupo} onClick={() => setGrupoSugerido(grupo)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${grupoSugerido === grupo ? 'bg-[#246b55] text-white' : 'bg-[#eaf3ed] text-[#246b55]'}`}>{grupo}</button>)}
                      </div>
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {asistenteEquivalentes.alimentosVerificados.filter(a => !grupoSugerido || a.grupo === grupoSugerido).map(alimento =>
                          <div key={alimento._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e1eae3] p-3">
                            <div><p className="text-sm font-bold text-[#173f34]">{alimento.nombre}</p>
                              <p className="text-xs text-[#648073]">{alimento.grupo} · {alimento.equivalentes} equivalente(s) por porción · {alimento.porcion?.gramos ? alimento.porcion.gramos + ' g' : alimento.porcion?.unidad || 'porción'}</p>
                              <p className="text-[11px] text-[#648073]">Fuente: {alimento.fuentes.filter(f => f.tipoDato === 'equivalencia').map(f => f.nombre + (f.edicion ? ' · ' + f.edicion : '')).join(', ')}</p>
                            </div>
                            <button type="button" disabled={!comidaActiva} onClick={() => { if (comidaActiva) agregarAlimentoCatalogo(comidaActiva.id, alimento) }}
                              className="rounded-xl bg-[#e1f0e7] px-3 py-2 text-xs font-bold text-[#246b55] hover:bg-[#d2e8da] disabled:opacity-50">+ Añadir a {comidaActiva?.nombre || 'comida'}</button>
                          </div>)}
                      </div>
                    </> : <p className="rounded-xl bg-[#f4f6f3] p-3 text-sm text-[#648073]">Todavía no hay equivalencias con fuente y revisión verificadas en el catálogo. El editor manual sigue disponible; es necesario revisar e importar datos autorizados antes de generar sustituciones.</p>}
                    <p className="mt-3 text-xs text-[#648073]">{asistenteEquivalentes.advertencia}</p>
                  </>}
                </div>}
              </div>}

              {/* COMIDAS */}

              <div className="mt-7">
                <div className="mb-4">
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

                </div>

                <div className="relative mb-4">
                  <div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                    {comidas.map((comida, indiceComida) => {
                      const activa = comida.id === comidaActiva?.id
                      const kcalComida = numero(
                        calcularTotales(comida.alimentos).kcal,
                        0,
                      )
                      const gramosComida = numero(
                        calcularTotales(comida.alimentos).gramos,
                        0,
                      )

                      return (
                        <TarjetaSelectorComida
                          key={comida.id}
                          comida={comida}
                          activa={activa}
                          kcal={kcalComida}
                          gramos={gramosComida}
                          icono={<IconoComida nombre={comida.nombre} size={16} />}
                          formatearHora={formatearHora}
                          onSeleccionar={setComidaActivaId}
                          onDragStart={iniciarArrastreComida}
                          onDragEnd={() => setComidaArrastradaId('')}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={soltarComida}
                          arrastrando={comidaArrastradaId === comida.id}
                          puedeMoverAntes={indiceComida > 0}
                          puedeMoverDespues={indiceComida < comidas.length - 1}
                          onMover={moverComida}
                        />
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => setMostrarMenuComidas((visible) => !visible)}
                      className="min-w-[142px] snap-start rounded-2xl border border-dashed border-[#9ebbad] bg-[#f6faf7] px-3 py-2.5 text-sm font-extrabold text-[#246b55] transition hover:bg-[#eaf4ee]"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={16} /> Agregar comida
                      </span>
                      <span className="mt-1 block text-center text-xs font-medium text-[#6e9484]">Personalizable</span>
                    </button>
                  </div>

                  {mostrarMenuComidas && (
                    <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-2xl border border-[#d4e3db] bg-white p-2 shadow-[0_16px_40px_rgba(32,78,64,0.16)]">
                      {opcionesComida.map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => agregarComida(opcion)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#173f34] transition hover:bg-[#eef6f1]"
                        >
                          <IconoComida nombre={opcion} size={16} />
                          {opcion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {comidas.filter((item) => item.id === comidaActiva?.id).map(
                    (
                      comida,
                    ) => {
                      const index = comidas.findIndex((item) => item.id === comida.id)
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
                                  <IconoComida nombre={comida.nombre} size={18} />
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

                                  <p className="truncate text-xs font-semibold text-slate-500">
                                    {comida.platillo || 'Platillo sin nombre'}
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

                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_minmax(0,170px)]">
                              <CampoTexto
                                label="Tiempo de comida *"
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
                                label="Nombre del platillo *"
                                value={comida.platillo}
                                onChange={(valor) => cambiarComida(comida.id, 'platillo', valor)}
                                placeholder="Ej. ensalada de pollo"
                                required
                              />

                              <label className="block min-w-0 max-w-full overflow-hidden">
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Hora</span>
                                <input
                                  type="time"
                                  value={comida.hora || ''}
                                  onChange={(event) => cambiarComida(comida.id, 'hora', event.target.value)}
                                  className="block min-w-0 max-w-full w-full rounded-xl border border-[#d3dfd9] bg-white px-3 py-2.5 text-sm font-bold text-[#173f34] outline-none transition focus:border-[#4d816f]"
                                />
                              </label>
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
                                  placeholder="Buscar alimento: tortilla, pollo, aguacate..."
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
                                  comida.platillo || comida.nombre ||
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
                                compacto
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
                    {numero(totalesPlan.gramos, 0)} g ·{' '}
                    {numero(
                      totalesPlan.proteina,
                    )}{' '}
                    g proteína
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {planEditandoId && (
                    <button type="button" onClick={cancelarEdicion} className="rounded-xl border border-[#b9cec4] bg-white px-5 py-3 text-sm font-bold text-[#48685c]">
                      Cancelar edición
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(36,107,85,0.2)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
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

                    {guardando ? 'Guardando...' : planEditandoId ? 'Guardar cambios' : 'Guardar plan'}
                  </button>
                </div>
              </div>
            </form>
              </div>
              {panelBalanceVisible && <aside aria-label="Seguimiento nutricional del plan" className="min-w-0 xl:fixed xl:right-6 xl:top-[68px] xl:z-30 xl:w-[310px] 2xl:w-[350px]">
                <div className="max-h-none space-y-4 rounded-2xl border border-[#c9dfd0] bg-white p-4 shadow-[0_12px_32px_rgba(32,78,64,0.08)] xl:max-h-[calc(100vh-84px)] xl:overflow-y-auto">
                  <div className="flex items-center justify-between gap-2 border-b border-[#e3eee6] pb-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <ChartNoAxesColumnIncreasing size={19} className="shrink-0 text-[#246b55]"/>
                      <div><h3 className="text-sm font-extrabold text-[#173f34]">Seguimiento del plan</h3>
                        <p className="text-[11px] text-[#648073]">Se actualiza al editar alimentos</p></div>
                    </div>
                    <button type="button" onClick={() => setPanelBalanceVisible(false)} aria-label="Ocultar seguimiento" title="Ocultar seguimiento"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#52716a] transition hover:bg-[#e7f2eb] hover:text-[#173f34]">
                      <PanelRightClose size={18}/>
                    </button>
                  </div>
                  {objetivosReferencia ? <div className="space-y-4">
                    {metas.map(([etiqueta, clave, unidad, meta]) => {
                      const actual = Number(totalesPlan[clave]) || 0
                      const objetivo = Number(meta) || 0
                      const pct = objetivo > 0 ? actual / objetivo * 100 : 0
                      return <div key={clave} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs"><span className="font-bold text-[#52716a]">{etiqueta}</span><span className="font-extrabold tabular-nums text-[#173f34]">{numero(actual, 1)} / {numero(objetivo, 1)} {unidad}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#e3eee6]"><div className={`h-full rounded-full transition-all ${pct > 105 ? 'bg-amber-500' : 'bg-[#70ae89]'}`} style={{width: Math.min(100, Math.max(0,pct)) + '%'}}/></div>
                        {clave !== 'kcal' && <p className="text-[11px] font-medium tabular-nums text-[#52716a]">{numero(actual * (clave === 'grasas' ? 9 : 4), 1)} / {numero(objetivo * (clave === 'grasas' ? 9 : 4), 1)} kcal</p>}
                        <p className={`text-[11px] ${pct > 105 ? 'text-amber-700' : 'text-[#789286]'}`}>{actual > objetivo ? 'Excedente: ' : 'Pendiente: '}{numero(Math.abs(objetivo - actual), 1)} {unidad}</p>
                      </div>
                    })}
                  </div> : <p className="rounded-xl bg-[#f2f7f3] p-3 text-xs text-[#648073]">Guarda un cálculo nutricional para comparar el menú con las metas del paciente.</p>}
                  <div className="border-t border-[#e3eee6] pt-3">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#173f34]"><Target size={15} className="text-[#246b55]"/> Comida seleccionada</h4>
                    <p className="text-xs font-bold text-[#52716a]">{comidaActiva?.nombre || 'Sin comida seleccionada'}</p>
                    <p className="mt-1 text-xs text-[#648073]">{numero(calcularTotales(comidaActiva?.alimentos || []).kcal, 0)} kcal añadidas{modoAsistido && objetivosReferencia ? ` · Meta: ${numero(Number(objetivosReferencia.objetivoKcal) * (distribucion[comidas.findIndex(c => c.id === comidaActiva?.id)] || 0) / 100, 0)} kcal` : ''}</p>
                  </div>
                  {modoAsistido && objetivosReferencia && <div className="border-t border-[#e3eee6] pt-3">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#173f34]"><ListChecks size={15} className="text-[#246b55]"/> Distribución por comida</h4>
                    <div className="space-y-2">{comidasBalance.map((comida, indice) => <div key={comida.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-[#52716a]">{comida.nombre}</span>
                      <input aria-label={`Porcentaje para ${comida.nombre}`} type="number" min="0" max="100" step="1" value={distribucion[indice] ?? 0}
                        onChange={e => setDistribucion(actual => comidas.map((_, i) => i === indice ? Number(e.target.value) : (actual[i] ?? 0)))}
                        className="w-14 rounded-lg border border-[#c8ddd2] px-1.5 py-1 text-right text-xs"/> <span className="text-xs text-[#648073]">%</span>
                    </div>)}</div>
                    <p className={`mt-2 text-[11px] font-bold ${distribucion.reduce((a,b)=>a+b,0) === 100 ? 'text-[#246b55]' : 'text-amber-700'}`}>Total: {distribucion.reduce((a,b)=>a+b,0)}% {distribucion.reduce((a,b)=>a+b,0) !== 100 && '· Ajusta a 100%'}</p>
                  </div>}
                  <div className="border-t border-[#e3eee6] pt-3">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#173f34]"><Apple size={15} className="text-[#246b55]"/> Grupos utilizados</h4>
                    {Object.keys(gruposCatalogo).length ? Object.entries(gruposCatalogo).map(([grupo,cantidad]) =>
                      <div key={grupo} className="flex justify-between gap-2 py-1 text-xs"><span className="text-[#52716a]">{grupo}</span><strong className="text-[#173f34]">{numero(cantidad, 1)}</strong></div>)
                      : <p className="text-xs text-[#82968b]">Sin alimentos agregados</p>}
                    <p className="mt-2 text-[11px] text-[#82968b]">Porciones del catálogo; aún no son equivalentes SMAE asignados.</p>
                  </div>
                </div>
              </aside>}
            </div>

            {/* ============================================
                PLANES REGISTRADOS
            ============================================ */}

            <div className={`rounded-3xl border border-[#eadfc8] bg-gradient-to-br from-[#fffaf1] to-[#f7efdf] p-4 shadow-[0_14px_40px_rgba(94,76,48,0.07)] sm:p-5 md:p-6 ${panelBalanceVisible ? "xl:mr-[330px] 2xl:mr-[370px]" : ""}`}>
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
                      <CardPlanRegistrado
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
                        onEditar={editarPlan}
                        onEliminar={eliminarPlan}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {mostrarEleccion && pacienteId && !planEditandoId && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#173f34]/45 p-4" onMouseDown={e => { if (e.target === e.currentTarget) { setModalidadSeleccionada(null); setMostrarEleccion(false) } }}>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-modalidad-plan" className="w-full max-w-lg rounded-3xl border border-[#d5e5da] bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e1f0e7] text-[#246b55]"><Sparkles size={23}/></div>
            <button type="button" aria-label="Cerrar" onClick={() => { setModalidadSeleccionada(null); setMostrarEleccion(false) }} className="rounded-lg p-2 text-[#648073] hover:bg-[#edf5f0]"><X size={19}/></button>
          </div>
          <h2 id="modal-modalidad-plan" className="mt-4 text-xl font-extrabold text-[#173f34]">¿Cómo quieres crear este plan?</h2>
          <p className="mt-1 text-sm text-[#648073]">Elige cómo comenzar. Puedes cambiar de modalidad antes de guardar.</p>
          <div className="mt-5 space-y-2">
            <button type="button" disabled={!objetivosReferencia} onClick={() => setModalidadSeleccionada('asistido')}
              aria-pressed={modalidadSeleccionada === 'asistido'}
              aria-label="Plan asistido"
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246b55] disabled:cursor-not-allowed disabled:opacity-50 ${modalidadSeleccionada === 'asistido' ? 'border-[#246b55] bg-[#e1f1e7] shadow-[0_0_0_2px_rgba(36,107,85,0.12)]' : 'border-[#d2e3d8] bg-white hover:border-[#9bc8ab] hover:bg-[#f4faf6]'}`}>
              <Sparkles size={20} className="mt-0.5 shrink-0 text-[#246b55]"/><span className="min-w-0 flex-1"><strong className="block text-sm text-[#173f34]">Plan asistido</strong><span className="mt-1 block text-xs text-[#52716a]">Usa objetivos, cantidad de comidas y horarios del expediente. {objetivosReferencia ? 'Cálculo disponible.' : 'Requiere cálculo guardado.'}</span></span>
              {modalidadSeleccionada === 'asistido' ? <CheckCircle2 size={21} className="shrink-0 text-[#246b55]"/> : <Circle size={21} className="shrink-0 text-[#b7cfc0]"/>}
            </button>
            <button type="button" disabled={!planes.length} onClick={() => setModalidadSeleccionada('duplicar')}
              aria-pressed={modalidadSeleccionada === 'duplicar'}
              aria-label="Duplicar último plan"
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246b55] disabled:cursor-not-allowed disabled:opacity-50 ${modalidadSeleccionada === 'duplicar' ? 'border-[#246b55] bg-[#e1f1e7] shadow-[0_0_0_2px_rgba(36,107,85,0.12)]' : 'border-[#d2e3d8] bg-white hover:border-[#9bc8ab] hover:bg-[#f4faf6]'}`}>
              <Save size={20} className="mt-0.5 shrink-0 text-[#246b55]"/><span><strong className="block text-sm text-[#173f34]">Duplicar último plan</strong><span className="mt-1 block text-xs text-[#52716a]">Recupera alimentos y cantidades para ajustarlos.</span></span>
              {modalidadSeleccionada === 'duplicar' ? <CheckCircle2 size={21} className="shrink-0 text-[#246b55]"/> : <Circle size={21} className="shrink-0 text-[#b7cfc0]"/>}
            </button>
            <button type="button" onClick={() => setModalidadSeleccionada('libre')}
              aria-pressed={modalidadSeleccionada === 'libre'}
              aria-label="Desde cero"
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246b55] disabled:cursor-not-allowed disabled:opacity-50 ${modalidadSeleccionada === 'libre' ? 'border-[#246b55] bg-[#e1f1e7] shadow-[0_0_0_2px_rgba(36,107,85,0.12)]' : 'border-[#d2e3d8] bg-white hover:border-[#9bc8ab] hover:bg-[#f4faf6]'}`}>
              <Apple size={20} className="mt-0.5 shrink-0 text-[#246b55]"/><span><strong className="block text-sm text-[#173f34]">Desde cero</strong><span className="mt-1 block text-xs text-[#52716a]">Editor libre, sin modificar tu información clínica.</span></span>
              {modalidadSeleccionada === 'libre' ? <CheckCircle2 size={21} className="shrink-0 text-[#246b55]"/> : <Circle size={21} className="shrink-0 text-[#b7cfc0]"/>}
            </button>
          </div>
          {modalidadSeleccionada && <div className="mt-4 rounded-xl border border-[#c8ddd2] bg-[#f1f7f3] p-3">
            <p className="text-sm font-extrabold text-[#173f34]">¿Confirmas esta modalidad?</p>
            <p className="mt-1 text-xs text-[#52716a]">{{
              asistido: 'Preparar un plan asistido con el expediente y cálculo del paciente.',
              duplicar: 'Crear una copia independiente del último plan registrado.',
              libre: 'Comenzar un plan nuevo desde cero.',
            }[modalidadSeleccionada]} {comidas.some(c => c.alimentos.length > 0) ? 'El borrador actual podría reemplazarse.' : ''}</p>
          </div>}
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setModalidadSeleccionada(null); setMostrarEleccion(false) }} className="rounded-xl border border-[#c8ddd2] bg-white px-5 py-2.5 text-sm font-bold text-[#52716a]">Cancelar</button>
            <button type="button" disabled={!modalidadSeleccionada} onClick={confirmarModalidad} className="rounded-xl bg-[#246b55] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Confirmar selección</button>
          </div>
        </div>
      </div>}

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
  const [desplazamiento, setDesplazamiento] = useState(0)
  const gesto = useRef({ activo: false, inicioX: 0 })

  function iniciarArrastre(event) {
    if (event.target.closest('input, button')) return

    gesto.current = {
      activo: true,
      inicioX: event.clientX,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function moverArrastre(event) {
    if (!gesto.current.activo) return

    const distancia = Math.min(0, event.clientX - gesto.current.inicioX)
    setDesplazamiento(Math.max(-130, distancia))
  }

  function terminarArrastre() {
    if (!gesto.current.activo) return
    gesto.current.activo = false

    if (desplazamiento <= -105) {
      onEliminar()
      return
    }

    setDesplazamiento(desplazamiento < -45 ? -72 : 0)
  }

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
    <div className="relative overflow-hidden rounded-2xl border border-[#dde8e2] bg-red-50">
      <button
        type="button"
        onClick={onEliminar}
        className="absolute inset-y-0 right-0 flex w-[72px] flex-col items-center justify-center gap-1 bg-red-500 text-xs font-bold text-white"
        aria-label={`Eliminar ${alimento.nombre}`}
      >
        <Trash2 size={18} />
        Eliminar
      </button>

      <div
        className="relative bg-white p-3 transition-transform duration-200 ease-out touch-pan-y sm:p-4"
        style={{ transform: `translateX(${desplazamiento}px)` }}
        onPointerDown={iniciarArrastre}
        onPointerMove={moverArrastre}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
      >
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

      <div className="mt-3 grid gap-3 sm:grid-cols-[110px_180px_1fr]">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Cantidad
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
            Unidad / porción
          </span>

          <div className="truncate rounded-xl border border-[#d3dfd9] bg-[#f7faf8] px-3 py-2.5 text-sm font-semibold text-[#4d816f]">
            {obtenerTextoPorcion(alimento.porcion)}
          </div>
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

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
      <p className="mt-2 text-[11px] font-medium text-slate-400 sm:hidden">
        Desliza a la izquierda para eliminar
      </p>
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
  compacto = false,
}) {
  if (compacto) {
    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-[#cfe0d6] bg-[#edf6f1] px-4 py-3 text-xs font-bold text-[#246b55] ${className}`}>
        <span className="mr-1 text-[#173f34]">{titulo}</span>
        <span>{numero(totales.kcal, 0)} kcal</span>
        <span>{numero(totales.gramos, 0)} g totales</span>
        <span>{numero(totales.proteina)} g proteína</span>
        <span>{numero(totales.carbohidratos)} g carbohidratos</span>
        <span>{numero(totales.grasas)} g grasas</span>
        <span>{numero(totales.fibra)} g fibra</span>
      </div>
    )
  }

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <DatoResumen
          label="Energía"
          value={`${numero(
            totales.kcal,
            0,
          )} kcal`}
        />

        <DatoResumen
          label="Peso conocido"
          value={`${numero(
            totales.gramos,
            0,
          )} g`}
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
