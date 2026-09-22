import { Calculator, History, Plus } from 'lucide-react'
import { ordenarMediciones } from '../../utils/mediciones'
import CardHistorialMedicion from './CardHistorialMedicion'

function HistorialMediciones({ mediciones, cargando = false, onVer, onRegistrar, soloLectura = false }) {
  const ordenadas = ordenarMediciones(mediciones)

  return (
    <section className="rounded-3xl border border-[#d5e1e3] bg-gradient-to-br from-[#f7fbfb] to-[#edf4f4] p-5 shadow-[0_14px_40px_rgba(40,76,80,0.06)] md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcebed] text-[#3e6e73]"><History size={19} /></div>
        <div><h2 className="text-xl font-extrabold text-[#173f34]">Historial de mediciones</h2><p className="text-sm text-slate-500">Registros del mas reciente al mas antiguo.</p></div>
      </div>

      {cargando ? <p className="text-sm text-slate-500">Cargando historial...</p> : ordenadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#bdd3c7] bg-white/60 p-10 text-center">
          <Calculator className="mx-auto mb-3 text-[#4d816f]" size={32} />
          <p className="text-lg font-extrabold text-[#173f34]">Aun no hay mediciones</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Registra la primera medicion para comenzar a visualizar la evolucion del paciente.</p>
          {!soloLectura && <button type="button" onClick={onRegistrar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white"><Plus size={17} />Registrar primera medicion</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {ordenadas.map((medicion, indice) => (
            <CardHistorialMedicion key={medicion._id} medicion={medicion} anterior={ordenadas[indice + 1]} esUltima={indice === 0} onVer={onVer} soloLectura={soloLectura} />
          ))}
        </div>
      )}
    </section>
  )
}

export default HistorialMediciones
