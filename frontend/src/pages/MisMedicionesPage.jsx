import CardMedicionPaciente from '../components/paciente/CardMedicionPaciente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function numero(value, decimales = 1) {
  const valor = Number(value)
  return Number.isFinite(valor) ? valor.toFixed(decimales).replace(/\.0$/, '') : '—'
}

function MisMedicionesPage() {
  const { perfil, loading, error } = usePerfilPaciente()
  const mediciones = perfil?.mediciones || []

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi progreso</p><h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mis mediciones</h1><p className="mt-2 text-slate-500">Consulta tu historial de medidas corporales.</p></div>
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && mediciones.length === 0}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{mediciones.map((medicion) => <CardMedicionPaciente key={medicion._id} medicion={medicion} numero={numero} />)}</div>
      </EstadoCargaPaciente>
    </section>
  )
}

export default MisMedicionesPage
