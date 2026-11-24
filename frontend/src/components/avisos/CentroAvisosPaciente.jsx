import { useEffect, useMemo, useState } from 'react'
import { Apple, Bell, CalendarCheck2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import client from '../../api/client'
import useMisCitas from '../../hooks/useMisCitas'
import useModalAccesible from '../../hooks/useModalAccesible'
import { useAuth } from '../../context/auth'
import './centroAvisosPaciente.css'

export default function CentroAvisosPaciente({triggerRef}){
  const {user}=useAuth()
  const {datos,actualizar,error}=useMisCitas()
  const [abierto,setAbierto]=useState(false)
  const [bandeja, setBandeja] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [errorBandeja, setErrorBandeja] = useState('')
  const [guardando, setGuardando] = useState(false)
  const {modalRef,volverRef}=useModalAccesible({abierto,onVolver:()=>setAbierto(false)})
  const key='nutria-avisos-paciente-v1-'+(user?._id || user?.id || 'sesion')
  const [leidos,setLeidos]=useState([])
  const avisos=useMemo(()=>[...bandeja, ...(datos?.avisos || [])], [bandeja, datos])
  const categoria = aviso => aviso.route === '/mi-plan' ? 'Dietas' : 'Citas'
  const visibles = avisos.filter(aviso => filtro === 'Todos' || categoria(aviso) === filtro)
  useEffect(() => {
    const controller = new AbortController()
    client.get('/push/notices', { signal: controller.signal })
      .then(({ data }) => { setBandeja(data.notices || []); setErrorBandeja('') })
      .catch(() => { if (!controller.signal.aborted) setErrorBandeja('No se pudo cargar la bandeja de avisos.') })
    return () => controller.abort()
  }, [key, abierto])
  useEffect(()=>{
    try{setLeidos(JSON.parse(window.localStorage.getItem(key)||'[]'))}
    catch{setLeidos([])}
  },[key])
  const pendientes=avisos.filter(a=>!a.seen && !leidos.includes(a.id))
  const mostrar=(event)=>{
    event.stopPropagation()
    setFiltro('Todos')
    setAbierto(true)
    actualizar()
  }
  async function marcarLeidos() {
    if (guardando) return
    setGuardando(true)
    try {
      const remotos = bandeja.filter(aviso => !aviso.seen).map(aviso => aviso.id)
      if (remotos.length) await client.post('/push/notices/seen', { ids: remotos })
      setBandeja(actual => actual.map(aviso => remotos.includes(aviso.id) ? { ...aviso, seen: true } : aviso))
      const ids = [...new Set([...leidos, ...(datos?.avisos || []).map(aviso => aviso.id)])].slice(-100)
      try { window.localStorage.setItem(key, JSON.stringify(ids)) } catch {}
      setLeidos(ids)
      setErrorBandeja('')
    } catch {
      setErrorBandeja('No se pudieron marcar los avisos como vistos.')
    } finally { setGuardando(false) }
  }
  return <div className="nutria-centro-paciente relative">
    <button ref={triggerRef} type="button" onClick={mostrar} aria-label={'Notificaciones del paciente'+(pendientes.length?' · '+pendientes.length+' pendientes':'')}
      aria-haspopup="dialog" aria-expanded={abierto}
      className="nutria-centro-paciente-bell relative grid size-11 shrink-0 place-items-center rounded-xl border">
      <Bell size={22} aria-hidden="true"/>
      {pendientes.length>0 && <span aria-hidden="true" className="nutria-centro-paciente-count absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black">
        {pendientes.length>9?'9+':pendientes.length}
      </span>}
    </button>
    {abierto && createPortal(<div ref={modalRef} role="dialog" aria-modal="true" aria-label="Mis notificaciones"
      onClick={event => { if (event.target === event.currentTarget) setAbierto(false) }}
      className="nutria-centro-paciente-overlay fixed inset-0 z-[220] flex items-end justify-center px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <section className="nutria-centro-paciente-panel flex max-h-[min(80dvh,42rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-current/10 px-4 py-2.5">
          <div><h2 className="text-xl font-black">Notificaciones</h2><p className="mt-1 text-sm" role="status">{pendientes.length} {pendientes.length === 1 ? 'aviso sin leer' : 'avisos sin leer'}</p></div>
          <button ref={volverRef} type="button" aria-label="Cerrar avisos" onClick={()=>setAbierto(false)}
            className="nutria-centro-paciente-close grid size-11 shrink-0 place-items-center rounded-xl border"><X size={18}/></button>
        </header>
        {pendientes.length > 0 && <div className="px-4 pt-3">
          <button type="button" onClick={marcarLeidos} disabled={guardando}
            className="nutria-centro-paciente-link min-h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-60">Marcar como leídos</button>
        </div>}
        <div role="group" aria-label="Filtrar avisos" className="flex shrink-0 flex-wrap gap-2 px-4 pt-3">
          {['Todos','Dietas','Citas'].map(opcion => <button type="button" key={opcion} aria-pressed={filtro === opcion}
            onClick={() => setFiltro(opcion)} className={'min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm font-bold ' +
              (filtro === opcion ? 'nutria-centro-paciente-link' : 'border-current/20')}>{opcion}</button>)}
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-3">
          {visibles.length===0 ? <p className="rounded-xl border border-current/15 p-4 text-sm opacity-75">No hay avisos en esta sección.</p> :
            visibles.map(aviso=><div key={aviso.id} className="nutria-centro-paciente-item rounded-xl border p-3">
              <p className="mb-1 text-xs font-semibold">{categoria(aviso)}{!aviso.seen && !leidos.includes(aviso.id) ? ' · Sin leer' : ''}</p>
              <p className="flex items-center gap-2 text-sm font-extrabold">{aviso.route === '/mi-plan' ? <Apple size={17} aria-hidden="true"/> : <CalendarCheck2 size={17} aria-hidden="true"/>}{aviso.titulo}</p>
              <p className="mt-2 text-xs leading-relaxed">{aviso.detalle}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link to={aviso.route === '/mi-plan' ? '/mi-plan' : '/mis-citas'} onClick={() => setAbierto(false)}
                  className="font-bold underline underline-offset-4">{aviso.route === '/mi-plan' ? 'Ver mi plan' : 'Ver mis citas'}</Link>
              </div>
            </div>)}
          {(errorBandeja || error) && <p role="alert" className="text-xs opacity-80">{errorBandeja || error}</p>}
        </div>
      </section>
    </div>,document.body)}
  </div>
}
