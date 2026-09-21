import {
  Apple,
  ClipboardPlus,
  Ruler,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import CardModuloDashboard from '../components/dashboard/CardModuloDashboard'
import { useAuth } from '../context/auth'

const nutritionistModules = [
  {
    description: 'Registra, consulta y actualiza la información general.',
    icon: Users,
    name: 'Pacientes',
    to: '/pacientes',
  },
  {
    description: 'Consulta antecedentes e historial médico del paciente.',
    icon: ClipboardPlus,
    name: 'Expedientes clínicos',
    to: '/pacientes',
  },
  {
    description: 'Registra peso, estatura e IMC y consulta su historial.',
    icon: Ruler,
    name: 'Mediciones',
    to: '/mediciones',
  },
  {
    description: 'Crea planes básicos con comidas e indicaciones.',
    icon: Apple,
    name: 'Planes alimenticios',
    to: '/planes',
  },
]

const adminModules = [
  {
    description:
      'Autoriza y administra las cuentas del personal con acceso a NutriA.',
    icon: UserCog,
    name: 'Gestión de usuarios',
    to: '/usuarios',
  },
  {
    description:
      'Controla qué administradores y nutriólogos tienen acceso al sistema.',
    icon: ShieldCheck,
    name: 'Control de acceso',
    to: '/usuarios',
  },
]

const patientModules = [
  {
    description: 'Consulta tus antecedentes y la informacion registrada por tu nutriologo.',
    icon: ClipboardPlus,
    name: 'Mi expediente',
    to: '/mi-expediente',
  },
  {
    description: 'Revisa tu historial de peso, estatura, IMC y medidas corporales.',
    icon: Ruler,
    name: 'Mis mediciones',
    to: '/mis-mediciones',
  },
  {
    description: 'Consulta tus comidas e indicaciones nutricionales actuales.',
    icon: Apple,
    name: 'Mi plan alimenticio',
    to: '/mi-plan',
  },
]

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user.role === 'admin'
  const isPatient = user.role === 'patient'

  const modules = isAdmin ? adminModules : isPatient ? patientModules : nutritionistModules

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
          {isAdmin
            ? 'Administra los usuarios y accesos del sistema NutriA.'
            : isPatient
              ? 'Consulta tu informacion nutricional y el seguimiento preparado para ti.'
              : 'Administra el seguimiento nutricional de tus pacientes desde un solo lugar.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map(
          ({ description, icon: Icon, name, to }) => (
            <CardModuloDashboard
              key={name}
              onClick={() => navigate(to)}
              descripcion={description}
              icono={Icon}
              nombre={name}
            />
          ),
        )}
      </div>
    </section>
  )
}

export default DashboardPage
