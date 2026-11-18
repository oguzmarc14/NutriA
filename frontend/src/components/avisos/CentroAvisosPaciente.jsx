import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarCheck2, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useMisCitas from '../../hooks/useMisCitas'
import useModalAccesible from '../../hooks/useModalAccesible'
import { useAuth } from '../../context/auth'
import './centroAvisosPaciente.css'

// Avisos sólo dentro de NutriA: no son push ni mensajes enviados al paciente.
export default function CentroAvisosPaciente({modo='movil'}){
  const {user}=useAuth()
  const {datos,actualizar,error}=useMisCitas()
  const [abierto,setAbierto]=useState(false)
  const {modalRef,volverRef}=useModalAccesible({abierto,onVolver:()=>setAbierto(false)})
  const key='nutria-avisos-paciente-v1-'+(user?._id || user?.id || 'sesion')
  const [leidos,setLeidos]=useState([])
  const avisos=useMemo(()=>datos?.avisos || [],[datos])
  useEffect(()=>{
    try{setLeidos(JSON.parse(window.localStorage.getItem(key)||'[]'))}
    catch{setLeidos([])}
  },[key])
  const pendientes=avisos.filter(a=>!leidos.includes(a.id))
  const mostrar=(event)=>{
    event.stopPropagation()
    setAbierto(true)
    actualizar()
  }
  const marcarLeidos=()=>{
    const ids=[...new Set([...leidos,...avisos.map(a=>a.id)])].slice(-100)
    try{window.localStorage.setItem(key,JSON.stringify(ids))}catch{}
    setLeidos(ids)
  }
  return <div className="nutria-centro-paciente relative">
    <button type="button" onClick={mostrar} aria-label={'Notificaciones del paciente'+(pendientes.length?' · '+pendientes.length+' pendientes':'')}
      aria-haspopup="dialog" aria-expanded={abierto}
      className="nutria-centro-paciente-bell relative grid size-11 shrink-0 place-items-center rounded-xl border">
      <Bell size={22} aria-hidden="true"/>
      {pendientes.length>0 && <span aria-hidden="true" className="nutria-centro-paciente-count absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black">
        {pendientes.length>9?'9+':pendientes.length}
      </span>}
    </button>
    {abierto && createPortal(<div ref={modalRef} role="dialog" aria-modal="true" aria-label="Avisos de mis citas"
      onClick={event => { if (event.target === event.currentTarget) setAbierto(false) }}
      className={'nutria-centro-paciente-overlay fixed inset-0 z-[220] flex items-end justify-center px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:items-center sm:p-4 '+(modo==='escritorio'?'md:items-start md:justify-end md:p-5':'')}>
      <section className="nutria-centro-paciente-panel flex max-h-[min(80dvh,42rem)] w-full max-w-md flex-col overflow-hidden rounded-[24px] border shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-current/10 px-4 py-2.5">
          <h2 className="text-base font-black">Mis notificaciones</h2>
          <button ref={volverRef} type="button" aria-label="Cerrar avisos" onClick={()=>setAbierto(false)}
            className="nutria-centro-paciente-close grid size-11 shrink-0 place-items-center rounded-xl border"><X size={18}/></button>
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-3">
          {avisos.length===0 ? <p className="rounded-xl border border-current/15 p-4 text-sm opacity-75">No tienes avisos nuevos de citas.</p> :
            avisos.map(aviso=><div key={aviso.id} className="nutria-centro-paciente-item rounded-xl border p-3">
              <p className="flex items-center gap-2 text-sm font-extrabold"><CalendarCheck2 size={17} className="shrink-0" aria-hidden="true"/>{aviso.titulo}</p>
              <p className="mt-2 text-xs leading-relaxed">{aviso.detalle}</p>
            </div>)}
          {error && <p role="alert" className="text-xs opacity-80">{error}</p>}
        </div>
        <footer className="grid shrink-0 gap-1.5 border-t border-current/10 px-4 py-3">
          <Link to="/mis-citas" onClick={()=>{marcarLeidos();setAbierto(false)}}
            className="nutria-centro-paciente-link flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold">
            Ver mis citas <ChevronRight size={16} aria-hidden="true"/>
          </Link>
          {pendientes.length > 0 && <button type="button" onClick={marcarLeidos}
            className="min-h-11 rounded-xl px-2 text-sm font-semibold underline underline-offset-4">
            Marcar como vistos
          </button>}
        </footer>
      </section>
    </div>,document.body)}
  </div>
}
