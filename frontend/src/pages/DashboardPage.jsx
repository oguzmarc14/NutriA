import { useEffect, useState } from 'react'
import client from '../api/client'
import {
  Building2, Pencil, TrendingUp, UserRoundPlus, CalendarClock,
  Apple,
  ClipboardPlus,
  Ruler,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import CardModuloDashboard from '../components/dashboard/CardModuloDashboard'
import DashboardPaciente from '../components/dashboard/DashboardPaciente'
import { useAuth } from '../context/auth'

const nutritionistModules = [
  {
    description: 'Registra, consulta y actualiza la información general.',
    icon: Users,
    name: 'Pacientes',
    to: '/pacientes',
  },
  {
    description: 'Consulta antecedentes e historial médico del paciente.',
    icon: ClipboardPlus,
    name: 'Expedientes clínicos',
    to: '/pacientes',
  },
  {
    description: 'Registra peso, estatura e IMC y consulta su historial.',
    icon: Ruler,
    name: 'Mediciones',
    to: '/mediciones',
  },
  {
    description: 'Crea planes básicos con comidas e indicaciones.',
    icon: Apple,
    name: 'Planes alimenticios',
    to: '/planes',
  },
]

const adminModules = [
  {
    description:
      'Autoriza y administra las cuentas del personal con acceso a NutriA.',
    icon: UserCog,
    name: 'Gestión de usuarios',
    to: '/usuarios',
  },
  {
    description:
      'Controla qué administradores y nutriólogos tienen acceso al sistema.',
    icon: ShieldCheck,
    name: 'Control de acceso',
    to: '/usuarios',
  },
]

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorDatos, setErrorDatos] = useState('')
  const [marca, setMarca] = useState({ nombre: '', nombreProfesional: '', logo: '' })
  useEffect(() => {
    if (user.role !== 'nutritionist') return undefined
    let activo = true
    const cargar = () => client.get('/clinica').then(({data}) => { if (activo) setMarca(data.clinica || {}) }).catch(() => {})
    cargar()
    window.addEventListener('nutria-clinica-actualizada', cargar)
    return () => { activo = false; window.removeEventListener('nutria-clinica-actualizada', cargar) }
  }, [user.role])

  useEffect(() => {
    if (user.role !== 'nutritionist') return undefined
    let vigente = true
    client.get('/pacientes').then(({ data }) => {
      if (vigente) setPacientes(data.pacientes || [])
    }).catch(() => { if (vigente) setErrorDatos('No se pudieron cargar las estadísticas.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [user.role])

  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const primerDiaAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const fechaRegistro = (p) => new Date(p.createdAt || p.fechaRegistro || 0)
  const nuevosMes = pacientes.filter(p => fechaRegistro(p) >= primerDiaMes).length
  const nuevosAnterior = pacientes.filter(p => fechaRegistro(p) >= primerDiaAnterior && fechaRegistro(p) < primerDiaMes).length
  const meses = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1)
    const cantidad = pacientes.filter(p => { const f = fechaRegistro(p); return f.getFullYear() === fecha.getFullYear() && f.getMonth() === fecha.getMonth() }).length
    return { etiqueta: fecha.toLocaleDateString('es-MX', { month: 'short' }), cantidad }
  })
  const maxMes = Math.max(1, ...meses.map(m => m.cantidad))
  const conSeguimiento = pacientes.filter(p => Array.isArray(p.mediciones) && p.mediciones.length >= 2)
  const bajaron = conSeguimiento.filter(p => {
    const m = [...p.mediciones].filter(x => x && (x.fecha || x.createdAt)).sort((a,b) => new Date(a.fecha || a.createdAt) - new Date(b.fecha || b.createdAt))
    const primero = Number(m[0]?.peso ?? m[0]?.weight)
    const ultimo = Number(m.at(-1)?.peso ?? m.at(-1)?.weight)
    return primero > 0 && ultimo > 0 && ultimo < primero
  }).length

  const isAdmin = user.role === 'admin'
  const isPatient = user.role === 'patient'

  if (isPatient) {
    return <DashboardPaciente nombre={user.name.split(' ')[0]} />
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#173f34]">Resumen de la clínica</h1>
          <p className="text-xs text-[#648073]">Indicadores calculados con tus registros</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-[#d4e5d9] bg-white/80 p-5 shadow-sm">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#d4e5d9] bg-[#e4f2e9]">
            {marca.logo ? <img src={marca.logo} alt="Logo de la clínica" className="h-full w-full object-contain" /> : <Building2 className="text-[#267153]" size={30} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6f8c7a]">Mi consultorio</p>
            <h2 className="break-words text-2xl font-extrabold text-[#173f34]">{marca.nombre || 'Tu clínica'}</h2>
            <p className="text-sm text-[#648073]">Bienvenido, {(marca.nombreProfesional || user.name).split(' ')[0]}</p>
          </div>
          <button type="button" onClick={() => navigate('/mi-clinica')} title="Editar información de mi clínica" aria-label="Editar información de mi clínica" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c8dfcf] bg-[#edf5ef] text-[#246b55] hover:bg-[#dcebe0]"><Pencil size={18}/></button>
        </div>
        {errorDatos && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{errorDatos}</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { titulo: 'Total de pacientes', valor: pacientes.length, detalle: 'Registrados', Icono: Users },
            { titulo: 'Nuevos este mes', valor: nuevosMes, detalle: `Mes anterior: ${nuevosAnterior}`, Icono: UserRoundPlus },
            { titulo: 'Bajaron de peso', valor: bajaron, detalle: `De ${conSeguimiento.length} con historial disponible`, Icono: TrendingUp },
            { titulo: 'Sin historial comparable', valor: pacientes.length - conSeguimiento.length, detalle: 'Menos de 2 mediciones', Icono: CalendarClock },
          ].map(({ titulo, valor, detalle, Icono }) => (
            <div key={titulo} className="min-w-0 rounded-2xl border border-[#d9e5dc] bg-white/85 p-4">
              <div className="flex items-start justify-between gap-1"><p className="text-xs font-semibold text-[#708779]">{titulo}</p><Icono size={18} className="shrink-0 text-[#4d816f]"/></div>
              <p className="mt-3 text-3xl font-extrabold text-[#173f34]">{cargando ? '—' : valor}</p>
              <p className="mt-1 text-xs text-[#819188]">{detalle}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#d9e5dc] bg-white/85 p-5">
            <h3 className="font-extrabold text-[#173f34]">Crecimiento de pacientes</h3>
            <p className="mt-1 text-xs text-[#819188]">Nuevos registros durante los últimos 6 meses</p>
            <div className="mt-5 flex h-44 items-end justify-around gap-2 border-b border-[#d9e5dc] pb-2">
              {meses.map((m, i) => (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#246b55]">{cargando ? '—' : m.cantidad}</span>
                  <div className="w-full max-w-12 rounded-t-lg bg-[#81b99b]" style={{ height: `${Math.max(m.cantidad ? 8 : 2, (m.cantidad / maxMes) * 100)}%` }} title={`${m.cantidad} nuevos pacientes`}/>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-around gap-2">{meses.map((m,i) => <span key={i} className="flex-1 text-center text-xs capitalize text-[#708779]">{m.etiqueta}</span>)}</div>
          </div>
          <div className="rounded-3xl border border-[#d9e5dc] bg-white/85 p-5">
            <h3 className="font-extrabold text-[#173f34]">Seguimiento nutricional</h3>
            <p className="mt-1 text-xs text-[#819188]">Comparación de primera y última medición disponible</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm"><span className="text-[#526d5d]">Con historial de mediciones</span><strong className="text-[#173f34]">{cargando ? '—' : conSeguimiento.length}</strong></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e4eee6]"><div className="h-full rounded-full bg-[#4d816f]" style={{ width: `${pacientes.length ? (conSeguimiento.length / pacientes.length) * 100 : 0}%` }}/></div>
              <div className="flex items-center justify-between text-sm"><span className="text-[#526d5d]">Con disminución de peso</span><strong className="text-[#173f34]">{cargando ? '—' : bajaron}</strong></div>
              <p className="text-xs leading-relaxed text-[#819188]">La disminución de peso no siempre representa una mejora: depende del objetivo clínico de cada paciente.</p>
            </div>
          </div>
        </div>
        <p className="text-right text-xs font-semibold text-[#789285]">Tecnología de <span className="text-[#246b55]">NutriA</span></p>
      </section>
    )
  }

  const modules = isAdmin ? adminModules : nutritionistModules

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
          Panel principal
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34] md:text-4xl">
          Hola, {user.name.split(' ')[0]}
        </h1>

        <p className="mt-2 text-slate-500">
          {isAdmin
            ? 'Administra los usuarios y accesos del sistema NutriA.'
            : 'Administra el seguimiento nutricional de tus pacientes desde un solo lugar.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map(
          ({ description, icon: Icon, name, to }) => (
            <CardModuloDashboard
              key={name}
              onClick={() => navigate(to)}
              descripcion={description}
              icono={Icon}
              nombre={name}
            />
          ),
        )}
      </div>
    </section>
  )
}

export default DashboardPage
