import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, RefreshCw, X } from 'lucide-react'
import './menuMovil.css'
import NavigationGroups from './NavigationGroups'
import { rutasRapidas } from '../../utils/navigationMovil'

export default function MenuMovil({ sections, rol, pacienteTrabajo, abierto, setAbierto }) {
  const ubicacion = useLocation()
  const botonMas = useRef(null)
  const botonCerrar = useRef(null)
  const elementoAnterior = useRef(null)
  const enlaces = sections.flatMap(section => section.links)
  const accesos = rutasRapidas(rol, pacienteTrabajo)
    .map(ruta => enlaces.find(enlace => enlace.to === ruta)).filter(Boolean)
  const visibles = new Set(accesos.map(item => item.to))
  const destino = ubicacion.pathname === '/community' && new URLSearchParams(ubicacion.search).get('tab') === 'dietas'
    ? '/community?tab=dietas' : ubicacion.pathname
  const activoEnMas = !visibles.has(destino) && enlaces.some(item => item.to === destino)

  useEffect(() => { setAbierto(false) }, [ubicacion.pathname])
  useEffect(() => {
    if (!abierto) return undefined
    const original = document.body.style.overflow
    elementoAnterior.current = document.activeElement
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
      if (elementoAnterior.current?.isConnected) elementoAnterior.current.focus()
    }
  }, [abierto, setAbierto])

  async function actualizarAplicacion() {
    // Permite refrescar voluntariamente la PWA sin borrar sesión ni datos.
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        await registration?.update()
      }
    } catch (error) {
      console.warn('No se pudo comprobar el service worker; recargando aplicación.', error)
    }
    window.location.reload()
  }

  return <>
    <nav aria-label="Navegación principal móvil"
      className="nutria-menu-barra fixed inset-x-0 bottom-0 z-50 border-t px-1.5 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
      <div className={'mx-auto grid max-w-lg gap-1 '+(accesos.length===4?'grid-cols-5':accesos.length===3?'grid-cols-4':'grid-cols-3')}>
        {accesos.map(({icon:Icon,to,shortLabel,label})=>(
          <NavLink key={to} to={to} end
            aria-label={label}
            className={({isActive})=>'nutria-menu-acceso flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 '+(isActive?'nutria-menu-acceso--activo':'')}>
            <Icon size={20} aria-hidden="true"/>
            <span className="w-full text-center text-[10px] font-extrabold leading-4">{shortLabel}</span>
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
              <p className="mt-1 text-xs opacity-75">
                {rol === 'nutritionist' ? 'Nutriólogo' : rol === 'admin' ? 'Administrador' : 'Paciente'}
                {' · '}{enlaces.length} apartados disponibles
              </p>
            </div>
            <button ref={botonCerrar} type="button" onClick={()=>{setAbierto(false);botonMas.current?.focus()}}
              className="nutria-menu-cerrar grid h-10 w-10 shrink-0 place-items-center rounded-xl border" aria-label="Cerrar menú">
              <X size={20}/>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(24px,env(safe-area-inset-bottom))]">
            <NavigationGroups sections={sections} compact onNavigate={() => setAbierto(false)} />
            <button type="button" onClick={actualizarAplicacion}
              className="nutria-menu-opcion mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold">
              <RefreshCw size={17} aria-hidden="true"/> Buscar actualización y recargar NutriA
            </button>
            <p className="mt-3 px-2 text-center text-[11px] opacity-65">
              Versión de NutriA: {__NUTRIA_BUILD_ID__} · Los apartados dependen del rol de tu cuenta.
            </p>
          </div>
        </section>
      </div>,document.body
    )}
  </>
}
