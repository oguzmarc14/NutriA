import HorarioLaboral from '../components/HorarioLaboral'
export default function EditarPerfilPage() {
  return <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-8">
    <div><h1 className="text-3xl font-extrabold text-[#173f34]">Editar perfil</h1><p className="mt-1 text-sm text-[#607b6c]">Personaliza tus días de consulta y tu horario. Puedes modificarlos cuando quieras.</p></div>
    <HorarioLaboral />
  </main>
}
