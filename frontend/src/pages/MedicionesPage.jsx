import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bone,
  Calculator,
  CircleGauge,
  Dumbbell,
  History,
  Info,
  Ruler,
  Save,
  Scale,
  Sparkles,
  UserRound,
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

function MedicionesPage() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [mediciones, setMediciones] = useState([])

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

        /*
         * Si el paciente tiene fecha de nacimiento,
         * calculamos automáticamente su edad.
         */
        if (data.paciente?.birthDate) {
          setEdad(
            calcularEdad(data.paciente.birthDate).toString(),
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

  const esPrimeraMedicion = mediciones.length === 0

  const nivelSeleccionado =
    nivelesActividad.find(
      ({ nivel }) => nivel === nivelActividadFisica,
    ) || nivelesActividad[2]

  const imcPreview = useMemo(() => {
    const pesoNumero = Number(peso)
    const estaturaNumero = Number(estatura)

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

  function actualizarAntropometrica(campo, valor) {
    setAntropometricas((actuales) => ({
      ...actuales,
      [campo]: valor,
    }))
  }

  function calcularEdad(fechaNacimiento) {
    const nacimiento = new Date(fechaNacimiento)
    const hoy = new Date()

    let edadCalculada =
      hoy.getFullYear() - nacimiento.getFullYear()

    const diferenciaMes =
      hoy.getMonth() - nacimiento.getMonth()

    if (
      diferenciaMes < 0 ||
      (diferenciaMes === 0 &&
        hoy.getDate() < nacimiento.getDate())
    ) {
      edadCalculada -= 1
    }

    return edadCalculada
  }

  function formatearFecha(fecha) {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(fecha))
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

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
          Mediciones
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34] md:text-4xl">
          Seguimiento de mediciones
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Registra la evolución corporal del paciente y
          consulta su historial de seguimiento.
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

      {/* SELECCIÓN DE PACIENTE */}

      <div className="mb-6 rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserRound size={17} />
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
            onSubmit={registrarMedicion}
            className="mb-6"
          >
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              {/* COLUMNA IZQUIERDA */}

              <div className="space-y-6">
                {/* INFORMACIÓN GENERAL */}

                <article className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-[#173f34]">
                        Información general
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Datos generales para el seguimiento
                        del paciente.
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
                            setEdad(event.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 outline-none transition focus:border-[#4d816f]"
                          placeholder="27"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          años
                        </span>
                      </div>
                    </label>

                    {/* TIPO DE MEDICIÓN */}

                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Tipo de medición
                      </span>

                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          esPrimeraMedicion
                            ? 'border-[#b9d8c9] bg-[#eef7f2]'
                            : 'border-[#dfe8e3] bg-[#f8faf9]'
                        }`}
                      >
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
                              : `El paciente tiene ${mediciones.length} medición${
                                  mediciones.length === 1
                                    ? ''
                                    : 'es'
                                } previa${
                                  mediciones.length === 1
                                    ? ''
                                    : 's'
                                }.`}
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
                            className={`h-10 rounded-lg transition ${
                              nivel <=
                              nivelActividadFisica
                                ? 'bg-[#72a98c]'
                                : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                            aria-label={`Nivel de actividad ${nivel}`}
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

                    <div className="mt-5 rounded-xl bg-[#eef7f2] p-4">
                      <p className="font-bold text-[#246b55]">
                        Nivel {nivelSeleccionado.nivel} ·{' '}
                        {nivelSeleccionado.nombre}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {nivelSeleccionado.descripcion}
                      </p>
                    </div>
                  </div>
                </article>

                {/* MEDIDAS CORPORALES */}

                <article className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                      <Ruler size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-[#173f34]">
                        Medidas corporales
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Registra peso y estatura. El IMC se
                        calcula automáticamente.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {/* PESO */}

                    <label className="space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Scale size={16} />
                        Peso{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </span>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={peso}
                          onChange={(event) =>
                            setPeso(event.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-[#4d816f]"
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
                        Estatura{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </span>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.5"
                          max="3"
                          value={estatura}
                          onChange={(event) =>
                            setEstatura(event.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 outline-none transition focus:border-[#4d816f]"
                          placeholder="1.75"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          m
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* IMC PREVIEW */}

                  <div className="mt-5 rounded-xl border border-[#e1e9e5] bg-[#f8faf9] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#246b55]">
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

                            <p className="text-sm font-semibold text-[#4d816f]">
                              {clasificarIMC(imcPreview)}
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

              {/* COLUMNA DERECHA */}

              <article className="h-fit rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
                <div className="mb-6 flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
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
                    value={antropometricas.grasaCorporal}
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
                    value={antropometricas.grasaVisceral}
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
                    value={antropometricas.masaMuscular}
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
                    value={antropometricas.masaOsea}
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
                    value={antropometricas.proteina}
                    onChange={(valor) =>
                      actualizarAntropometrica(
                        'proteina',
                        valor,
                      )
                    }
                  />
                </div>

                <div className="mt-6 flex gap-3 rounded-xl border border-[#dce9e3] bg-[#eef7f2] p-4">
                  <Info
                    size={19}
                    className="mt-0.5 shrink-0 text-[#246b55]"
                  />

                  <p className="text-sm leading-6 text-slate-600">
                    Estas medidas son opcionales. Regístralas
                    cuando estén disponibles para complementar
                    el seguimiento del paciente.
                  </p>
                </div>
              </article>
            </div>

            {/* GUARDAR */}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-[#246b55] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
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
              <div className="rounded-xl border border-dashed border-[#cfdcd6] p-8 text-center">
                <Calculator
                  className="mx-auto mb-3 text-[#4d816f]"
                  size={30}
                />

                <p className="font-bold text-[#173f34]">
                  Sin mediciones
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Esta será la primera medición del paciente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
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
                    {mediciones.map((medicion) => (
                      <tr
                        key={medicion._id}
                        className="border-b border-slate-50 text-sm text-slate-700 last:border-0"
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
                          <span className="rounded-lg bg-[#e8f3ee] px-3 py-1.5 font-bold text-[#246b55]">
                            {medicion.imc}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {medicion.nivelActividadFisica
                            ? `Nivel ${medicion.nivelActividadFisica}`
                            : '—'}
                        </td>

                        <td className="px-3 py-4">
                          {medicion.esPrimeraMedicion ? (
                            <span className="rounded-lg bg-[#eef7f2] px-3 py-1.5 text-xs font-bold text-[#246b55]">
                              Primera
                            </span>
                          ) : (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                              Seguimiento
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

/*
 * Campo reutilizable para las medidas
 * antropométricas opcionales.
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
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon
          size={16}
          className="text-[#8b6549]"
        />

        {label}

        <span className="ml-auto text-xs font-normal text-slate-400">
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
            onChange(event.target.value)
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 outline-none transition focus:border-[#4d816f]"
          placeholder="—"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
          {unidad}
        </span>
      </div>
    </label>
  )
}

export default MedicionesPage