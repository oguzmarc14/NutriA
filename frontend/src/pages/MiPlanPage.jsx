import CardPlanPaciente from '../components/paciente/CardPlanPaciente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function MiPlanPage() {
  const { perfil, loading, error } = usePerfilPaciente()
  const planes = perfil?.planes || []

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi alimentacion</p><h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mi plan alimenticio</h1><p className="mt-2 text-slate-500">Consulta las comidas e indicaciones preparadas por tu nutriologo.</p></div>
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && planes.length === 0}>
        <div className="space-y-5">{planes.map((plan) => <CardPlanPaciente key={plan._id} plan={plan} />)}</div>
      </EstadoCargaPaciente>
    </section>
  )
}

export default MiPlanPage
