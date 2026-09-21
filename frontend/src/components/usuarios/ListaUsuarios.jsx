import CardUsuario from './CardUsuario'

function ListaUsuarios({
  titulo,
  descripcion,
  usuarios,
  icono: Icono,
  usuarioActualId,
  actualizandoId,
  obtenerEstado,
  onCambiarEstado,
}) {
  return (
    <section className="mb-8">
      <div className="mb-4"><h2 className="text-xl font-extrabold text-[#173f34]">{titulo}</h2><p className="mt-1 text-sm text-slate-500">{descripcion}</p></div>
      {usuarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbdcd4] bg-white p-8 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]"><Icono size={21} /></div><p className="font-bold text-[#173f34]">No hay usuarios registrados</p></div>
      ) : (
        <div className="grid gap-4">{usuarios.map((usuario) => <CardUsuario key={usuario.id} usuario={usuario} icono={Icono} estado={obtenerEstado(usuario)} esUsuarioActual={usuario.id === usuarioActualId} actualizando={actualizandoId === usuario.id} onCambiarEstado={() => onCambiarEstado(usuario)} />)}</div>
      )}
    </section>
  )
}

export default ListaUsuarios
