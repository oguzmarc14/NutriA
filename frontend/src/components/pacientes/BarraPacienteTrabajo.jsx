import { Apple, ClipboardPlus, Ruler, UserRound, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { usePacienteTrabajo } from '../../context/pacienteTrabajo'

function AccesoPaciente({ icon: Icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
          isActive
            ? 'bg-[#246b55] text-white'
            : 'bg-white/75 text-[#246b55] hover:bg-white'
        }`
      }
    >
      <Icon size={14} />
      {label}
    </NavLink>
  )
}

function BarraPacienteTrabajo() {
  const { cerrarTrabajo, pacienteTrabajo } = usePacienteTrabajo()
  const navigate = useNavigate()

  if (!pacienteTrabajo) return null

  function cerrarPaciente() {
    cerrarTrabajo()
    navigate('/pacientes')
  }

  return (
    <section className="border-b border-[#b9d3c6] bg-[#d4e9dd] px-4 py-3 sm:px-5 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#246b55] text-white">
            <UserRound size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#5c7c70]">
              Trabajando con
            </p>
            <p className="truncate text-sm font-extrabold text-[#173f34] sm:text-base">
              {pacienteTrabajo.name}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 lg:ml-auto">
          <AccesoPaciente
            icon={ClipboardPlus}
            label="Expediente"
            to={`/pacientes/${pacienteTrabajo.id}/expediente`}
          />
          <AccesoPaciente icon={Ruler} label="Mediciones" to="/mediciones" />
          <AccesoPaciente icon={Apple} label="Plan alimenticio" to="/planes" />
          <button
            type="button"
            onClick={cerrarPaciente}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#a9c8b9] bg-red-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-red-600 hover:scale-105"
          >
            <X size={14} />
            Cerrar trabajo
          </button>
        </div>
      </div>
    </section>
  )
}

export default BarraPacienteTrabajo
