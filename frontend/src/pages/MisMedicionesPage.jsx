import { useState } from 'react'
import HistorialMediciones from '../components/mediciones/HistorialMediciones'
import ModalDetalleMedicion from '../components/mediciones/ModalDetalleMedicion'
import ResumenProgresoMediciones from '../components/mediciones/ResumenProgresoMediciones'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function MisMedicionesPage() {
  const { perfil, loading, error } = usePerfilPaciente()
  const mediciones = perfil?.mediciones || []
  const [medicionSeleccionada, setMedicionSeleccionada] = useState(null)

  return (
    <section className="mx-auto min-w-0 max-w-6xl overflow-x-hidden p-4 sm:p-5 md:p-8">
      <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi progreso</p><h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mis mediciones</h1><p className="mt-2 text-slate-500">Consulta tu evolucion y el historial registrado por tu nutriologo.</p></div>
      {medicionSeleccionada && <ModalDetalleMedicion medicion={medicionSeleccionada} onCerrar={() => setMedicionSeleccionada(null)} />}
      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && mediciones.length === 0}>
        {mediciones.length > 0 && <ResumenProgresoMediciones mediciones={mediciones} permitirComparar={false} />}
        <HistorialMediciones mediciones={mediciones} onVer={setMedicionSeleccionada} soloLectura />
      </EstadoCargaPaciente>
    </section>
  )
}

export default MisMedicionesPage
