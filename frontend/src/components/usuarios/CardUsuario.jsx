import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'

function CardUsuario({
  usuario,
  icono: Icono,
  estado,
  esUsuarioActual,
  actualizando,
  onCambiarEstado,
}) {
  return (
    <article className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
            <Icono size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-[#173f34]">{usuario.name}</h3>
              {esUsuarioActual && <span className="rounded-full bg-[#e8f3ee] px-2 py-0.5 text-[11px] font-bold text-[#246b55]">Tú</span>}
            </div>
            <p className="truncate text-sm text-slate-500">{usuario.email}</p>
            <div className="mt-2 flex items-center gap-2">
              {usuario.active ? <CheckCircle2 size={15} className={estado.clase} /> : <XCircle size={15} className="text-slate-400" />}
              <span className={`text-xs font-bold ${estado.clase}`}>{estado.texto}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCambiarEstado}
          disabled={actualizando || esUsuarioActual}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${usuario.active ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'bg-[#246b55] text-white hover:bg-[#1d5947]'}`}
        >
          {actualizando ? <LoaderCircle className="animate-spin" size={17} /> : usuario.active ? <XCircle size={17} /> : <CheckCircle2 size={17} />}
          {esUsuarioActual ? 'Tu cuenta' : usuario.active ? 'Desactivar acceso' : 'Activar acceso'}
        </button>
      </div>
    </article>
  )
}

export default CardUsuario
