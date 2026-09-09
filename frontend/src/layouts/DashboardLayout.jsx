import {
  Apple,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Ruler,
  UserCog,
  Users,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/auth'

function DashboardLayout() {
  const { logout, user } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()

  /*
   * ----------------------------------------------------
   * NAVEGACIÓN SEGÚN ROL
   * ----------------------------------------------------
   */

  const navigationVisible = [
    {
      icon: LayoutDashboard,
      label: 'Resumen',
      shortLabel: 'Resumen',
      to: '/',
    },

    ...(user.role === 'nutritionist'
      ? [
          {
            icon: Users,
            label: 'Pacientes',
            shortLabel: 'Pacientes',
            to: '/pacientes',
          },

          {
            icon: Ruler,
            label: 'Mediciones',
            shortLabel: 'Medidas',
            to: '/mediciones',
          },

          {
            icon: Apple,
            label: 'Planes alimenticios',
            shortLabel: 'Planes',
            to: '/planes',
          },
        ]
      : []),

    ...(user.role === 'admin'
      ? [
          {
            icon: UserCog,
            label: 'Usuarios',
            shortLabel: 'Usuarios',
            to: '/usuarios',
          },
        ]
      : []),
  ]

  /*
   * ----------------------------------------------------
   * ROL
   * ----------------------------------------------------
   */

  const roleLabel =
    user.role === 'admin'
      ? 'Administrador'
      : user.role === 'nutritionist'
        ? 'Nutriólogo'
        : 'Paciente'

  /*
   * ----------------------------------------------------
   * SABER SI MOSTRAR BOTÓN ATRÁS
   * ----------------------------------------------------
   *
   * Las rutas principales no necesitan botón atrás.
   * Las secundarias, como expediente clínico, sí.
   */

  const rutasPrincipales = [
    '/',
    '/pacientes',
    '/mediciones',
    '/planes',
    '/usuarios',
  ]

  const mostrarAtras =
    !rutasPrincipales.includes(
      location.pathname,
    )

  /*
   * ----------------------------------------------------
   * ATRÁS
   * ----------------------------------------------------
   */

  function regresar() {
    /*
     * Para expediente clínico preferimos regresar
     * directamente a pacientes.
     */
    if (
      location.pathname.startsWith(
        '/pacientes/',
      )
    ) {
      navigate('/pacientes')
      return
    }

    navigate(-1)
  }

  /*
   * ----------------------------------------------------
   * LOGOUT
   * ----------------------------------------------------
   */

  function cerrarSesion() {
    logout()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#dfece4] md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      {/* ============================================
          SIDEBAR DESKTOP
      ============================================ */}

      <aside className="hidden min-h-screen border-r border-[#c8dbd0] bg-[#fbfdfb] p-5 shadow-[6px_0_30px_rgba(36,107,85,0.05)] md:flex md:flex-col">
        {/* MARCA */}

        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#246b55] to-[#4d816f] text-lg font-black text-white shadow-[0_8px_20px_rgba(36,107,85,0.22)]">
            N
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold tracking-tight text-[#173f34]">
              NutriA
            </p>

            <p className="truncate text-xs text-slate-500">
              Gestión nutricional
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}

        <nav className="space-y-2">
          {navigationVisible.map(
            ({
              icon: Icon,
              label,
              to,
            }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({
                  isActive,
                }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d8ebe0] to-[#e7f2eb] text-[#246b55] shadow-sm'
                      : 'text-slate-500 hover:bg-[#eef5f1] hover:text-[#173f34]'
                  }`
                }
              >
                <Icon
                  size={19}
                  className="shrink-0"
                />

                <span className="truncate">
                  {label}
                </span>
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
            onClick={
              cerrarSesion
            }
            className="flex items-center gap-2 text-sm font-semibold text-[#246b55] transition hover:text-[#173f34]"
          >
            <LogOut
              size={16}
            />

            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ============================================
          CONTENIDO
      ============================================ */}

      <main className="min-w-0 overflow-x-hidden bg-[#dfece4]">
        {/* ============================================
            HEADER
        ============================================ */}

        <header className="sticky top-0 z-40 border-b border-[#c8dbd0] bg-[#fbfdfb]/95 shadow-[0_4px_18px_rgba(32,78,64,0.04)] backdrop-blur-md">
          <div className="flex min-h-[64px] items-center gap-3 px-4 sm:px-5 md:px-8">
            {/* BOTÓN ATRÁS EN MÓVIL */}

            {mostrarAtras && (
              <button
                type="button"
                onClick={regresar}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d9e5de] bg-white text-[#246b55] shadow-sm transition hover:bg-[#eef5f1] md:hidden"
                aria-label="Volver"
              >
                <ArrowLeft
                  size={19}
                />
              </button>
            )}

            {/* MARCA MÓVIL */}

            <div className="min-w-0 md:hidden">
              <p className="truncate text-lg font-extrabold tracking-tight text-[#173f34]">
                NutriA
              </p>

              {mostrarAtras && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e8d80]">
                  Regresar
                </p>
              )}
            </div>

            {/* ESPACIADOR DESKTOP */}

            <div className="hidden md:block" />

            {/* USUARIO */}

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className="min-w-0 text-right">
                <p className="max-w-[150px] truncate text-xs font-bold text-[#466057] sm:max-w-[220px] sm:text-sm">
                  {user.name}
                </p>

                <p className="hidden text-[10px] text-slate-400 sm:block md:hidden">
                  {roleLabel}
                </p>
              </div>

              {/* LOGOUT MÓVIL */}

              <button
                type="button"
                onClick={
                  cerrarSesion
                }
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#60776e] transition hover:bg-[#edf4f0] hover:text-[#246b55] md:hidden"
                aria-label="Cerrar sesión"
              >
                <LogOut
                  size={17}
                />
              </button>
            </div>
          </div>
        </header>

        {/* ============================================
            FONDO GLOBAL
        ============================================ */}

        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#dfece4]">
          {/* DECORACIONES */}

          <div className="pointer-events-none absolute -right-32 -top-36 h-[420px] w-[420px] rounded-full bg-[#b5d2bf]/45 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-48 -left-32 h-[480px] w-[480px] rounded-full bg-[#cbdcbd]/40 blur-3xl" />

          <div className="pointer-events-none absolute left-[42%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#eef5e9]/45 blur-3xl" />

          <div className="pointer-events-none absolute right-[18%] top-[48%] h-[280px] w-[280px] rounded-full bg-[#bfd9ca]/25 blur-3xl" />

          {/* CONTENIDO */}

          <div className="relative z-10 min-h-[calc(100vh-64px)] min-w-0 overflow-x-hidden pb-[92px] md:pb-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ============================================
          NAVEGACIÓN MÓVIL
      ============================================ */}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#c9dbd1] bg-[#fbfdfb]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(31,72,57,0.08)] backdrop-blur-xl md:hidden">
        <div
          className={`mx-auto grid max-w-lg gap-1 ${
            navigationVisible.length === 2
              ? 'grid-cols-2'
              : navigationVisible.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-4'
          }`}
        >
          {navigationVisible.map(
            ({
              icon: Icon,
              shortLabel,
              label,
              to,
            }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({
                  isActive,
                }) =>
                  `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all ${
                    isActive
                      ? 'bg-[#e1f0e7] text-[#246b55]'
                      : 'text-[#75877f] active:bg-[#eef4f1]'
                  }`
                }
              >
                {({
                  isActive,
                }) => (
                  <>
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                        isActive
                          ? 'bg-[#246b55] text-white shadow-[0_5px_14px_rgba(36,107,85,0.2)]'
                          : ''
                      }`}
                    >
                      <Icon
                        size={18}
                      />
                    </div>

                    <span className="max-w-full truncate text-[10px] font-bold sm:text-[11px]">
                      {
                        shortLabel
                      }
                    </span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}

export default DashboardLayout