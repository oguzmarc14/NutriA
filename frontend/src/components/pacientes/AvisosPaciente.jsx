import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight, Bell, BellRing, CalendarClock, Check, CheckCheck,
  ChevronDown, ChevronUp, ClipboardList, Clock3, FileText,
  ListFilter, ShieldCheck, UserRound, X,
} from 'lucide-react'
import { useAuth } from '../../context/auth'
import {
  GRUPOS_AVISOS, claveRevisionAviso, filtrarAvisos, grupoDeAviso, resumenDeAvisos,
} from '../../utils/avisosPacienteVista.js'
import './estilosPaciente.css'
import './avisosPaciente.css'

const ACCIONES = {
  editar:'Editar datos', expediente:'Abrir expediente', plan:'Preparar plan',
  mediciones:'Registrar medición', cita:'Programar seguimiento',
}
const ICONOS = {
  cuenta:ShieldCheck, clinica:FileText, seguimiento:CalendarClock, datos:UserRound,
}
const NOMBRES = {
  cuenta:'Cuenta', clinica:'Organización clínica',
  seguimiento:'Seguimiento', datos:'Datos generales',
}
const OPCIONES = [
  { id:'todos', label:'Todos' },
  { id:'pendientes', label:'Sin revisar' },
  { id:'vistos', label:'Revisados' },
]

export default function AvisosPaciente({ paciente, avisos = [], onCerrar, onAccion }) {
  const { user } = useAuth()
  const cerrarRef = useRef(null)
  const openerRef = useRef(null)
  const [estado,setEstado] = useState('todos')
  const [grupo,setGrupo] = useState('todos')
  const [extendidos,setExtendidos] = useState([])
  const [revisados,setRevisados] = useState([])
  const storageKey='nutria-avisos-revisados-v2:'+String(user?.id||user?._id||'cuenta')+':'+String(paciente?._id||'paciente')

  useEffect(()=>{
    setEstado('todos')
    setGrupo('todos')
    setExtendidos([])
    try {
      const valor=JSON.parse(window.localStorage.getItem(storageKey)||'[]')
      setRevisados(Array.isArray(valor)?valor.filter(x=>typeof x==='string').slice(-150):[])
    } catch { setRevisados([]) }
  },[storageKey])

  useEffect(() => {
    if (!paciente) return undefined
    openerRef.current = document.activeElement
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()

    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
      if (event.key === 'Tab') {
        const dialog = document.getElementById('nutria-aviso-dialog')
        const focusables = dialog?.querySelectorAll('button:not(:disabled),select:not(:disabled)') || []
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', handleKey)
      openerRef.current?.focus?.()
    }
  }, [paciente, onCerrar])

  const resumen=useMemo(()=>resumenDeAvisos(avisos,revisados),[avisos,revisados])
  const visibles=useMemo(()=>filtrarAvisos(avisos,revisados,estado,grupo),
    [avisos,revisados,estado,grupo])
  const gruposPresentes=GRUPOS_AVISOS.filter(item=>resumen[item.id]>0)
  const estaRevisado=aviso=>revisados.includes(claveRevisionAviso(aviso))

  function guardarRevisados(nuevos) {
    const ids=[...new Set(nuevos)].slice(-150)
    setRevisados(ids)
    try { window.localStorage.setItem(storageKey,JSON.stringify(ids)) } catch { /* PWA sin almacenamiento */ }
  }
  function cambiarRevisado(aviso) {
    const id=claveRevisionAviso(aviso)
    guardarRevisados(estaRevisado(aviso)?revisados.filter(x=>x!==id):[...revisados,id])
  }
  function cambiarExpansion(id) {
    setExtendidos(actual=>actual.includes(id)?actual.filter(x=>x!==id):[...actual,id])
  }
  function marcarTodos() {
    guardarRevisados([...revisados,...avisos.map(claveRevisionAviso)])
  }

  if (!paciente) return null

  return createPortal(
    <div className="nutria-aviso-overlay fixed inset-0 z-[120] grid place-items-end p-0 sm:place-items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}>
      <section id="nutria-aviso-dialog" role="dialog" aria-modal="true"
        aria-labelledby="nutria-aviso-titulo" aria-describedby="nutria-aviso-descripcion"
        className="nutria-aviso-dialog flex max-h-[96dvh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-t-[28px] border shadow-2xl sm:max-h-[88dvh] sm:rounded-[28px]">
        <header className="nutria-avisos-header flex shrink-0 items-start gap-3 border-b px-4 py-4 sm:px-6 sm:py-5">
          <span className="nutria-aviso-symbol grid size-11 shrink-0 place-items-center rounded-2xl">
            <BellRing size={22} aria-hidden="true"/>
          </span>
          <div className="min-w-0 flex-1">
            <p className="nutria-avisos-overline text-[10px] font-black uppercase tracking-[.14em]">Centro de atención</p>
            <h2 id="nutria-aviso-titulo" className="mt-1 break-words text-lg font-black leading-tight sm:text-xl">Avisos del paciente</h2>
            <p className="nutria-avisos-subtitle mt-1 break-words text-xs font-semibold sm:text-sm">
              {paciente.name} · {resumen.pendientes} sin revisar
            </p>
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar avisos"
            className="nutria-aviso-close grid size-10 shrink-0 place-items-center rounded-xl transition active:scale-95">
            <X size={19}/>
          </button>
        </header>

        <div className="nutria-avisos-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <p id="nutria-aviso-descripcion" className="nutria-avisos-help mb-4 text-xs leading-5 sm:text-sm">
            Organiza lo pendiente a tu ritmo. Estos avisos son informativos, no indican una urgencia clínica ni se envían al paciente automáticamente.
          </p>

          <div className="nutria-avisos-resumen mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumen de avisos">
            <div className="nutria-avisos-stat rounded-2xl border p-3">
              <div className="flex items-center gap-2"><ClipboardList size={16}/><span>Total</span></div>
              <strong className="mt-2 block text-2xl font-black tabular-nums">{resumen.total}</strong>
            </div>
            <div className="nutria-avisos-stat rounded-2xl border p-3">
              <div className="flex items-center gap-2"><Bell size={16}/><span>Sin revisar</span></div>
              <strong className="mt-2 block text-2xl font-black tabular-nums">{resumen.pendientes}</strong>
            </div>
            <div className="nutria-avisos-stat rounded-2xl border p-3">
              <div className="flex items-center gap-2"><FileText size={16}/><span>Clínica</span></div>
              <strong className="mt-2 block text-2xl font-black tabular-nums">{resumen.clinica}</strong>
            </div>
            <div className="nutria-avisos-stat rounded-2xl border p-3">
              <div className="flex items-center gap-2"><Clock3 size={16}/><span>Seguimiento</span></div>
              <strong className="mt-2 block text-2xl font-black tabular-nums">{resumen.seguimiento}</strong>
            </div>
          </div>

          <div className="nutria-avisos-filtros mb-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Estado de los avisos" className="nutria-avisos-segment flex max-w-full flex-wrap gap-1 rounded-xl p-1">
                {OPCIONES.map(opcion=><button key={opcion.id} type="button"
                  onClick={()=>setEstado(opcion.id)} aria-pressed={estado===opcion.id}
                  className="nutria-avisos-filter min-h-10 rounded-lg px-3 text-xs font-extrabold transition active:scale-[.98]">
                  {opcion.label}
                </button>)}
              </div>
              <label className="nutria-avisos-categoria flex min-w-0 items-center gap-2 text-xs font-semibold">
                <ListFilter size={17} aria-hidden="true"/>
                <span className="sr-only">Filtrar por categoría</span>
                <select value={grupo} onChange={e=>setGrupo(e.target.value)}
                  aria-label="Filtrar avisos por categoría"
                  className="nutria-avisos-select min-h-10 min-w-0 max-w-[195px] rounded-xl border px-2.5 text-xs font-bold">
                  <option value="todos">Todas las categorías</option>
                  {gruposPresentes.map(item=><option value={item.id} key={item.id}>{item.titulo} ({resumen[item.id]})</option>)}
                </select>
              </label>
            </div>
            <p className="nutria-avisos-help text-[11px]">
              {visibles.length} de {resumen.total} avisos · Marcar como revisado no elimina tareas ni modifica el expediente.
            </p>
          </div>

          <div className="space-y-3" aria-live="polite">
            {visibles.length ? visibles.map(aviso=>{
              const id=claveRevisionAviso(aviso)
              const expandido=extendidos.includes(id)
              const revisado=estaRevisado(aviso)
              const tipo=grupoDeAviso(aviso)
              const Icon=ICONOS[tipo]||ClipboardList
              return <article key={id} data-group={tipo}
                className={'nutria-aviso-item nutria-avisos-card min-w-0 rounded-2xl border p-3.5 transition sm:p-4 '+(revisado?'nutria-avisos-card--revisado':'')}>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="nutria-avisos-card-icon grid size-10 shrink-0 place-items-center rounded-xl">
                    <Icon size={20} aria-hidden="true"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="nutria-avisos-group text-[10px] font-extrabold uppercase tracking-wider">{NOMBRES[tipo]}</p>
                      {revisado && <span className="nutria-avisos-visto flex items-center gap-1 text-[10px] font-bold"><Check size={13}/>Revisado</span>}
                    </div>
                    <h3 className="mt-1 break-words text-sm font-black leading-5 sm:text-base">{aviso.titulo}</h3>
                    <p className={'nutria-avisos-detail mt-1 break-words text-xs leading-5 sm:text-sm '+(expandido?'':'nutria-avisos-detail--clamp')}>
                      {aviso.detalle}
                    </p>
                    {expandido && <p className="nutria-avisos-help mt-2 text-xs leading-5">
                      {aviso.accion ? 'Usa la acción principal para continuar con el seguimiento.' : 'Puedes revisar este aviso desde la tarjeta del paciente.'}
                    </p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {aviso.accion && <button type="button" onClick={()=>onAccion(aviso)}
                        className="nutria-aviso-action inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition active:scale-[.98]">
                        {ACCIONES[aviso.accion]||'Revisar'}
                        <ArrowUpRight size={16} aria-hidden="true"/>
                      </button>}
                      <button type="button" aria-expanded={expandido}
                        aria-label={(expandido?'Ocultar':'Ver')+' detalles de '+aviso.titulo}
                        onClick={()=>cambiarExpansion(id)}
                        className="nutria-avisos-ghost inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold transition active:scale-[.98]">
                        {expandido?'Menos detalles':'Ver detalles'}
                        {expandido?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
                      </button>
                      <button type="button" aria-pressed={revisado}
                        onClick={()=>cambiarRevisado(aviso)}
                        className="nutria-avisos-ghost ml-auto inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold transition active:scale-[.98]">
                        <Check size={15} aria-hidden="true"/>
                        {revisado?'No revisado':'Marcar visto'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            }) : <div className="nutria-avisos-empty rounded-2xl border p-6 text-center">
              <span className="nutria-aviso-symbol mx-auto mb-3 grid size-12 place-items-center rounded-2xl"><CheckCheck size={22}/></span>
              <p className="text-sm font-extrabold">{resumen.total===0?'No hay avisos por revisar':'No hay avisos con estos filtros'}</p>
              <p className="nutria-avisos-help mt-1 text-xs">Puedes cambiar los filtros para consultar el resto.</p>
              {resumen.total>0 && <button type="button" onClick={()=>{setGrupo('todos');setEstado('todos')}}
                className="nutria-avisos-ghost mt-3 min-h-10 rounded-xl px-4 text-xs font-bold">Mostrar todos</button>}
            </div>}
          </div>
        </div>
        <footer className="nutria-avisos-footer flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-extrabold">{resumen.pendientes} sin revisar</p>
            <p className="nutria-avisos-help text-[10px]">Solo en este dispositivo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={resumen.pendientes===0} onClick={marcarTodos}
              className="nutria-avisos-ghost inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold disabled:opacity-40">
              <CheckCheck size={15} aria-hidden="true"/>Marcar vistos
            </button>
            <button type="button" onClick={onCerrar}
              className="nutria-aviso-action min-h-10 rounded-xl px-5 text-sm font-bold">Cerrar</button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
