import { useEffect, useState } from 'react'
import client from '../api/client'
import HorarioLaboral from '../components/HorarioLaboral'
import {
  Apple,
  FileText,
  CalendarDays,
  CalendarPlus,
  BookOpen,
  ShieldCheck,
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
  Leaf,
  ClipboardPlus,
  CircleCheck,
  X,
  ArrowLeftRight,
  UserRoundCheck,
  Calculator,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/auth'
import ThemeSelector from '../components/theme/ThemeSelector'
import BotonInstalarApp from '../components/pwa/BotonInstalarApp'
import CentroAvisosNutriologo from '../components/avisos/CentroAvisosNutriologo'
import CentroAvisosPaciente from '../components/avisos/CentroAvisosPaciente'
import MenuMovil from '../components/navigation/MenuMovil'
import ActualizacionPWA from '../components/pwa/ActualizacionPWA'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'

function PerfilMenu({ user, roleLabel, cerrarSesion, irAMiClinica, irAEditarPerfil }) {
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
        {user.role === 'nutritionist' && <button type="button" onClick={irAEditarPerfil} className="my-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#246b55] hover:bg-[#eef5f1]"><UserPen size={16}/>Editar perfil y horario</button>}
        <div className="my-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#8b9b92]" title="Próximamente: configuración">
          <Settings size={16}/> Configuración · Próximamente
        </div>
        <ThemeSelector />
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
  const { pacienteTrabajo, cerrarTrabajo } = usePacienteTrabajo()

  const location = useLocation()
  const navigate = useNavigate()
  const enEditorPlanes = user.role === 'nutritionist' && location.pathname === '/planes'
  const [sidebarPlanesVisible, setSidebarPlanesVisible] = useState(false)
  const [configurarHorario, setConfigurarHorario] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  useEffect(() => {
    if (user.role !== 'nutritionist') return
    let active = true
    client.get('/horario').then(({data}) => {if(active && !data.horario?.configurado)setConfigurarHorario(true)}).catch(()=>{})
    return ()=>{active=false}
  }, [user.role, user._id])

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

          ...(pacienteTrabajo ? [{
            icon: ClipboardPlus,
            label: 'Expediente clínico',
            shortLabel: 'Expediente',
            to: `/pacientes/${pacienteTrabajo.id}/expediente`,
          }] : []),

          {
            icon: Ruler,
            label: 'Mediciones',
            shortLabel: 'Medidas',
            to: '/mediciones',
          },

          {
            icon: Calculator,
            label: 'Cálculo nutricional',
            shortLabel: 'Cálculo',
            to: '/calculo-nutricional',
          },

          {
            icon: CalendarDays,
            label: 'Ver citas',
            shortLabel: 'Ver citas',
            to: '/citas',
          },
          {
            icon: CalendarPlus,
            label: 'Crear cita',
            shortLabel: 'Crear cita',
            to: '/citas/nueva',
          },
          {
            icon: Apple,
            label: 'Crear dieta',
            shortLabel: 'Crear',
            to: '/planes',
          },
          {
            icon: FileText,
            label: 'Consultar dietas',
            shortLabel: 'Dietas',
            to: '/dietas',
          },
          {
            icon: BookOpen,
            label: 'NutriA Community',
            shortLabel: 'Recetas',
            to: '/community',
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
            icon: ShieldCheck,
            label: 'Moderar recetas',
            shortLabel: 'Moderación',
            to: '/community/moderacion',
          },
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
            icon: CalendarDays,
            label: 'Mis citas',
            shortLabel: 'Mis citas',
            to: '/mis-citas',
          },
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
    '/dietas',
    '/citas',
    '/citas/nueva',
    '/community',
    '/community/moderacion',
    '/calculo-nutricional',
    '/usuarios',
    '/mi-expediente',
    '/mis-citas',
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
    <div className={`min-h-screen bg-[#dfece4] md:grid ${enEditorPlanes && !sidebarPlanesVisible ? "md:grid-cols-[0px_minmax(0,1fr)]" : "md:grid-cols-[260px_minmax(0,1fr)]"}`}>
      {/* ============================================
          SIDEBAR DESKTOP
      ============================================ */}

      <aside className={`hidden min-h-screen overflow-hidden border-r border-[#c8dbd0] bg-[#eaf0e9] p-5 shadow-[6px_0_30px_rgba(36,107,85,0.05)] md:flex md:flex-col ${enEditorPlanes && !sidebarPlanesVisible ? "md:invisible md:p-0 md:border-0" : ""}`}>
        {/* MARCA */}

        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(36,107,85,0.14)]">
            <img src="/imagenes/logo-nutria.png" alt="Logotipo de NutriA" className="h-full w-full object-contain" />
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
              marca,
            }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/' || to === '/pacientes' || to === '/citas'}
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

      <main className="relative min-w-0 bg-[#dfece4]">
        {/* ============================================
            HEADER
        ============================================ */}

        <header className="sticky top-0 z-40 flex min-h-[56px] items-center border-b border-[#c8dbd0] bg-[#fbfdfb]/95 px-3 md:backdrop-blur-md md:hidden">
          <button type="button" onClick={() => setMenuMovilAbierto(true)}
            aria-label="Abrir todos los apartados" aria-haspopup="dialog" aria-expanded={menuMovilAbierto}
            className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#246b55] hover:bg-[#e6f0e9]">
            <Menu size={20} aria-hidden="true"/>
          </button>
          {mostrarAtras && (
            <button type="button" onClick={regresar} aria-label="Volver" className="mr-2 grid h-9 w-9 place-items-center rounded-xl text-[#246b55] hover:bg-[#e6f0e9]">
              <ArrowLeft size={19}/>
            </button>
          )}
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-[#173f34]">NutriA</p>
            {user.role === 'nutritionist' && <p className="max-w-[48vw] truncate text-[10px] font-semibold text-[#246b55]">{pacienteTrabajo ? `● ${pacienteTrabajo.name}` : 'Sin paciente activo'}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {user.role === 'nutritionist' && <CentroAvisosNutriologo modo="movil" />}
             {user.role === 'patient' && <CentroAvisosPaciente modo="movil" />}
            <BotonInstalarApp />
            <PerfilMenu user={user} roleLabel={roleLabel} cerrarSesion={cerrarSesion} irAMiClinica={() => navigate('/mi-clinica')} irAEditarPerfil={() => navigate('/editar-perfil')}/>
          </div>
        </header>
        <div className="sticky top-0 z-40 hidden h-[52px] items-center justify-between gap-3 border-b border-[#c8dbd0] bg-[#eaf0e9]/95 px-5 text-[#173f34] backdrop-blur-md md:flex">
          {enEditorPlanes && <button type="button" onClick={() => setSidebarPlanesVisible(v => !v)}
            title={sidebarPlanesVisible ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            aria-label={sidebarPlanesVisible ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#246b55] hover:bg-[#d8ebe0]">
            {sidebarPlanesVisible ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
          </button>}
          {user.role === 'nutritionist' ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${pacienteTrabajo ? 'bg-[#e1f0e7] text-[#246b55]' : 'bg-[#edf2ed] text-[#82968b]'}`}>
                <UserRoundCheck size={16} />
              </span>
              {pacienteTrabajo ? (
                <>
                  <span className="max-w-[min(42vw,480px)] truncate text-xs font-bold text-[#173f34]">{pacienteTrabajo.name}</span>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#62a881]" title="Paciente activo" />
                  <button type="button" onClick={() => navigate('/pacientes')} aria-label="Cambiar paciente" title="Cambiar paciente" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#4d816f] transition hover:bg-[#e1f0e7] hover:text-[#173f34]"><ArrowLeftRight size={16}/></button>
                  <button type="button" onClick={() => { if (window.confirm('¿Dejar de trabajar con este paciente?')) cerrarTrabajo() }} aria-label="Dejar de trabajar con el paciente" title="Finalizar trabajo con paciente" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#789286] transition hover:bg-red-50 hover:text-red-600"><X size={16}/></button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-[#648073]">Sin paciente activo</span>
                  <button type="button" onClick={() => navigate('/pacientes')} aria-label="Seleccionar paciente" title="Seleccionar paciente" className="grid h-7 w-7 place-items-center rounded-lg text-[#246b55] hover:bg-[#e1f0e7]"><ArrowLeftRight size={16}/></button>
                </>
              )}
            </div>
          ) : <span className="text-xs font-semibold text-[#648073]">NutriA</span>}
          <div className="flex shrink-0 items-center gap-2">
            {user.role === 'nutritionist' && <CentroAvisosNutriologo modo="escritorio" />}
             {user.role === 'patient' && <CentroAvisosPaciente modo="escritorio" />}
            <BotonInstalarApp />
            <PerfilMenu user={user} roleLabel={roleLabel} cerrarSesion={cerrarSesion} irAMiClinica={() => navigate('/mi-clinica')} irAEditarPerfil={() => navigate('/editar-perfil')}/>
          </div>
        </div>


        {/* ============================================
            FONDO GLOBAL
        ============================================ */}

        <div className="relative min-h-[calc(100vh-56px)] bg-[#dfece4]">
          {/* DECORACIONES */}

          <div className="pointer-events-none hidden md:block absolute -right-32 -top-36 h-[420px] w-[420px] rounded-full bg-[#b5d2bf]/45 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-48 -left-32 h-[480px] w-[480px] rounded-full bg-[#cbdcbd]/40 blur-3xl" />

          <div className="pointer-events-none absolute left-[42%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#eef5e9]/45 blur-3xl" />

          <div className="pointer-events-none absolute right-[18%] top-[48%] h-[280px] w-[280px] rounded-full bg-[#bfd9ca]/25 blur-3xl" />

          {/* CONTENIDO */}

          <div className="relative z-10 min-h-[calc(100vh-64px)] min-w-0 pb-[92px] md:pb-0">
            <Outlet />
          </div>
        </div>
      </main>

      {configurarHorario && <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#102d26]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Configuración inicial del horario"><div className="my-auto w-full max-w-2xl"><HorarioLaboral primerIngreso onSaved={()=>setConfigurarHorario(false)}/></div></div>}
      <MenuMovil enlaces={navigationVisible} rol={user.role} pacienteTrabajo={pacienteTrabajo}
        abierto={menuMovilAbierto} setAbierto={setMenuMovilAbierto} />
      <ActualizacionPWA />
    </div>
  )
}

export default DashboardLayout
