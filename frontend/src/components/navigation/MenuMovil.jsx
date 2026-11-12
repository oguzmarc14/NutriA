import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Building2, CalendarClock, Menu, UserPen, X } from 'lucide-react'
import './menuMovil.css'

// Los accesos rápidos nunca sustituyen el menú completo.
export function rutasRapidas(rol, pacienteTrabajo) {
  if (rol === 'nutritionist') return pacienteTrabajo
    ? ['/pacientes', '/pacientes/' + pacienteTrabajo.id + '/expediente', '/citas', '/citas/nueva']
    : ['/', '/pacientes', '/citas', '/citas/nueva']
  if (rol === 'patient') return ['/', '/mi-expediente', '/mi-plan', '/mi-progreso']
  return ['/', '/usuarios', '/community/moderacion']
}

export default function MenuMovil({ enlaces, rol, pacienteTrabajo }) {
  const [abierto, setAbierto] = useState(false)
  const ubicacion = useLocation()
  const botonMas = useRef(null)
  const botonCerrar = useRef(null)
  const accesos = rutasRapidas(rol, pacienteTrabajo)
    .map(ruta => enlaces.find(enlace => enlace.to === ruta)).filter(Boolean)
  const visibles = new Set(accesos.map(item => item.to))
  const activoEnMas = !visibles.has(ubicacion.pathname) &&
    (enlaces.some(item => item.to === ubicacion.pathname) ||
     (rol === 'nutritionist' && ['/mi-clinica','/editar-perfil'].includes(ubicacion.pathname)))

  useEffect(() => { setAbierto(false) }, [ubicacion.pathname])
  useEffect(() => {
    if (!abierto) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    botonCerrar.current?.focus()
    function teclado(e) {
      if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); return }
      if (e.key !== 'Tab') return
      const panel = document.getElementById('nutria-menu-movil-panel')
      const focusables = [...(panel?.querySelectorAll('button:not(:disabled),a[href]') || [])]
      if (!focusables.length) return
      if (e.shiftKey && document.activeElement === focusables[0]) {
        e.preventDefault(); focusables[focusables.length-1].focus()
      } else if (!e.shiftKey && document.activeElement === focusables[focusables.length-1]) {
        e.preventDefault(); focusables[0].focus()
      }
    }
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('keydown', teclado)
      document.body.style.overflow = original
    }
  }, [abierto])

  const extras = rol === 'nutritionist' ? [
    { to:'/citas', state:{abrirConfiguracion:true}, label:'Configurar agenda y horarios', icon:CalendarClock },
    { to:'/mi-clinica', label:'Mi clínica', icon:Building2 },
    { to:'/editar-perfil', label:'Editar perfil y horario laboral', icon:UserPen },
  ] : []

  return <>
    <nav aria-label="Navegación principal móvil"
      className="nutria-menu-barra fixed inset-x-0 bottom-0 z-50 border-t px-1.5 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
      <div className={'mx-auto grid max-w-lg gap-1 '+(accesos.length===4?'grid-cols-5':accesos.length===3?'grid-cols-4':'grid-cols-3')}>
        {accesos.map(({icon:Icon,to,shortLabel,label})=>(
          <NavLink key={to} to={to} end
            aria-label={label}
            className={({isActive})=>'nutria-menu-acceso flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 '+(isActive?'nutria-menu-acceso--activo':'')}>
            <Icon size={20} aria-hidden="true"/>
            <span className="w-full truncate text-center text-[10px] font-extrabold leading-4">{shortLabel}</span>
          </NavLink>
        ))}
        <button ref={botonMas} type="button" onClick={()=>setAbierto(true)}
          aria-label="Más apartados" aria-haspopup="dialog" aria-expanded={abierto}
          className={'nutria-menu-acceso flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 '+(activoEnMas?'nutria-menu-acceso--activo':'')}>
          <Menu size={20} aria-hidden="true"/>
          <span className="text-[10px] font-extrabold leading-4">Más</span>
        </button>
      </div>
    </nav>
    {abierto && createPortal(
      <div className="nutria-menu-fondo fixed inset-0 z-[220] flex items-end justify-center md:hidden"
        onMouseDown={e=>{if(e.target===e.currentTarget)setAbierto(false)}}>
        <section id="nutria-menu-movil-panel" role="dialog" aria-modal="true"
          aria-labelledby="nutria-menu-movil-titulo"
          className="nutria-menu-panel flex max-h-[min(88dvh,780px)] w-full max-w-lg flex-col rounded-t-[28px] border-x border-t shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-current/10 px-5 py-4">
            <div>
              <h2 id="nutria-menu-movil-titulo" className="text-xl font-black">Todos los apartados</h2>
              <p className="mt-1 text-xs opacity-75">Accede a todas las funciones de NutriA.</p>
            </div>
            <button ref={botonCerrar} type="button" onClick={()=>{setAbierto(false);botonMas.current?.focus()}}
              className="nutria-menu-cerrar grid h-10 w-10 shrink-0 place-items-center rounded-xl border" aria-label="Cerrar menú">
              <X size={20}/>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(24px,env(safe-area-inset-bottom))]">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest opacity-70">Navegación</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {enlaces.map(({icon:Icon,to,label})=>(
                <NavLink key={to} to={to} end onClick={()=>setAbierto(false)}
                  className={({isActive})=>'nutria-menu-opcion flex min-h-20 flex-col items-start justify-center gap-2 rounded-2xl border p-3 text-left text-xs font-extrabold leading-4 '+(isActive?'nutria-menu-opcion--activa':'')}>
                  <Icon size={21} aria-hidden="true"/>
                  <span className="break-words">{label}</span>
                </NavLink>
              ))}
            </div>
            {extras.length>0 && <>
              <p className="mb-3 mt-6 px-2 text-xs font-bold uppercase tracking-widest opacity-70">Consultorio y configuración</p>
              <div className="grid gap-2">
                {extras.map(({to,state,label,icon:Icon})=>(
                  <Link key={label} to={to} state={state} onClick={()=>setAbierto(false)}
                    className="nutria-menu-opcion flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold">
                    <Icon size={18} aria-hidden="true"/>{label}
                  </Link>
                ))}
              </div>
            </>}
          </div>
        </section>
      </div>,document.body
    )}
  </>
}
