import {
  Apple,
  LayoutDashboard,
  LogOut,
  Ruler,
  UserCog,
  Users,
} from 'lucide-react'

import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'

function DashboardLayout() {
  const { logout, user } = useAuth()

  const navigationVisible = [
    {
      icon: LayoutDashboard,
      label: 'Resumen',
      to: '/',
    },

    // Módulos exclusivos del nutriólogo
    ...(user.role === 'nutritionist'
      ? [
          {
            icon: Users,
            label: 'Pacientes',
            to: '/pacientes',
          },
          {
            icon: Ruler,
            label: 'Mediciones',
            to: '/mediciones',
          },
          {
            icon: Apple,
            label: 'Planes alimenticios',
            to: '/planes',
          },
        ]
      : []),

    // Módulo exclusivo del administrador
    ...(user.role === 'admin'
      ? [
          {
            icon: UserCog,
            label: 'Usuarios',
            to: '/usuarios',
          },
        ]
      : []),
  ]

  const roleLabel =
    user.role === 'admin'
      ? 'Administrador'
      : user.role === 'nutritionist'
        ? 'Nutriólogo'
        : 'Paciente'

  return (
    <div className="min-h-screen bg-[#dfece4] md:grid md:grid-cols-[260px_1fr]">
      {/* SIDEBAR */}

      <aside className="hidden min-h-screen border-r border-[#c8dbd0] bg-[#fbfdfb] p-5 shadow-[6px_0_30px_rgba(36,107,85,0.05)] md:flex md:flex-col">
        {/* LOGO / MARCA */}

        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#246b55] to-[#4d816f] text-lg font-black text-white shadow-[0_8px_20px_rgba(36,107,85,0.22)]">
            N
          </div>

          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#173f34]">
              NutriA
            </p>

            <p className="text-xs text-slate-500">
              Gestión nutricional
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}

        <nav className="space-y-2">
          {navigationVisible.map(
            ({ icon: Icon, label, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d8ebe0] to-[#e7f2eb] text-[#246b55] shadow-sm'
                      : 'text-slate-500 hover:bg-[#eef5f1] hover:text-[#173f34]'
                  }`
                }
              >
                <Icon size={19} />

                {label}
              </NavLink>
            ),
          )}
        </nav>

        {/* USUARIO */}

        <div className="mt-auto rounded-2xl border border-[#e6dfcf] bg-gradient-to-br from-[#faf7ef] to-[#f3eee3] p-4 shadow-sm">
          <p className="truncate text-sm font-bold text-[#173f34]">
            {user.name}
          </p>

          <p className="mb-3 text-xs text-slate-500">
            {roleLabel}
          </p>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-[#246b55] transition hover:text-[#173f34]"
          >
            <LogOut size={16} />

            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO GENERAL */}

      <main className="min-w-0 bg-[#dfece4]">
        {/* HEADER */}

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#c8dbd0] bg-[#fbfdfb]/95 px-5 py-4 shadow-[0_4px_18px_rgba(32,78,64,0.04)] backdrop-blur-md md:px-8">
          {/* LOGO MÓVIL */}

          <div className="md:hidden">
            <p className="text-lg font-extrabold text-[#173f34]">
              NutriA
            </p>
          </div>

          {/* USUARIO */}

          <p className="ml-auto text-sm font-semibold text-[#466057]">
            {user.name}
          </p>
        </header>

        {/* FONDO GLOBAL */}

        <div className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#dfece4]">
          {/* DECORACIÓN SUPERIOR */}

          <div className="pointer-events-none absolute -right-32 -top-36 h-[420px] w-[420px] rounded-full bg-[#b5d2bf]/45 blur-3xl" />

          {/* DECORACIÓN IZQUIERDA */}

          <div className="pointer-events-none absolute -bottom-48 -left-32 h-[480px] w-[480px] rounded-full bg-[#cbdcbd]/40 blur-3xl" />

          {/* DECORACIÓN CENTRAL */}

          <div className="pointer-events-none absolute left-[42%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#eef5e9]/45 blur-3xl" />

          {/* PEQUEÑO ACENTO VERDE */}

          <div className="pointer-events-none absolute right-[18%] top-[48%] h-[280px] w-[280px] rounded-full bg-[#bfd9ca]/25 blur-3xl" />

          {/* CONTENIDO DE LAS PÁGINAS */}

          <div className="relative z-10 min-h-[calc(100vh-65px)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout