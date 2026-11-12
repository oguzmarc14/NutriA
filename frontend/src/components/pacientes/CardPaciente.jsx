import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight, Bell, Hammer, CalendarDays, CalendarClock,
  CheckCircle2, ChevronRight, Clock3, EllipsisVertical,
  Pencil, RefreshCw, Trash2, TrendingDown, Activity, FileText,
  CircleCheck, CircleAlert,
} from 'lucide-react'
import { obtenerAvisosPaciente } from '../../utils/avisosPacientes'
import { avisoDestacado } from '../../utils/cardPaciente'
import IconoWhatsApp from './IconoWhatsApp'
import './estilosPaciente.css'

function enlaceWhatsApp(telefono) {
  const numero = String(telefono || '').replace(/\D/g, '')
  if (numero.length === 10) return 'https://wa.me/52' + numero
  if (numero.length >= 11 && numero.length <= 15) return 'https://wa.me/' + numero
  return null
}

function fechaCorta(valor, zonaHoraria) {
  if (!valor) return null
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? null
    : new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
      ...(zonaHoraria ? {timeZone:zonaHoraria} : {}),
    }).format(fecha)
}

export default function CardPaciente({
  paciente, onEditar, onEliminar, onTrabajar, onDejarTrabajar, onVerAvisos,
  trabajando, obtenerSexo, calcularEdad, obtenerInicial, onReenviar, reenviando, eliminando,
  configSeguimiento, hoySeguimiento, zonaHorariaSeguimiento,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [notasAbiertas, setNotasAbiertas] = useState(false)
  const menuRef = useRef(null)
  const primerItemRef = useRef(null)

  useEffect(() => {
    if (!menuAbierto) return undefined
    primerItemRef.current?.focus()
    const cerrarFuera = e => {
      if (!menuRef.current?.contains(e.target)) setMenuAbierto(false)
    }
    const cerrarEscape = e => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('pointerdown', cerrarFuera)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [menuAbierto])

  const avisos = obtenerAvisosPaciente(paciente,configSeguimiento,hoySeguimiento,zonaHorariaSeguimiento)
  const destacado = avisoDestacado(avisos)
  const estadoPendiente = paciente.accountStatus === 'pending'
  const edad = calcularEdad(paciente.birthDate)
  const whatsapp = enlaceWhatsApp(paciente.phone)
  const mediciones = Array.isArray(paciente.mediciones) ? paciente.mediciones : []
  const ordenadas = [...mediciones]
    .filter(m => m && (m.fecha || m.createdAt))
    .sort((a,b) => new Date(a.fecha || a.createdAt) - new Date(b.fecha || b.createdAt))
  const ultima = ordenadas.at(-1)
  const primera = ordenadas[0]
  const peso = Number(ultima?.peso ?? ultima?.weight ?? paciente.ultimaMedicion?.peso ?? paciente.pesoActual)
  const pesoValido = Number.isFinite(peso) && peso > 0
  const inicial = Number(primera?.peso ?? primera?.weight)
  const cambio = pesoValido && Number.isFinite(inicial) && inicial > 0 && ordenadas.length > 1
    ? peso - inicial : null
  const altura = Number(ultima?.altura ?? ultima?.estatura ?? paciente.ultimaMedicion?.altura ?? paciente.ultimaMedicion?.estatura)
  const metros = altura > 3 ? altura / 100 : altura
  const imc = pesoValido && metros > 0 && metros < 3 ? peso / (metros * metros) : null

  const indicadores = [
    {
      titulo:'Cambio de peso', valor:cambio === null ? 'Sin mediciones' : (cambio > 0 ? '+' : '') + cambio.toFixed(1) + ' kg',
      Icono:TrendingDown,
    },
    {
      titulo:'Última consulta',
      valor:fechaCorta(paciente.ultimaConsulta?.inicio,zonaHorariaSeguimiento) || 'Sin consulta completada',
      Icono:CalendarDays,
    },
    { titulo:'IMC actual', valor:imc === null ? 'Sin medición' : imc.toFixed(1), Icono:Activity },
    {
      titulo:'Próxima consulta',
      valor:fechaCorta(paciente.proximaConsulta?.inicio,zonaHorariaSeguimiento) || 'Por programar',
      Icono:CalendarClock,
    },
  ]

  function ejecutarAccion(callback) {
    setMenuAbierto(false)
    callback()
  }

  return (
    <article
      data-testid="tarjeta-paciente"
      data-trabajando={trabajando ? 'true' : 'false'}
      className={'nutria-patient-card group relative flex h-full min-w-0 flex-col rounded-[24px] border p-4 transition-all duration-200 sm:p-5 ' +
        (trabajando ? 'nutria-patient-card--active ' : '') + (menuAbierto ? 'z-30' : 'z-0')}
    >
      <header className="flex min-w-0 items-start gap-2.5">
        <span aria-hidden="true" className="nutria-patient-card__avatar grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black">
          {obtenerInicial(paciente.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[16px] font-extrabold leading-tight tracking-tight">{paciente.name}</h2>
          <p className="nutria-patient-card__status mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            <span aria-hidden="true" className={'inline-block h-2.5 w-2.5 shrink-0 rounded-full ' +
              (trabajando ? 'bg-[#278c62]' : estadoPendiente ? 'bg-[#d69b47]' : 'bg-[#3c9970]')}/>
            {trabajando ? 'En atención' : estadoPendiente ? 'Invitación pendiente' : 'Cuenta activa'}
          </p>
          <p className="nutria-patient-card__details mt-1.5 flex flex-wrap gap-x-1.5 text-[11px]">
            {edad !== null && <span>{edad} años</span>}
            {edad !== null && <span aria-hidden="true">·</span>}
            <span>{obtenerSexo(paciente.sex)}</span>
            {pesoValido && <><span aria-hidden="true">·</span><span>{peso.toFixed(1)} kg</span></>}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-1.5">
          {avisos.length > 0 && (
            <button type="button" onClick={onVerAvisos}
              title={'Ver ' + avisos.length + ' avisos'}
              aria-label={'Ver ' + avisos.length + ' avisos de ' + paciente.name}
              className="nutria-patient-card__bell relative grid h-10 w-10 place-items-center rounded-full border">
              <Bell size={18} aria-hidden="true"/>
              <span className="nutria-patient-card__count absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold">
                {avisos.length > 9 ? '9+' : avisos.length}
              </span>
            </button>
          )}
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setMenuAbierto(v => !v)}
              aria-label={'Más acciones para ' + paciente.name}
              aria-haspopup="menu" aria-expanded={menuAbierto}
              className="nutria-patient-card__menu-trigger grid h-10 w-9 place-items-center rounded-xl">
              <EllipsisVertical size={20} aria-hidden="true"/>
            </button>
            {menuAbierto && (
              <div role="menu" aria-label={'Acciones de ' + paciente.name}
                className="nutria-patient-card__dropdown absolute right-0 top-[calc(100%+6px)] z-50 w-[205px] max-w-[75vw] rounded-xl border p-1.5 shadow-xl">
                <button ref={primerItemRef} type="button" role="menuitem" onClick={() => ejecutarAccion(onEditar)}
                  disabled={eliminando} className="nutria-patient-card__menuitem flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold">
                  <Pencil size={16}/>Editar paciente
                </button>
                {estadoPendiente && (
                  <button type="button" role="menuitem" onClick={() => ejecutarAccion(onReenviar)}
                    disabled={reenviando || eliminando}
                    className="nutria-patient-card__menuitem flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold">
                    <RefreshCw size={16} className={reenviando ? 'animate-spin' : ''}/>Reenviar invitación
                  </button>
                )}
                <button type="button" role="menuitem" onClick={() => ejecutarAccion(() => setNotasAbiertas(v => !v))}
                  className="nutria-patient-card__menuitem flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold">
                  <FileText size={16}/>{notasAbiertas ? 'Ocultar notas' : 'Ver notas'}
                </button>
                <div className="my-1 border-t border-current/10"/>
                <button type="button" role="menuitem" onClick={() => ejecutarAccion(onEliminar)}
                  disabled={eliminando} className="nutria-patient-card__menuitem nutria-patient-card__delete flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold">
                  <Trash2 size={16}/>Eliminar paciente
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {destacado && (
        <section className="nutria-patient-card__highlight mt-3 rounded-2xl border p-3.5" aria-label="Aviso prioritario">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-extrabold">
              <CircleAlert size={16} aria-hidden="true"/>Atención pendiente
            </h3>
            <span className="nutria-patient-card__tag rounded-full px-2 py-1 text-[11px] font-extrabold">
              {destacado.accion ? 'Acción' : 'Aviso'}
            </span>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed">{destacado.detalle}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="nutria-patient-card__muted text-[11px]">{destacado.titulo}</span>
            <button type="button" onClick={onVerAvisos}
              className="nutria-patient-card__see inline-flex min-h-9 items-center gap-1 rounded-lg px-1.5 text-xs font-extrabold">
              Ver {avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'}
              <ChevronRight size={16} aria-hidden="true"/>
            </button>
          </div>
        </section>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {indicadores.map(({titulo,valor,Icono}) => (
          <div key={titulo} className="nutria-patient-card__metric min-w-0 rounded-2xl border p-3">
            <p className="nutria-patient-card__metric-title flex items-center gap-1.5 text-[10px] font-semibold">
              <Icono size={13} className="shrink-0" aria-hidden="true"/>{titulo}
            </p>
            <p className="nutria-patient-card__metric-value mt-2 break-words text-[13px] font-bold leading-snug">
              {valor}
            </p>
          </div>
        ))}
      </div>

      {notasAbiertas && (
        <section className="nutria-patient-card__notes mt-3 rounded-2xl border p-3.5">
          <h3 className="text-[11px] font-extrabold">Objetivo nutricional / notas</h3>
          <p className="mt-1 break-words text-xs leading-relaxed">
            {paciente.notes || 'Sin notas registradas. Puedes agregarlas al editar al paciente.'}
          </p>
        </section>
      )}

      {avisos.length === 0 && (
        <p className="nutria-patient-card__clear mt-3 flex items-center gap-2 text-xs font-semibold">
          <CircleCheck size={15} aria-hidden="true"/>Sin avisos por revisar
        </p>
      )}

      <footer className="mt-auto flex items-stretch gap-2 pt-4">
        <button type="button" onClick={trabajando ? onDejarTrabajar : onTrabajar}
          aria-label={trabajando ? 'Dejar de trabajar con ' + paciente.name : 'Trabajar con ' + paciente.name}
          className={'nutria-patient-card__work inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2.5 text-[13px] font-extrabold transition ' +
            (trabajando ? 'nutria-patient-card__work--active' : '')}>
          <Hammer size={17} className="shrink-0" aria-hidden="true"/>
          <span className="text-center">{trabajando ? 'Dejar de trabajar' : 'Trabajar con paciente'}</span>
          {trabajando ? <CheckCircle2 size={16} className="shrink-0"/> : <ArrowUpRight size={16} className="shrink-0"/>}
        </button>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            title="Enviar mensaje por WhatsApp" aria-label={'Enviar WhatsApp a ' + paciente.name}
            className="nutria-patient-card__whatsapp grid h-12 w-12 shrink-0 place-items-center rounded-xl border">
            <IconoWhatsApp size={23}/>
          </a>
        ) : (
          <button type="button" disabled title="Agrega un teléfono válido para usar WhatsApp"
            aria-label="WhatsApp no disponible: falta un teléfono válido"
            className="nutria-patient-card__whatsapp grid h-12 w-12 shrink-0 cursor-not-allowed place-items-center rounded-xl border opacity-45">
            <IconoWhatsApp size={23}/>
          </button>
        )}
      </footer>
    </article>
  )
}
