import { CalendarDays, Mail, Phone, UserRound } from 'lucide-react'
import CardDatoPaciente from '../components/paciente/CardDatoPaciente'
import CardSeccionExpediente from '../components/paciente/CardSeccionExpediente'
import EstadoCargaPaciente from '../components/paciente/EstadoCargaPaciente'
import usePerfilPaciente from '../hooks/usePerfilPaciente'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin registro'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(fecha))
}

function MiExpedientePage() {
  const { perfil, loading, error } = usePerfilPaciente()
  const paciente = perfil?.paciente
  const expediente = perfil?.expediente

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">Mi informacion</p><h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">Mi expediente</h1><p className="mt-2 text-slate-500">Consulta la informacion registrada por tu nutriologo.</p></div>

      <EstadoCargaPaciente loading={loading} error={error} vacio={!loading && !error && !paciente}>
        {paciente && <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardDatoPaciente icono={UserRound} label="Nombre" value={paciente.name} />
            <CardDatoPaciente icono={Mail} label="Correo" value={paciente.email} />
            <CardDatoPaciente icono={Phone} label="Telefono" value={paciente.phone} />
            <CardDatoPaciente icono={CalendarDays} label="Fecha de nacimiento" value={formatearFecha(paciente.birthDate)} />
          </div>

          {expediente ? <>
            <CardSeccionExpediente titulo="Antecedentes y salud" campos={[
              { label: 'Antecedentes personales', value: expediente.antecedentesPersonales },
              { label: 'Antecedentes familiares', value: expediente.antecedentesFamiliares },
              { label: 'Alergias', value: expediente.alergias },
              { label: 'Enfermedades', value: expediente.enfermedades },
              { label: 'Medicamentos', value: expediente.medicamentos },
              { label: 'Cirugias', value: expediente.cirugias },
              { label: 'Lesiones actuales', value: expediente.lesionesActuales },
              { label: 'Padecimientos', value: expediente.padecimientos },
            ]} />
            <CardSeccionExpediente titulo="Habitos y seguimiento" campos={[
              { label: 'Tratamiento farmacologico', value: expediente.tratamientoFarmacologico?.usa ? expediente.tratamientoFarmacologico.descripcion || 'Si' : 'No' },
              { label: 'Tabaquismo', value: expediente.tabaquismo?.usa ? expediente.tabaquismo.descripcion || 'Si' : 'No' },
              { label: 'Alcohol', value: expediente.alcohol?.usa ? expediente.alcohol.descripcion || 'Si' : 'No' },
              { label: 'Suplementos', value: expediente.suplementos?.usa ? expediente.suplementos.descripcion || 'Si' : 'No' },
              { label: 'Observaciones', value: expediente.observaciones },
            ]} />
          </> : <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-10 text-center text-sm text-slate-500">Tu nutriologo aun no ha completado el expediente clinico.</div>}
        </div>}
      </EstadoCargaPaciente>
    </section>
  )
}

export default MiExpedientePage
