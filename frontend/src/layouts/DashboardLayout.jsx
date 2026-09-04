import {
  Apple,
  ClipboardPlus,
  LayoutDashboard,
  LogOut,
  Ruler,
  Users,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'

const navigation = [
  { icon: LayoutDashboard, label: 'Resumen', active: true },
  { icon: Users, label: 'Pacientes' },
  { icon: ClipboardPlus, label: 'Expedientes' },
  { icon: Ruler, label: 'Mediciones' },
  { icon: Apple, label: 'Planes alimenticios' },
]

function DashboardLayout() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[#f6f8f6] md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden min-h-screen border-r border-[#dfe8e3] bg-white p-5 md:flex md:flex-col">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#246b55] text-lg font-black text-white">
            N
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#173f34]">NutriA</p>
            <p className="text-xs text-slate-500">Gestión nutricional</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ active, icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                active
                  ? 'bg-[#e8f3ee] text-[#246b55]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-[#f8f5eb] p-4">
          <p className="truncate text-sm font-bold text-[#173f34]">{user.name}</p>
          <p className="mb-3 text-xs capitalize text-slate-500">{user.role}</p>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-[#246b55]"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex items-center justify-between border-b border-[#dfe8e3] bg-white px-5 py-4 md:px-8">
          <div className="md:hidden">
            <p className="text-lg font-extrabold text-[#173f34]">NutriA</p>
          </div>
          <p className="ml-auto text-sm font-semibold text-slate-600">{user.name}</p>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
