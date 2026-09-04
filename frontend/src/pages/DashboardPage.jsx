import { Apple, ArrowRight, ClipboardPlus, Ruler, Users } from 'lucide-react'
import { useAuth } from '../context/auth'

const modules = [
  {
    description: 'Registra, consulta y actualiza la información general.',
    icon: Users,
    name: 'Pacientes',
  },
  {
    description: 'Consulta antecedentes e historial médico del paciente.',
    icon: ClipboardPlus,
    name: 'Expedientes clínicos',
  },
  {
    description: 'Registra peso, estatura e IMC y consulta su historial.',
    icon: Ruler,
    name: 'Mediciones',
  },
  {
    description: 'Crea planes básicos con comidas e indicaciones.',
    icon: Apple,
    name: 'Planes alimenticios',
  },
]

function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
          Panel principal
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34] md:text-4xl">
          Hola, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-slate-500">
          Administra el seguimiento nutricional desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map(({ description, icon: Icon, name }) => (
          <article
            key={name}
            className="group rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                <Icon size={21} />
              </div>
              <ArrowRight
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#246b55]"
                size={19}
              />
            </div>
            <h2 className="font-bold text-[#173f34]">{name}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
