function EstadoCargaPaciente({ loading, error, vacio, children }) {
  if (loading) {
    return <div className="rounded-3xl border border-white/80 bg-white/75 p-10 text-center text-sm text-slate-500 shadow-sm">Cargando tu informacion...</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
  }

  if (vacio) {
    return <div className="rounded-3xl border border-dashed border-[#bdd3c7] bg-white/55 p-10 text-center text-sm text-slate-500">Todavia no hay informacion registrada.</div>
  }

  return children
}

export default EstadoCargaPaciente
