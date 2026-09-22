import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import CardPlanPaciente from '../components/paciente/CardPlanPaciente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function MiPlanPage() {
  const { perfil, loading, error } = usePerfilPaciente()
  const planes = perfil?.planes || []
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    const desplazamiento = hoy.getTimezoneOffset() * 60000
    return new Date(hoy - desplazamiento).toISOString().slice(0, 10)
  })
  const planesDelDia = planes.filter(
    (plan) => (plan.fechaInicio || plan.createdAt || '').slice(0, 10) === fechaSeleccionada,
  )

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi alimentacion</p><h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mi plan alimenticio</h1><p className="mt-2 text-slate-500">Selecciona una fecha para consultar las comidas preparadas por tu nutriologo.</p></div>
        <label className="w-full sm:max-w-xs"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#48685c]"><CalendarDays size={17} />Fecha del menú</span><input type="date" value={fechaSeleccionada} onChange={(event) => setFechaSeleccionada(event.target.value)} className="w-full rounded-xl border border-[#c9ddd3] bg-white px-4 py-3 font-bold text-[#173f34] outline-none focus:border-[#4d816f]" /></label>
      </div>
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && planes.length === 0}>
        {planesDelDia.length > 0 ? <div className="space-y-5">{planesDelDia.map((plan) => <CardPlanPaciente key={plan._id} plan={plan} />)}</div> : <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-10 text-center"><CalendarDays className="mx-auto mb-3 text-[#4d816f]" size={32} /><p className="font-extrabold text-[#173f34]">No hay comidas para esta fecha</p><p className="mt-1 text-sm text-slate-500">Selecciona otro día para consultar tu menú.</p></div>}
      </EstadoCargaPaciente>
    </section>
  )
}

export default MiPlanPage
