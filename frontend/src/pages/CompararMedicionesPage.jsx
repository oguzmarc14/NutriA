import { ArrowLeft, GitCompareArrows } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function CompararMedicionesPage() {
  const navigate = useNavigate()
  return (
    <section className="min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[#c8ddd2] bg-white/75 px-4 py-2 text-sm font-bold text-[#246b55]"><ArrowLeft size={16} />Volver a mediciones</button>
        <article className="rounded-3xl border border-[#cfe0d6] bg-white/80 p-10 text-center shadow-sm">
          <GitCompareArrows className="mx-auto text-[#4d816f]" size={42} />
          <h1 className="mt-4 text-3xl font-black text-[#173f34]">Comparar mediciones</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">La ruta ya esta preparada. En la siguiente etapa podras elegir dos registros y analizar sus diferencias.</p>
        </article>
      </div>
    </section>
  )
}

export default CompararMedicionesPage
