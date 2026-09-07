import { useEffect, useState } from 'react'
import {
  Calculator,
  History,
  Ruler,
  Save,
  Scale,
} from 'lucide-react'
import client from '../api/client'

function MedicionesPage() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [mediciones, setMediciones] = useState([])
  const [peso, setPeso] = useState('')
  const [estatura, setEstatura] = useState('')
  const [loading, setLoading] = useState(true)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
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
      setMediciones([])
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

        setMediciones(data.mediciones)
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

  async function registrarMedicion(event) {
    event.preventDefault()

    if (!pacienteId) {
      setError('Selecciona un paciente')
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const { data } = await client.post(
        `/mediciones/${pacienteId}`,
        {
          peso,
          estatura,
        },
      )

      setMediciones((actuales) => [
        data.medicion,
        ...actuales,
      ])

      setPeso('')
      setEstatura('')
      setMensaje('Medición registrada correctamente')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible registrar la medición',
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
          Mediciones
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
          Seguimiento de mediciones
        </h1>

        <p className="mt-2 text-slate-500">
          Registra peso y estatura y consulta el historial de IMC del paciente.
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
            onSubmit={registrarMedicion}
            className="mb-6 rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#173f34]">
                Nueva medición
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                El IMC se calculará automáticamente al guardar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Scale size={16} />
                  Peso
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

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Ruler size={16} />
                  Estatura
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

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {guardando
                  ? 'Guardando...'
                  : 'Registrar medición'}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)] md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                <History size={19} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#173f34]">
                  Historial
                </h2>

                <p className="text-sm text-slate-500">
                  Mediciones registradas del paciente.
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
                  Registra la primera medición del paciente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
                      <th className="px-3 py-3 font-semibold">
                        Fecha
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
                    </tr>
                  </thead>

                  <tbody>
                    {mediciones.map((medicion) => (
                      <tr
                        key={medicion._id}
                        className="border-b border-slate-50 text-sm text-slate-700 last:border-0"
                      >
                        <td className="px-3 py-4">
                          {formatearFecha(medicion.fecha)}
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

export default MedicionesPage