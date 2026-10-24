import {
  Apple,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Ruler,
  TrendingUp,
  UserCog,
  UserRound,
  ChevronDown,
  Settings,
  UserPen,
  Users,
  Building2,
  ClipboardPlus,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/auth'
import BotonInstalarApp from '../components/pwa/BotonInstalarApp'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'

function PerfilMenu({ user, roleLabel, cerrarSesion, irAMiClinica }) {
  return (
    <details className="group relative">
      <summary aria-label="Abrir menú de perfil" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#bcd8c7] bg-[#e3f0e7] text-[#246b55] shadow-sm transition hover:bg-[#d5e8db] [&::-webkit-details-marker]:hidden">
        <UserRound size={20}/>
      </summary>
      <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[#d5e3d9] bg-white p-2 shadow-[0_16px_40px_rgba(24,73,53,.18)]">
        <div className="border-b border-[#e7eee8] px-3 py-3">
          <p className="break-words text-sm font-extrabold text-[#173f34]">{user.name}</p>
          <p className="text-xs text-[#74897d]">{roleLabel}</p>
          {user.email && <p className="mt-1 break-all text-[11px] text-[#82928a]">{user.email}</p>}
        </div>
        {user.role === 'nutritionist' && <button type="button" onClick={irAMiClinica} className="my-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#246b55] hover:bg-[#eef5f1]"><Building2 size={16}/>Mi clínica</button>}
        <div className="my-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#8b9b92]" title="Próximamente: edición de perfil">
          <UserPen size={16}/> Editar perfil · Próximamente
        </div>
        <div className="my-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#8b9b92]" title="Próximamente: configuración">
          <Settings size={16}/> Configuración · Próximamente
        </div>
        <div className="my-2 border-t border-[#e7eee8]"/>
        <button type="button" onClick={cerrarSesion} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#b94d4d] transition hover:bg-red-50">
          <LogOut size={16}/> Cerrar sesión
        </button>
      </div>
    </details>
  )
}

function DashboardLayout() {
  const { logout, user } = useAuth()
  const { pacienteTrabajo } = usePacienteTrabajo()

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
          {
            icon: TrendingUp,
            label: 'Progreso',
            shortLabel: 'Progreso',
            to: '/progreso',
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

    ...(user.role === 'patient'
      ? [
          {
            icon: UserRound,
            label: 'Mi expediente',
            shortLabel: 'Expediente',
            to: '/mi-expediente',
          },
          {
            icon: Ruler,
            label: 'Mis mediciones',
            shortLabel: 'Medidas',
            to: '/mis-mediciones',
          },
          {
            icon: Apple,
            label: 'Mi plan alimenticio',
            shortLabel: 'Mi plan',
            to: '/mi-plan',
          },
          {
            icon: TrendingUp,
            label: 'Mi progreso',
            shortLabel: 'Progreso',
            to: '/mi-progreso',
          },
        ]
      : []),
  ]

  const navegacionMovil = user.role === 'nutritionist' && pacienteTrabajo
    ? [
        { icon: ClipboardPlus, label: 'Expediente clínico', shortLabel: 'Expediente', to: `/pacientes/${pacienteTrabajo.id}/expediente` },
        { icon: Ruler, label: 'Mediciones', shortLabel: 'Medidas', to: '/mediciones' },
        { icon: Apple, label: 'Plan alimenticio', shortLabel: 'Planes', to: '/planes' },
        { icon: TrendingUp, label: 'Progreso', shortLabel: 'Progreso', to: '/progreso' },
        { icon: Users, label: 'Pacientes', shortLabel: 'Pacientes', to: '/pacientes' },
        { icon: LayoutDashboard, label: 'Resumen', shortLabel: 'Resumen', to: '/' },
      ]
    : navigationVisible

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
    '/mi-expediente',
    '/mis-mediciones',
    '/mi-plan',
    '/progreso',
    '/mi-progreso',
    '/mi-clinica',
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

      </aside>

      {/* ============================================
          CONTENIDO
      ============================================ */}

      <main className="relative min-w-0 overflow-x-hidden bg-[#dfece4]">
        {/* ============================================
            HEADER
        ============================================ */}

        <header className="sticky top-0 z-40 flex min-h-[56px] items-center border-b border-[#c8dbd0] bg-[#fbfdfb]/95 px-4 backdrop-blur-md md:hidden">
          {mostrarAtras && (
            <button type="button" onClick={regresar} aria-label="Volver" className="mr-2 grid h-9 w-9 place-items-center rounded-xl text-[#246b55] hover:bg-[#e6f0e9]">
              <ArrowLeft size={19}/>
            </button>
          )}
          <p className="text-lg font-extrabold tracking-tight text-[#173f34]">NutriA</p>
          <div className="ml-auto flex items-center gap-2">
            <BotonInstalarApp />
            <PerfilMenu user={user} roleLabel={roleLabel} cerrarSesion={cerrarSesion} irAMiClinica={() => navigate('/mi-clinica')}/>
          </div>
        </header>
        <div className="absolute right-6 top-3 z-40 hidden items-center gap-2 md:flex">
          <BotonInstalarApp />
          <PerfilMenu user={user} roleLabel={roleLabel} cerrarSesion={cerrarSesion}/>
        </div>


        {/* ============================================
            FONDO GLOBAL
        ============================================ */}

        <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[#dfece4]">
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
        <div className="mx-auto flex max-w-lg snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navegacionMovil.map(
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
                  `flex min-w-[74px] flex-1 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all ${
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
