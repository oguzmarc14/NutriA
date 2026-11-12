import { Bell, CalendarCheck2, CalendarClock, CalendarDays, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import useMisCitas from '../hooks/useMisCitas'
import { estadoCitaPaciente, formatearCitaPaciente, tipoCitaPaciente } from '../utils/fechasMisCitas'
import './misCitas.css'

function TarjetaCita({cita,zonaHoraria}){
  const estado=estadoCitaPaciente(cita.estado)
  return <article className="nutria-mis-citas-tarjeta min-w-0 rounded-2xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="text-sm font-extrabold">{tipoCitaPaciente(cita.tipo)}</h3>
      <span className={'nutria-mis-citas-status rounded-full px-2.5 py-1 text-[11px] font-bold '+(cita.estado==='confirmada'?'nutria-mis-citas-confirmada':'')}>
        {estado}
      </span>
    </div>
    <p className="mt-2 flex items-start gap-2 break-words text-sm capitalize leading-relaxed">
      <CalendarDays className="mt-0.5 shrink-0" size={17}/>
      {formatearCitaPaciente(cita.inicio,zonaHoraria)}
    </p>
  </article>
}

export default function MisCitasPage(){
  const {datos,cargando,error,actualizar}=useMisCitas()
  const citas=datos?.citas||[]
  const zona=datos?.zonaHoraria || 'America/Mexico_City'
  const proxima=datos?.proxima
  const avisos=datos?.avisos||[]
  const futuras=citas.filter(c=>['programada','confirmada'].includes(c.estado) && new Date(c.inicio)>new Date())
    .sort((a,b)=>new Date(a.inicio)-new Date(b.inicio))
  const anteriores=citas.filter(c=>!futuras.some(f=>f._id===c._id))
    .sort((a,b)=>new Date(b.inicio)-new Date(a.inicio))

  return <main className="nutria-mis-citas mx-auto w-full min-w-0 max-w-4xl space-y-5 overflow-x-clip p-4 pb-28 sm:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wide opacity-70">Mis consultas</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Mis citas</h1>
        <p className="mt-2 text-sm opacity-75">Consulta tus citas con {datos?.profesional || 'tu nutriólogo'}.</p>
      </div>
      <button type="button" onClick={actualizar} aria-label="Actualizar mis citas"
        className="nutria-mis-citas-accion inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold">
        <RefreshCw size={16}/>Actualizar
      </button>
    </header>

    {cargando && !datos && <p role="status" className="nutria-mis-citas-tarjeta rounded-xl border p-5 text-sm">Cargando tus citas…</p>}
    {error && <p role="alert" className="nutria-mis-citas-error rounded-xl border p-4 text-sm">{error}</p>}

    {datos && <>
      {proxima ? <section className="nutria-mis-citas-destacada min-w-0 rounded-[24px] border p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-black">
            {proxima.estado==='confirmada'?<CalendarCheck2 size={23}/>:<CalendarClock size={23}/>}
            {proxima.estado==='confirmada'?'Mi próxima cita':'Cita pendiente de confirmar'}
          </h2>
          <span className="nutria-mis-citas-tag rounded-full px-3 py-1 text-xs font-extrabold">
            {estadoCitaPaciente(proxima.estado)}
          </span>
        </div>
        <p className="mt-4 break-words text-xl font-extrabold capitalize leading-snug">
          {formatearCitaPaciente(proxima.inicio,zona)}
        </p>
        <p className="mt-2 text-sm">{tipoCitaPaciente(proxima.tipo)}</p>
        <p className="mt-2 text-xs leading-5 opacity-75">
          {proxima.estado==='confirmada'?'Tu nutriólogo confirmó esta consulta.':
            'Tu nutriólogo todavía no ha marcado esta consulta como confirmada.'}
        </p>
      </section> : <section className="nutria-mis-citas-tarjeta rounded-[24px] border p-5">
        <div className="flex items-center gap-2"><CalendarClock size={21}/><h2 className="text-lg font-extrabold">Sin próxima cita</h2></div>
        <p className="mt-2 text-sm opacity-75">Todavía no tienes una consulta futura registrada. Puedes comunicarte con tu nutriólogo para programar una.</p>
      </section>}
      {avisos.filter(a=>a.tipo==='seguimiento').map(aviso=><section key={aviso.id}
        role="status" className="nutria-mis-citas-aviso rounded-2xl border p-4">
        <h2 className="flex items-center gap-2 text-sm font-extrabold"><Bell size={18}/>{aviso.titulo}</h2>
        <p className="mt-2 text-sm leading-6">{aviso.detalle}</p>
        <p className="mt-2 text-xs opacity-75">Este aviso es un seguimiento sugerido, no una cita reservada ni el vencimiento de tu dieta.</p>
      </section>)}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Clock3 size={19}/>Próximas consultas</h2>
        {futuras.length ? futuras.map(c=><TarjetaCita key={c._id} cita={c} zonaHoraria={zona}/>) :
          <p className="text-sm opacity-70">No hay consultas próximas.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><CheckCircle2 size={19}/>Historial de citas</h2>
        {anteriores.length ? anteriores.map(c=><TarjetaCita key={c._id} cita={c} zonaHoraria={zona}/>) :
          <p className="text-sm opacity-70">Todavía no hay citas en tu historial.</p>}
      </section>
      <p className="text-xs opacity-65">Zona horaria del consultorio: {zona}. Solo se muestran las citas asociadas a tu cuenta.</p>
    </>}
  </main>
}
