import { useEffect, useState } from 'react'
import {
  Activity,
  Apple,
  ArrowLeft,
  Bone,
  BriefcaseMedical,
  CalendarDays,
  Cigarette,
  ClipboardPlus,
  Coffee,
  Dumbbell,
  HeartPulse,
  Mail,
  MapPin,
  Martini,
  Pill,
  Phone,
  Ruler,
  Save,
  Scale,
  ShieldAlert,
  Sparkles,
  Syringe,
  UserRound,
} from 'lucide-react'

import { Link, useParams } from 'react-router-dom'
import client from '../api/client'

const expedienteInicial = {
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  alergias: '',
  enfermedades: '',
  medicamentos: '',
  cirugias: '',
  lesionesActuales: '',
  padecimientos: '',

  tratamientoFarmacologico: {
    usa: false,
    descripcion: '',
  },

  tabaquismo: {
    fuma: false,
    frecuenciaSemanal: '',
  },

  alcohol: {
    consume: false,
    frecuencia: '',
  },

  drogas: {
    consume: false,
    descripcion: '',
  },

  anabolicos: {
    consume: false,
    descripcion: '',
  },

  suplementos: {
    consume: false,
    descripcion: '',
  },

  nutricion: {
    primeraComida: '',
    ultimaComida: '',
    comidaFavorita: '',
    comidaDisgusta: '',
    numeroComidasDia: '',
    cafePorDia: '',
    bebidasEnergeticasSemana: '',
    bebidasAzucaradasSemana: '',
    intoleranciasAlimentarias: '',
    objetivoPrincipal: '',
    objetivoOtro: '',
  },

  deporte: {
    lugarEntrenamiento: '',
    lugarOtro: '',
    diasPorSemana: '',
    ejercicioRealizar: '',
    nivelExperiencia: '',
  },

  observaciones: '',
}

function ExpedientePage() {
  const { pacienteId } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [ultimaMedicion, setUltimaMedicion] = useState(null)

  const [expediente, setExpediente] =
    useState(expedienteInicial)

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  /*
   * ----------------------------------------------------
   * CARGAR EXPEDIENTE
   * ----------------------------------------------------
   */

  useEffect(() => {
    async function cargarExpediente() {
      try {
        setLoading(true)
        setError('')

        const { data } = await client.get(
          `/expedientes/${pacienteId}`,
        )

        setPaciente(data.paciente)
        setUltimaMedicion(data.ultimaMedicion || null)

        if (data.expediente) {
          setExpediente({
            antecedentesPersonales:
              data.expediente.antecedentesPersonales || '',

            antecedentesFamiliares:
              data.expediente.antecedentesFamiliares || '',

            alergias:
              data.expediente.alergias || '',

            enfermedades:
              data.expediente.enfermedades || '',

            medicamentos:
              data.expediente.medicamentos || '',

            cirugias:
              data.expediente.cirugias || '',

            lesionesActuales:
              data.expediente.lesionesActuales || '',

            padecimientos:
              data.expediente.padecimientos || '',

            tratamientoFarmacologico: {
              usa:
                data.expediente
                  .tratamientoFarmacologico
                  ?.usa || false,

              descripcion:
                data.expediente
                  .tratamientoFarmacologico
                  ?.descripcion || '',
            },

            tabaquismo: {
              fuma:
                data.expediente.tabaquismo
                  ?.fuma || false,

              frecuenciaSemanal:
                data.expediente.tabaquismo
                  ?.frecuenciaSemanal || '',
            },

            alcohol: {
              consume:
                data.expediente.alcohol
                  ?.consume || false,

              frecuencia:
                data.expediente.alcohol
                  ?.frecuencia || '',
            },

            drogas: {
              consume:
                data.expediente.drogas
                  ?.consume || false,

              descripcion:
                data.expediente.drogas
                  ?.descripcion || '',
            },

            anabolicos: {
              consume:
                data.expediente.anabolicos
                  ?.consume || false,

              descripcion:
                data.expediente.anabolicos
                  ?.descripcion || '',
            },

            suplementos: {
              consume:
                data.expediente.suplementos
                  ?.consume || false,

              descripcion:
                data.expediente.suplementos
                  ?.descripcion || '',
            },

            nutricion: {
              primeraComida:
                data.expediente.nutricion
                  ?.primeraComida || '',

              ultimaComida:
                data.expediente.nutricion
                  ?.ultimaComida || '',

              comidaFavorita:
                data.expediente.nutricion
                  ?.comidaFavorita || '',

              comidaDisgusta:
                data.expediente.nutricion
                  ?.comidaDisgusta || '',

              numeroComidasDia:
                data.expediente.nutricion
                  ?.numeroComidasDia ?? '',

              cafePorDia:
                data.expediente.nutricion
                  ?.cafePorDia || '',

              bebidasEnergeticasSemana:
                data.expediente.nutricion
                  ?.bebidasEnergeticasSemana || '',

              bebidasAzucaradasSemana:
                data.expediente.nutricion
                  ?.bebidasAzucaradasSemana || '',

              intoleranciasAlimentarias:
                data.expediente.nutricion
                  ?.intoleranciasAlimentarias || '',

              objetivoPrincipal:
                data.expediente.nutricion
                  ?.objetivoPrincipal || '',

              objetivoOtro:
                data.expediente.nutricion
                  ?.objetivoOtro || '',
            },

            deporte: {
              lugarEntrenamiento:
                data.expediente.deporte
                  ?.lugarEntrenamiento || '',

              lugarOtro:
                data.expediente.deporte
                  ?.lugarOtro || '',

              diasPorSemana:
                data.expediente.deporte
                  ?.diasPorSemana ?? '',

              ejercicioRealizar:
                data.expediente.deporte
                  ?.ejercicioRealizar || '',

              nivelExperiencia:
                data.expediente.deporte
                  ?.nivelExperiencia || '',
            },

            observaciones:
              data.expediente.observaciones || '',
          })
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar el expediente clínico',
        )
      } finally {
        setLoading(false)
      }
    }

    cargarExpediente()
  }, [pacienteId])

  /*
   * ----------------------------------------------------
   * CAMBIOS DE CAMPOS
   * ----------------------------------------------------
   */

  function manejarCampo(campo, valor) {
    setExpediente((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  function manejarGrupo(grupo, campo, valor) {
    setExpediente((actual) => ({
      ...actual,

      [grupo]: {
        ...actual[grupo],
        [campo]: valor,
      },
    }))
  }

  /*
   * ----------------------------------------------------
   * GUARDAR
   * ----------------------------------------------------
   */

  async function guardarExpediente(event) {
    event.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const payload = {
        ...expediente,

        nutricion: {
          ...expediente.nutricion,

          numeroComidasDia:
            expediente.nutricion.numeroComidasDia === ''
              ? undefined
              : Number(
                  expediente.nutricion.numeroComidasDia,
                ),
        },

        deporte: {
          ...expediente.deporte,

          diasPorSemana:
            expediente.deporte.diasPorSemana === ''
              ? undefined
              : Number(
                  expediente.deporte.diasPorSemana,
                ),
        },
      }

      const { data } = await client.put(
        `/expedientes/${pacienteId}`,
        payload,
      )

      setMensaje(
        data.message ||
          'Expediente clínico guardado correctamente',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible guardar el expediente clínico',
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
        hoy.getDate() < nacimiento.getDate())
    ) {
      edad -= 1
    }

    return edad
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

  function obtenerActividad(nivel) {
    const niveles = {
      1: 'Sedentario',
      2: 'Ligero',
      3: 'Moderado',
      4: 'Activo',
      5: 'Muy activo',
    }

    return niveles[nivel] || 'Sin registrar'
  }

  function formatearNacimiento(fecha) {
    if (!fecha) {
      return 'Sin registrar'
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(fecha))
  }

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl p-5 md:p-8">
        <div className="rounded-3xl border border-[#cfe0d6] bg-white/70 p-8">
          <p className="text-sm text-slate-500">
            Cargando expediente clínico...
          </p>
        </div>
      </section>
    )
  }

  const edad =
    ultimaMedicion?.edad ||
    calcularEdad(paciente?.birthDate)

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-transparent px-5 py-7 md:px-8 md:py-9">
      <div className="mx-auto max-w-7xl">
        {/* VOLVER */}

        <Link
          to="/pacientes"
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#c8ddd2] bg-white/70 px-4 py-2 text-sm font-bold text-[#246b55] transition hover:bg-white"
        >
          <ArrowLeft size={17} />

          Volver a pacientes
        </Link>

        {/* HEADER */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9ebdf] text-[#246b55] shadow-sm">
              <ClipboardPlus size={23} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
                Expediente clínico
              </p>

              <h1 className="text-3xl font-black tracking-tight text-[#173f34] md:text-4xl">
                {paciente?.name || 'Paciente'}
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-slate-500">
            Consulta la información disponible del
            paciente y completa únicamente los datos
            clínicos que sean necesarios.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {mensaje}
          </div>
        )}

        {/* ============================================
            INFORMACIÓN AUTOMÁTICA
        ============================================ */}

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* IDENTIFICACIÓN */}

          <article className="rounded-3xl border border-[#cfe0d6] bg-gradient-to-br from-[#f4faf6] to-[#e9f3ed] p-5 shadow-[0_14px_40px_rgba(32,78,64,0.08)] md:p-6">
            <TituloSeccion
              icon={UserRound}
              titulo="Identificación personal"
              descripcion="Información tomada del perfil del paciente."
              color="verde"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <DatoAutomatico
                icon={UserRound}
                label="Nombre"
                value={paciente?.name || 'Sin registrar'}
              />

              <DatoAutomatico
                icon={UserRound}
                label="Género"
                value={obtenerSexo(paciente?.sex)}
              />

              <DatoAutomatico
                icon={CalendarDays}
                label="Fecha de nacimiento"
                value={formatearNacimiento(
                  paciente?.birthDate,
                )}
              />

              <DatoAutomatico
                icon={CalendarDays}
                label="Edad"
                value={
                  edad !== null
                    ? `${edad} años`
                    : 'Sin registrar'
                }
              />

              <DatoAutomatico
                icon={Phone}
                label="Teléfono"
                value={
                  paciente?.phone ||
                  'Sin registrar'
                }
              />

              <DatoAutomatico
                icon={Mail}
                label="Correo electrónico"
                value={
                  paciente?.email ||
                  'Sin registrar'
                }
              />
            </div>
          </article>

          {/* ÚLTIMA MEDICIÓN */}

          <article className="rounded-3xl border border-[#d9ddc7] bg-gradient-to-br from-[#fbfaef] to-[#f2f0df] p-5 shadow-[0_14px_40px_rgba(94,76,48,0.07)] md:p-6">
            <TituloSeccion
              icon={Activity}
              titulo="Última medición"
              descripcion="Datos obtenidos automáticamente del módulo de mediciones."
              color="dorado"
            />

            {ultimaMedicion ? (
              <div className="grid grid-cols-2 gap-4">
                <DatoMedicion
                  icon={Scale}
                  label="Peso"
                  value={`${ultimaMedicion.peso} kg`}
                />

                <DatoMedicion
                  icon={Ruler}
                  label="Estatura"
                  value={`${ultimaMedicion.estatura} m`}
                />

                <DatoMedicion
                  icon={HeartPulse}
                  label="IMC"
                  value={ultimaMedicion.imc}
                />

                <DatoMedicion
                  icon={Activity}
                  label="Actividad física"
                  value={obtenerActividad(
                    ultimaMedicion.nivelActividadFisica,
                  )}
                />

                {ultimaMedicion.grasaCorporal != null && (
                  <DatoMedicion
                    icon={Sparkles}
                    label="Grasa corporal"
                    value={`${ultimaMedicion.grasaCorporal}%`}
                  />
                )}

                {ultimaMedicion.masaMuscular != null && (
                  <DatoMedicion
                    icon={Dumbbell}
                    label="Masa muscular"
                    value={`${ultimaMedicion.masaMuscular} kg`}
                  />
                )}

                {ultimaMedicion.grasaVisceral != null && (
                  <DatoMedicion
                    icon={HeartPulse}
                    label="Grasa visceral"
                    value={ultimaMedicion.grasaVisceral}
                  />
                )}

                {ultimaMedicion.masaOsea != null && (
                  <DatoMedicion
                    icon={Bone}
                    label="Masa ósea"
                    value={`${ultimaMedicion.masaOsea} kg`}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d6d4c4] bg-white/40 p-6 text-center">
                <Scale
                  size={30}
                  className="mx-auto mb-2 text-[#9c865d]"
                />

                <p className="font-bold text-[#173f34]">
                  Sin mediciones registradas
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Los datos aparecerán automáticamente
                  cuando registres una medición.
                </p>
              </div>
            )}
          </article>
        </div>

        <form onSubmit={guardarExpediente}>
          {/* ============================================
              ANTECEDENTES
          ============================================ */}

          <article className="mb-6 rounded-3xl border border-[#dfd1c8] bg-gradient-to-br from-[#fff8f4] to-[#f7ece6] p-5 shadow-[0_14px_40px_rgba(115,75,55,0.07)] md:p-6">
            <TituloSeccion
              icon={BriefcaseMedical}
              titulo="Antecedentes personales patológicos"
              descripcion="Todos los campos de esta sección son opcionales."
              color="terracota"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <CampoTexto
                label="Antecedentes personales"
                value={expediente.antecedentesPersonales}
                onChange={(valor) =>
                  manejarCampo(
                    'antecedentesPersonales',
                    valor,
                  )
                }
                placeholder="Enfermedades previas, diagnósticos importantes..."
              />

              <CampoTexto
                label="Antecedentes familiares"
                value={expediente.antecedentesFamiliares}
                onChange={(valor) =>
                  manejarCampo(
                    'antecedentesFamiliares',
                    valor,
                  )
                }
                placeholder="Diabetes, hipertensión, enfermedades familiares..."
              />

              <CampoTexto
                label="Alergias"
                value={expediente.alergias}
                onChange={(valor) =>
                  manejarCampo('alergias', valor)
                }
                placeholder="Alergias conocidas..."
              />

              <CampoTexto
                label="Enfermedades actuales"
                value={expediente.enfermedades}
                onChange={(valor) =>
                  manejarCampo(
                    'enfermedades',
                    valor,
                  )
                }
                placeholder="Enfermedades diagnosticadas actualmente..."
              />

              <CampoTexto
                label="Medicamentos"
                value={expediente.medicamentos}
                onChange={(valor) =>
                  manejarCampo(
                    'medicamentos',
                    valor,
                  )
                }
                placeholder="Medicamentos actuales..."
              />

              <CampoTexto
                label="Cirugías"
                value={expediente.cirugias}
                onChange={(valor) =>
                  manejarCampo('cirugias', valor)
                }
                placeholder="Cirugías previas..."
              />

              <CampoTexto
                label="Lesiones actuales"
                value={expediente.lesionesActuales}
                onChange={(valor) =>
                  manejarCampo(
                    'lesionesActuales',
                    valor,
                  )
                }
                placeholder="Lesiones o limitaciones físicas..."
              />

              <CampoTexto
                label="Otros padecimientos"
                value={expediente.padecimientos}
                onChange={(valor) =>
                  manejarCampo(
                    'padecimientos',
                    valor,
                  )
                }
                placeholder="Otros padecimientos relevantes..."
              />
            </div>
          </article>

          {/* ============================================
              FARMACOLÓGICO Y HÁBITOS
          ============================================ */}

          <article className="mb-6 rounded-3xl border border-[#cfded8] bg-gradient-to-br from-[#f5faf8] to-[#eaf3f0] p-5 shadow-[0_14px_40px_rgba(38,90,70,0.07)] md:p-6">
            <TituloSeccion
              icon={Pill}
              titulo="Farmacológico y hábitos"
              descripcion="Selecciona Sí únicamente cuando corresponda."
              color="verde"
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <CampoCondicional
                icon={Pill}
                titulo="Tratamiento farmacológico actual"
                activo={
                  expediente.tratamientoFarmacologico.usa
                }
                onActivo={(valor) =>
                  manejarGrupo(
                    'tratamientoFarmacologico',
                    'usa',
                    valor,
                  )
                }
                valor={
                  expediente.tratamientoFarmacologico
                    .descripcion
                }
                onValor={(valor) =>
                  manejarGrupo(
                    'tratamientoFarmacologico',
                    'descripcion',
                    valor,
                  )
                }
                placeholder="¿Cuál tratamiento utiliza?"
              />

              <CampoCondicional
                icon={Cigarette}
                titulo="Tabaquismo"
                activo={expediente.tabaquismo.fuma}
                onActivo={(valor) =>
                  manejarGrupo(
                    'tabaquismo',
                    'fuma',
                    valor,
                  )
                }
                valor={
                  expediente.tabaquismo
                    .frecuenciaSemanal
                }
                onValor={(valor) =>
                  manejarGrupo(
                    'tabaquismo',
                    'frecuenciaSemanal',
                    valor,
                  )
                }
                placeholder="Ej. 3 cigarrillos por semana"
              />

              <CampoCondicional
                icon={Martini}
                titulo="Consumo de alcohol"
                activo={expediente.alcohol.consume}
                onActivo={(valor) =>
                  manejarGrupo(
                    'alcohol',
                    'consume',
                    valor,
                  )
                }
                valor={expediente.alcohol.frecuencia}
                onValor={(valor) =>
                  manejarGrupo(
                    'alcohol',
                    'frecuencia',
                    valor,
                  )
                }
                placeholder="Ej. ocasional, una vez por semana..."
              />

              <CampoCondicional
                icon={ShieldAlert}
                titulo="Uso de drogas"
                activo={expediente.drogas.consume}
                onActivo={(valor) =>
                  manejarGrupo(
                    'drogas',
                    'consume',
                    valor,
                  )
                }
                valor={expediente.drogas.descripcion}
                onValor={(valor) =>
                  manejarGrupo(
                    'drogas',
                    'descripcion',
                    valor,
                  )
                }
                placeholder="Tipo y frecuencia..."
              />

              <CampoCondicional
                icon={Syringe}
                titulo="Uso de anabólicos"
                activo={expediente.anabolicos.consume}
                onActivo={(valor) =>
                  manejarGrupo(
                    'anabolicos',
                    'consume',
                    valor,
                  )
                }
                valor={
                  expediente.anabolicos.descripcion
                }
                onValor={(valor) =>
                  manejarGrupo(
                    'anabolicos',
                    'descripcion',
                    valor,
                  )
                }
                placeholder="Tipo y frecuencia..."
              />

              <CampoCondicional
                icon={Sparkles}
                titulo="Suplementos"
                activo={expediente.suplementos.consume}
                onActivo={(valor) =>
                  manejarGrupo(
                    'suplementos',
                    'consume',
                    valor,
                  )
                }
                valor={
                  expediente.suplementos.descripcion
                }
                onValor={(valor) =>
                  manejarGrupo(
                    'suplementos',
                    'descripcion',
                    valor,
                  )
                }
                placeholder="Proteína, creatina, vitaminas..."
              />
            </div>
          </article>

          {/* ============================================
              NUTRICIÓN
          ============================================ */}

          <article className="mb-6 rounded-3xl border border-[#e7ddc5] bg-gradient-to-br from-[#fffaf0] to-[#f7f0df] p-5 shadow-[0_14px_40px_rgba(105,86,48,0.07)] md:p-6">
            <TituloSeccion
              icon={Apple}
              titulo="Nutrición"
              descripcion="Hábitos alimenticios actuales del paciente."
              color="dorado"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <CampoInput
                label="Hora de primera comida"
                type="time"
                value={
                  expediente.nutricion.primeraComida
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'primeraComida',
                    valor,
                  )
                }
              />

              <CampoInput
                label="Hora de última comida"
                type="time"
                value={
                  expediente.nutricion.ultimaComida
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'ultimaComida',
                    valor,
                  )
                }
              />

              <CampoInput
                label="Comida favorita"
                value={
                  expediente.nutricion.comidaFavorita
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'comidaFavorita',
                    valor,
                  )
                }
                placeholder="Ej. tacos, pasta, pollo..."
              />

              <CampoInput
                label="Comida que le disgusta"
                value={
                  expediente.nutricion.comidaDisgusta
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'comidaDisgusta',
                    valor,
                  )
                }
                placeholder="Alimentos que evita por gusto..."
              />

              <CampoInput
                label="Número de comidas al día"
                type="number"
                min="0"
                value={
                  expediente.nutricion.numeroComidasDia
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'numeroComidasDia',
                    valor,
                  )
                }
                placeholder="Ej. 4"
              />

              <CampoInput
                label="Café por día"
                icon={Coffee}
                value={
                  expediente.nutricion.cafePorDia
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'cafePorDia',
                    valor,
                  )
                }
                placeholder="Ej. 2 tazas"
              />

              <CampoInput
                label="Bebidas energéticas por semana"
                value={
                  expediente.nutricion
                    .bebidasEnergeticasSemana
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'bebidasEnergeticasSemana',
                    valor,
                  )
                }
                placeholder="Ej. ninguna, 2 por semana..."
              />

              <CampoInput
                label="Refrescos / bebidas azucaradas por semana"
                value={
                  expediente.nutricion
                    .bebidasAzucaradasSemana
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'nutricion',
                    'bebidasAzucaradasSemana',
                    valor,
                  )
                }
                placeholder="Ej. 3 por semana"
              />

              <div className="md:col-span-2">
                <CampoTexto
                  label="Intolerancias alimentarias"
                  value={
                    expediente.nutricion
                      .intoleranciasAlimentarias
                  }
                  onChange={(valor) =>
                    manejarGrupo(
                      'nutricion',
                      'intoleranciasAlimentarias',
                      valor,
                    )
                  }
                  placeholder="Lactosa, gluten u otras intolerancias..."
                  rows={2}
                />
              </div>
            </div>

            {/* OBJETIVO */}

            <div className="mt-7">
              <p className="mb-3 text-sm font-bold text-[#173f34]">
                Objetivo principal
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [
                    'perdida_peso',
                    'Pérdida de peso corporal',
                  ],
                  [
                    'incremento_masa',
                    'Incremento de masa muscular',
                  ],
                  [
                    'imagen_personal',
                    'Imagen personal',
                  ],
                  ['salud', 'Salud'],
                  [
                    'rendimiento_deportivo',
                    'Rendimiento deportivo',
                  ],
                  [
                    'control_enfermedades',
                    'Control de enfermedades',
                  ],
                  ['otro', 'Otro'],
                ].map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      manejarGrupo(
                        'nutricion',
                        'objetivoPrincipal',
                        valor,
                      )
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      expediente.nutricion
                        .objetivoPrincipal === valor
                        ? 'border-[#4d816f] bg-[#dceee4] text-[#173f34] shadow-sm'
                        : 'border-[#e3d9c4] bg-white/60 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {expediente.nutricion.objetivoPrincipal ===
                'otro' && (
                <div className="mt-4">
                  <CampoInput
                    label="Describe el objetivo"
                    value={
                      expediente.nutricion.objetivoOtro
                    }
                    onChange={(valor) =>
                      manejarGrupo(
                        'nutricion',
                        'objetivoOtro',
                        valor,
                      )
                    }
                    placeholder="Objetivo específico del paciente..."
                  />
                </div>
              )}
            </div>
          </article>

          {/* ============================================
              DEPORTE
          ============================================ */}

          <article className="mb-6 rounded-3xl border border-[#d5dcce] bg-gradient-to-br from-[#f5f9f0] to-[#eaf1e3] p-5 shadow-[0_14px_40px_rgba(60,90,55,0.07)] md:p-6">
            <TituloSeccion
              icon={Dumbbell}
              titulo="Deporte y actividad física"
              descripcion="Información sobre el entrenamiento del paciente."
              color="verde"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin size={16} />
                  Lugar de entrenamiento
                </span>

                <select
                  value={
                    expediente.deporte
                      .lugarEntrenamiento
                  }
                  onChange={(event) =>
                    manejarGrupo(
                      'deporte',
                      'lugarEntrenamiento',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#cedbc9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#4d816f]"
                >
                  <option value="">
                    Sin especificar
                  </option>

                  <option value="casa">
                    Casa
                  </option>

                  <option value="gym">
                    Gimnasio
                  </option>

                  <option value="parque">
                    Parque / calistenia
                  </option>

                  <option value="otro">
                    Otro
                  </option>
                </select>
              </label>

              {expediente.deporte.lugarEntrenamiento ===
                'otro' && (
                <CampoInput
                  label="Otro lugar"
                  value={
                    expediente.deporte.lugarOtro
                  }
                  onChange={(valor) =>
                    manejarGrupo(
                      'deporte',
                      'lugarOtro',
                      valor,
                    )
                  }
                  placeholder="Especifica el lugar..."
                />
              )}

              <CampoInput
                label="Días de entrenamiento por semana"
                type="number"
                min="0"
                max="7"
                value={
                  expediente.deporte.diasPorSemana
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'deporte',
                    'diasPorSemana',
                    valor,
                  )
                }
                placeholder="Ej. 4"
              />

              <CampoInput
                label="Ejercicio a realizar"
                value={
                  expediente.deporte
                    .ejercicioRealizar
                }
                onChange={(valor) =>
                  manejarGrupo(
                    'deporte',
                    'ejercicioRealizar',
                    valor,
                  )
                }
                placeholder="Pesas, correr, fútbol, calistenia..."
              />
            </div>

            {/* NIVEL */}

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-[#173f34]">
                Nivel de experiencia
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [
                    'principiante',
                    'Principiante',
                    'Sin experiencia previa',
                  ],
                  [
                    'principiante_intermedio',
                    'Principiante-intermedio',
                    '1-5 meses',
                  ],
                  [
                    'intermedio',
                    'Intermedio',
                    '6-24 meses',
                  ],
                  [
                    'avanzado',
                    'Avanzado',
                    'Más de 24 meses',
                  ],
                ].map(
                  ([
                    valor,
                    titulo,
                    descripcion,
                  ]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() =>
                        manejarGrupo(
                          'deporte',
                          'nivelExperiencia',
                          valor,
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        expediente.deporte
                          .nivelExperiencia === valor
                          ? 'border-[#4d816f] bg-[#dceee4] shadow-sm'
                          : 'border-[#d7e0d2] bg-white/55 hover:bg-white'
                      }`}
                    >
                      <p className="text-sm font-bold text-[#173f34]">
                        {titulo}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {descripcion}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </div>
          </article>

          {/* ============================================
              OBSERVACIONES
          ============================================ */}

          <article className="mb-6 rounded-3xl border border-[#d8e0e1] bg-gradient-to-br from-[#f7fbfb] to-[#edf4f4] p-5 shadow-[0_14px_40px_rgba(40,76,80,0.06)] md:p-6">
            <TituloSeccion
              icon={ClipboardPlus}
              titulo="Observaciones generales"
              descripcion="Notas adicionales que puedan ser útiles para el seguimiento."
              color="azul"
            />

            <textarea
              value={expediente.observaciones}
              onChange={(event) =>
                manejarCampo(
                  'observaciones',
                  event.target.value,
                )
              }
              rows="4"
              className="w-full resize-none rounded-2xl border border-[#d1dddd] bg-white/75 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Añade aquí cualquier observación adicional..."
            />
          </article>

          {/* GUARDAR */}

          <div className="sticky bottom-5 z-20 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 rounded-2xl bg-[#246b55] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(36,107,85,0.28)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              {guardando
                ? 'Guardando expediente...'
                : 'Guardar expediente'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

/*
 * ----------------------------------------------------
 * COMPONENTES VISUALES
 * ----------------------------------------------------
 */

function TituloSeccion({
  icon: Icon,
  titulo,
  descripcion,
  color,
}) {
  const estilos = {
    verde:
      'bg-[#d9ebdf] text-[#246b55]',

    dorado:
      'bg-[#efe2c6] text-[#8a6840]',

    terracota:
      'bg-[#f0ddd2] text-[#9a684c]',

    azul:
      'bg-[#dcebed] text-[#3e6e73]',
  }

  return (
    <div className="mb-6 flex items-start gap-3">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm ${
          estilos[color] ||
          estilos.verde
        }`}
      >
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-[#173f34]">
          {titulo}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {descripcion}
        </p>
      </div>
    </div>
  )
}

function DatoAutomatico({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-[#4d816f]">
        <Icon size={15} />

        <p className="text-xs font-semibold text-slate-400">
          {label}
        </p>
      </div>

      <p className="break-words text-sm font-extrabold text-[#173f34]">
        {value}
      </p>
    </div>
  )
}

function DatoMedicion({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/55 p-4">
      <div className="mb-2 flex items-center gap-2 text-[#8a6840]">
        <Icon size={16} />

        <span className="text-xs font-semibold text-slate-400">
          {label}
        </span>
      </div>

      <p className="font-extrabold text-[#173f34]">
        {value}
      </p>
    </div>
  )
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        {label}

        <span className="text-xs font-normal text-slate-400">
          Opcional
        </span>
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={rows}
        className="w-full resize-none rounded-xl border border-[#dfd1c8] bg-white/75 px-4 py-3 outline-none transition focus:border-[#a87552] focus:bg-white"
        placeholder={placeholder}
      />
    </label>
  )
}

function CampoInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
  icon: Icon,
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {Icon && <Icon size={16} />}

        {label}

        <span className="ml-auto text-xs font-normal text-slate-400">
          Opcional
        </span>
      </span>

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-[#d4ddd8] bg-white/80 px-4 py-3 outline-none transition focus:border-[#4d816f] focus:bg-white"
        placeholder={placeholder}
      />
    </label>
  )
}

function CampoCondicional({
  icon: Icon,
  titulo,
  activo,
  onActivo,
  valor,
  onValor,
  placeholder,
}) {
  return (
    <div className="rounded-2xl border border-[#d6e3dc] bg-white/60 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e5f0ea] text-[#246b55]">
          <Icon size={17} />
        </div>

        <p className="flex-1 text-sm font-bold text-[#173f34]">
          {titulo}
        </p>

        <div className="flex rounded-xl bg-[#edf2ef] p-1">
          <button
            type="button"
            onClick={() => onActivo(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              !activo
                ? 'bg-white text-[#173f34] shadow-sm'
                : 'text-slate-400'
            }`}
          >
            No
          </button>

          <button
            type="button"
            onClick={() => onActivo(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activo
                ? 'bg-[#246b55] text-white shadow-sm'
                : 'text-slate-400'
            }`}
          >
            Sí
          </button>
        </div>
      </div>

      {activo && (
        <input
          type="text"
          value={valor}
          onChange={(event) =>
            onValor(event.target.value)
          }
          placeholder={placeholder}
          className="mt-4 w-full rounded-xl border border-[#d4ddd8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4d816f]"
        />
      )}
    </div>
  )
}

export default ExpedientePage