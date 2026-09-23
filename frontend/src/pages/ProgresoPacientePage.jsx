import { useEffect, useState } from 'react'
import { TrendingUp, UserRound } from 'lucide-react'
import client from '../api/client'
import HistorialSeguimientoComidas from '../components/progreso/HistorialSeguimientoComidas'
import ResumenProgresoPaciente from '../components/progreso/ResumenProgresoPaciente'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'
import GraficaProgresoPeso from '../components/dashboard/GraficaProgresoPeso'

function ProgresoPacientePage() {
  const { pacienteTrabajo } = usePacienteTrabajo()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pacienteTrabajo?.id) return

    async function cargar() {
      try {
        setLoading(true)
        setError('')
        const respuesta = await client.get(`/seguimiento-comidas/paciente/${pacienteTrabajo.id}`)
        setData(respuesta.data)
      } catch (err) {
        setError(err.response?.data?.message || 'No fue posible cargar el progreso')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [pacienteTrabajo?.id])

  if (!pacienteTrabajo) return <section className="mx-auto max-w-5xl p-5 md:p-8"><div className="rounded-3xl border border-dashed border-[#bcd2c6] bg-white/60 p-10 text-center"><UserRound className="mx-auto text-[#4d816f]" size={36} /><h1 className="mt-4 text-2xl font-black text-[#173f34]">Selecciona un paciente</h1><p className="mt-2 text-slate-500">Usa el boton Trabajar con paciente para consultar su progreso.</p></div></section>

  const planActual = data?.planes?.find((plan) => plan.activo) || data?.planes?.[0]

  return <section className="mx-auto min-w-0 max-w-6xl p-4 sm:p-5 md:p-8"><div className="mb-7"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#4d816f]"><TrendingUp size={17} />Progreso del paciente</p><h1 className="mt-2 break-words text-3xl font-black text-[#173f34] md:text-4xl">{pacienteTrabajo.name}</h1><p className="mt-2 text-slate-500">Consulta su adherencia, satisfaccion y evolucion corporal.</p></div>{loading && <p className="rounded-2xl bg-white/70 p-5 font-bold text-[#48685c]">Cargando progreso...</p>}{error && <p className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">{error}</p>}{data && !loading && <><ResumenProgresoPaciente resumen={data.resumen} objetivo={planActual?.objetivo} /><div className="mt-5"><GraficaProgresoPeso mediciones={data.mediciones} /></div><HistorialSeguimientoComidas registros={data.registros} /></>}</section>
}

export default ProgresoPacientePage
