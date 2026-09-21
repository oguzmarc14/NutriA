import { Apple, ClipboardPlus, Goal, Ruler, UserRound, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import usePerfilPaciente from '../../hooks/usePerfilPaciente'
import EstadoCargaPaciente from '../paciente/EstadoCargaPaciente'
import CardComparacionMedicion from './CardComparacionMedicion'
import CardModuloDashboard from './CardModuloDashboard'
import CardPlanActualPaciente from './CardPlanActualPaciente'
import CardResumenPaciente from './CardResumenPaciente'
import GraficaProgresoPeso from './GraficaProgresoPeso'

function textoObjetivo(expediente, plan) {
  if (plan?.objetivo) return plan.objetivo
  const objetivos = expediente?.nutricion?.objetivos?.length
    ? expediente.nutricion.objetivos
    : expediente?.nutricion?.objetivoPrincipal
      ? [expediente.nutricion.objetivoPrincipal]
      : []
  const nombres = {
    perdida_peso: 'Perdida de peso',
    incremento_masa: 'Incremento de masa',
    imagen_personal: 'Imagen personal',
    salud: 'Mejorar la salud',
    rendimiento_deportivo: 'Rendimiento deportivo',
    control_enfermedades: 'Control de enfermedades',
    otro: expediente?.nutricion?.objetivoOtro || 'Objetivo personalizado',
  }
  return objetivos.length
    ? objetivos.map((objetivo) => nombres[objetivo] || objetivo).join(', ')
    : 'Sin objetivo registrado'
}

function DashboardPaciente({ nombre }) {
  const navigate = useNavigate()
  const { perfil, loading, error } = usePerfilPaciente()
  const mediciones = perfil?.mediciones || []
  const ultima = mediciones[0]
  const anterior = mediciones[1]
  const planActual = perfil?.planes?.find((plan) => plan.activo) || perfil?.planes?.[0]
  const nutriologo = perfil?.paciente?.nutritionist
  const accesos = [
    { nombre: 'Mi expediente', descripcion: 'Consulta tus antecedentes e informacion clinica.', icono: ClipboardPlus, to: '/mi-expediente' },
    { nombre: 'Mis mediciones', descripcion: 'Revisa todo tu historial de progreso.', icono: Ruler, to: '/mis-mediciones' },
    { nombre: 'Mi plan alimenticio', descripcion: 'Consulta tus comidas e indicaciones actuales.', icono: Apple, to: '/mi-plan' },
  ]

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi seguimiento</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34] md:text-4xl">Hola, {nombre}</h1>
        <p className="mt-2 text-slate-500">Aqui puedes consultar tu progreso y el plan preparado para ti.</p>
      </div>

      <EstadoCargaPaciente loading={loading} error={error} vacio={false}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardResumenPaciente icono={Goal} etiqueta="Mi objetivo" valor={textoObjetivo(perfil?.expediente, planActual)} detalle="Objetivo actual de tu seguimiento" />
          <CardResumenPaciente icono={Utensils} etiqueta="Comidas al dia" valor={planActual?.comidas?.length || perfil?.expediente?.nutricion?.numeroComidasDia || '—'} detalle={planActual ? 'Incluidas en tu plan actual' : 'Pendiente de registrar'} tono="arena" />
          <CardResumenPaciente icono={UserRound} etiqueta="Mi nutriologo" valor={nutriologo?.name || 'Por confirmar'} detalle={nutriologo?.email || 'Profesional asignado a tu seguimiento'} tono="azul" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <CardComparacionMedicion ultima={ultima} anterior={anterior} />
          <GraficaProgresoPeso mediciones={mediciones} />
        </div>

        <div className="mt-5">
          <CardPlanActualPaciente plan={planActual} onVerPlan={() => navigate('/mi-plan')} />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-xl font-extrabold text-[#173f34]">Accesos rapidos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {accesos.map((acceso) => <CardModuloDashboard key={acceso.nombre} nombre={acceso.nombre} descripcion={acceso.descripcion} icono={acceso.icono} onClick={() => navigate(acceso.to)} />)}
          </div>
        </div>
      </EstadoCargaPaciente>
    </section>
  )
}

export default DashboardPaciente
