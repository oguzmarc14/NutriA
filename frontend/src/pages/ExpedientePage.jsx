import { useEffect, useState } from 'react'
import { ArrowLeft, ClipboardPlus, Save } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'

const expedienteInicial = {
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  alergias: '',
  medicamentos: '',
  padecimientos: '',
  observaciones: '',
}

function ExpedientePage() {
  const { pacienteId } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [expediente, setExpediente] = useState(expedienteInicial)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    async function cargarExpediente() {
      try {
        setLoading(true)
        setError('')

        const { data } = await client.get(
          `/expedientes/${pacienteId}`,
        )

        setPaciente(data.paciente)

        if (data.expediente) {
          setExpediente({
            antecedentesPersonales:
              data.expediente.antecedentesPersonales || '',
            antecedentesFamiliares:
              data.expediente.antecedentesFamiliares || '',
            alergias: data.expediente.alergias || '',
            medicamentos: data.expediente.medicamentos || '',
            padecimientos: data.expediente.padecimientos || '',
            observaciones: data.expediente.observaciones || '',
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

  function manejarCambio(event) {
    const { name, value } = event.target

    setExpediente((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  async function guardarExpediente(event) {
    event.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const { data } = await client.put(
        `/expedientes/${pacienteId}`,
        expediente,
      )

      setExpediente({
        antecedentesPersonales:
          data.expediente.antecedentesPersonales || '',
        antecedentesFamiliares:
          data.expediente.antecedentesFamiliares || '',
        alergias: data.expediente.alergias || '',
        medicamentos: data.expediente.medicamentos || '',
        padecimientos: data.expediente.padecimientos || '',
        observaciones: data.expediente.observaciones || '',
      })

      setMensaje('Expediente clínico guardado correctamente')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible guardar el expediente clínico',
      )
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl p-5 md:p-8">
        <p className="text-sm text-slate-500">
          Cargando expediente clínico...
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <Link
        to="/pacientes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#246b55]"
      >
        <ArrowLeft size={17} />
        Volver a pacientes
      </Link>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
            <ClipboardPlus size={21} />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
              Expediente clínico
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
              {paciente?.name || 'Paciente'}
            </h1>
          </div>
        </div>

        <p className="text-slate-500">
          Consulta y registra el historial médico del paciente.
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

      <form
        onSubmit={guardarExpediente}
        className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Antecedentes personales
            </span>

            <textarea
              name="antecedentesPersonales"
              value={expediente.antecedentesPersonales}
              onChange={manejarCambio}
              rows="4"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Cirugías, enfermedades previas, hábitos..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Antecedentes familiares
            </span>

            <textarea
              name="antecedentesFamiliares"
              value={expediente.antecedentesFamiliares}
              onChange={manejarCambio}
              rows="4"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Diabetes, hipertensión, antecedentes familiares..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Alergias
            </span>

            <textarea
              name="alergias"
              value={expediente.alergias}
              onChange={manejarCambio}
              rows="3"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Alergias conocidas"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Medicamentos
            </span>

            <textarea
              name="medicamentos"
              value={expediente.medicamentos}
              onChange={manejarCambio}
              rows="3"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Medicamentos actuales"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Padecimientos
            </span>

            <textarea
              name="padecimientos"
              value={expediente.padecimientos}
              onChange={manejarCambio}
              rows="3"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Padecimientos actuales"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Observaciones
            </span>

            <textarea
              name="observaciones"
              value={expediente.observaciones}
              onChange={manejarCambio}
              rows="3"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#4d816f]"
              placeholder="Observaciones generales"
            />
          </label>
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
              : 'Guardar expediente'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ExpedientePage