import { useEffect, useState } from 'react'
import { BellRing, CalendarClock, CalendarDays, CalendarOff } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import HorarioLaboral from '../components/HorarioLaboral'
import ConfiguracionCitas from '../components/citas/ConfiguracionCitas'
import ConfiguracionSeguimiento from '../components/avisos/ConfiguracionSeguimiento'

const SECCIONES = [
  {id:'horario-laboral',titulo:'Horario laboral',Icono:CalendarDays},
  {id:'dias-no-laborables',titulo:'Días no laborables',Icono:CalendarOff},
  {id:'horarios-citas',titulo:'Horarios de consulta',Icono:CalendarClock},
  {id:'recordatorios-seguimiento',titulo:'Recordatorios',Icono:BellRing},
]

export default function EditarPerfilPage() {
  const location = useLocation()
  const [versionHorario, setVersionHorario] = useState(0)

  useEffect(() => {
    if (!location.hash && !location.state?.abrirConfiguracion) return
    const id = location.hash.replace('#','') ||
      (location.state?.abrirConfiguracion ? 'horarios-citas' : '')
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({behavior:'smooth',block:'start'})
  }, [location.hash, location.state, versionHorario])

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 pb-28 sm:p-8">
      <div>
        <h1 className="text-2xl font-black text-[#173f34] sm:text-3xl dark:text-[#e6f6eb]">
          Editar perfil y horario
        </h1>
        <p className="mt-2 text-sm text-[#607b6c] dark:text-[#b9d0c0]">
          Controla desde aquí cuándo trabajas, los descansos especiales y los espacios que ofreces a tus pacientes.
        </p>
      </div>
      <nav aria-label="Secciones de horarios" className="flex flex-wrap gap-2">
        {SECCIONES.map(({id,titulo,Icono}) => (
          <a href={'#'+id} key={id}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#a6cbb4] bg-[#e4f1e8] px-3 text-xs font-extrabold text-[#246b55] hover:bg-[#d1e8d9] dark:border-[#6b997a] dark:bg-[#325340] dark:text-[#dbf3e2]">
            <Icono size={16} aria-hidden="true"/>{titulo}
          </a>
        ))}
      </nav>
      <HorarioLaboral onSaved={() => setVersionHorario(n => n + 1)}/>
      <div id="horarios-citas" className="scroll-mt-20">
        <ConfiguracionCitas key={versionHorario}/>
      </div>
      <ConfiguracionSeguimiento/>
    </main>
  )
}
