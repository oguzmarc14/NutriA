import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import client from '../api/client'
import HistorialSeguimientoComidas from '../components/progreso/HistorialSeguimientoComidas'
import ResumenProgresoPaciente from '../components/progreso/ResumenProgresoPaciente'
import GraficaProgresoPeso from '../components/dashboard/GraficaProgresoPeso'

function MiProgresoPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const respuesta = await client.get('/seguimiento-comidas/mi-progreso')
        setData(respuesta.data)
      } catch (err) {
        setError(err.response?.data?.message || 'No fue posible cargar tu progreso')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const planActual = data?.planes?.find((plan) => plan.activo) || data?.planes?.[0]

  return <section className="mx-auto min-w-0 max-w-6xl p-4 sm:p-5 md:p-8"><div className="mb-7"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#4d816f]"><TrendingUp size={17} />Mi seguimiento</p><h1 className="mt-2 text-3xl font-black text-[#173f34] md:text-4xl">Mi progreso</h1><p className="mt-2 text-slate-500">Revisa tu cumplimiento, preferencias y evolucion.</p></div>{loading && <p className="rounded-2xl bg-white/70 p-5 font-bold text-[#48685c]">Cargando progreso...</p>}{error && <p className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">{error}</p>}{data && !loading && <><ResumenProgresoPaciente resumen={data.resumen} objetivo={planActual?.objetivo} /><div className="mt-5"><GraficaProgresoPeso mediciones={data.mediciones} /></div><HistorialSeguimientoComidas registros={data.registros} /></>}</section>
}

export default MiProgresoPage
