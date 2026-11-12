import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarCheck2, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import useMisCitas from '../../hooks/useMisCitas'
import { useAuth } from '../../context/auth'
import './centroAvisosPaciente.css'

// Avisos sólo dentro de NutriA: no son push ni mensajes enviados al paciente.
export default function CentroAvisosPaciente({modo='movil'}){
  const {user}=useAuth()
  const {datos,actualizar,error}=useMisCitas()
  const [abierto,setAbierto]=useState(false)
  const key='nutria-avisos-paciente-v1-'+(user?._id || user?.id || 'sesion')
  const [leidos,setLeidos]=useState([])
  const avisos=useMemo(()=>datos?.avisos || [],[datos])
  useEffect(()=>{
    try{setLeidos(JSON.parse(window.localStorage.getItem(key)||'[]'))}
    catch{setLeidos([])}
  },[key])
  useEffect(()=>{
    if(!abierto)return undefined
    const antes=document.body.style.overflow
    document.body.style.overflow='hidden'
    const cerrar=e=>{if(e.key==='Escape')setAbierto(false)}
    document.addEventListener('keydown',cerrar)
    return ()=>{document.body.style.overflow=antes;document.removeEventListener('keydown',cerrar)}
  },[abierto])
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
      className="nutria-centro-paciente-bell relative grid size-11 place-items-center rounded-2xl border sm:size-12">
      <Bell size={22} aria-hidden="true"/>
      {pendientes.length>0 && <span aria-hidden="true" className="nutria-centro-paciente-count absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black">
        {pendientes.length>9?'9+':pendientes.length}
      </span>}
    </button>
    {abierto && createPortal(<div role="dialog" aria-modal="true" aria-label="Avisos de mis citas"
      className={'nutria-centro-paciente-overlay fixed inset-0 z-[220] flex items-end justify-center p-2 sm:items-center '+(modo==='escritorio'?'md:items-start md:justify-end md:p-5':'')}>
      <section className="nutria-centro-paciente-panel w-full max-w-lg rounded-[24px] border p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black">Mis notificaciones</h2>
          <button type="button" aria-label="Cerrar avisos" onClick={()=>setAbierto(false)}
            className="nutria-centro-paciente-close grid size-10 place-items-center rounded-xl border"><X size={18}/></button>
        </div>
        <p className="mt-1 text-xs opacity-75">Confirmaciones y recordatorios de seguimiento de tus consultas.</p>
        <div className="mt-4 max-h-[55dvh] space-y-2 overflow-y-auto">
          {avisos.length===0 ? <p className="rounded-xl border border-current/15 p-4 text-sm opacity-75">No tienes avisos nuevos de citas.</p> :
            avisos.map(aviso=><div key={aviso.id} className="nutria-centro-paciente-item rounded-xl border p-3">
              <p className="flex items-center gap-2 text-sm font-extrabold"><CalendarCheck2 size={17}/>{aviso.titulo}</p>
              <p className="mt-2 text-xs leading-relaxed">{aviso.detalle}</p>
            </div>)}
          {error && <p role="alert" className="text-xs opacity-80">{error}</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={marcarLeidos}
            className="nutria-centro-paciente-close min-h-11 rounded-xl border px-3 text-xs font-bold">Marcar como vistos</button>
          <Link to="/mis-citas" onClick={()=>{marcarLeidos();setAbierto(false)}}
            className="nutria-centro-paciente-link inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-extrabold">
            Ver mis citas <ChevronRight size={16}/>
          </Link>
        </div>
      </section>
    </div>,document.body)}
  </div>
}
