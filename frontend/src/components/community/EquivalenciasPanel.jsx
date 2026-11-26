import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import client from '../../api/client'

const normalizar = texto => texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export default function EquivalenciasPanel() {
  const [alimentos, setAlimentos] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [grupo, setGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (estado !== 'cargando') return
    let vigente = true
    client.get('/asistente-equivalentes/catalogo')
      .then(({ data }) => {
        if (!vigente) return
        setAlimentos(data.alimentosVerificados)
        setEstado('listo')
      })
      .catch(() => { if (vigente) setEstado('error') })
    return () => { vigente = false }
  }, [estado])

  const grupos = [...new Set(alimentos.map(alimento => alimento.grupo))]
  const consulta = normalizar(busqueda.trim())
  const resultados = alimentos.filter(alimento =>
    (!grupo || alimento.grupo === grupo) && normalizar(alimento.nombre).includes(consulta),
  )

  return <section aria-labelledby="equivalencias-titulo" className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 sm:p-6">
    <header>
      <h2 id="equivalencias-titulo" className="text-xl font-extrabold text-[#173f34]">Asistente de equivalentes y alimentos</h2>
      <p className="mt-1 text-sm text-[#52716a]">Consulta porciones y fuentes de los alimentos con equivalencia documentada.</p>
    </header>
    {estado === 'cargando' && <p role="status" className="text-sm text-[#52716a]">Cargando catálogo…</p>}
    {estado === 'error' && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
      <p>No se pudo cargar el catálogo.</p>
      <button type="button" className="min-h-11 font-bold underline" onClick={() => setEstado('cargando')}>Reintentar</button>
    </div>}
    {estado === 'listo' && <>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <label className="text-sm font-bold text-[#173f34]">Buscar alimento
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-200 px-3 focus-within:ring-2 focus-within:ring-emerald-600">
            <Search size={17} aria-hidden="true"/>
            <input type="search" value={busqueda} onChange={event => setBusqueda(event.target.value)}
              className="min-h-11 w-full font-normal outline-none" placeholder="Nombre del alimento"/>
          </span>
        </label>
        <label className="text-sm font-bold text-[#173f34]">Grupo
          <select value={grupo} onChange={event => setGrupo(event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 font-normal">
            <option value="">Todos los grupos</option>
            {grupos.map(nombre => <option key={nombre}>{nombre}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className="text-sm text-[#52716a]">{resultados.length} alimentos encontrados</p>
      {!resultados.length && <p className="rounded-xl bg-[#f1f7f3] p-3 text-sm">No hay alimentos que coincidan con estos filtros.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {resultados.map(alimento => <li key={alimento._id} className="rounded-2xl border border-[#dceade] bg-[#f7faf7] p-4">
          <h3 className="font-extrabold text-[#173f34]">{alimento.nombre}</h3>
          <p className="mt-1 text-sm text-[#52716a]">{alimento.grupo} · {alimento.equivalentes} equivalentes por porción</p>
          <p className="mt-1 text-sm text-[#315d4b]">{alimento.porcion?.descripcion || [alimento.porcion?.cantidad, alimento.porcion?.unidad].filter(Boolean).join(' ') || 'Porción de referencia'}{alimento.porcion?.gramos ? ' · ' + alimento.porcion.gramos + ' g' : ''}</p>
          <p className="mt-2 text-xs text-[#52716a]">Fuente · {alimento.fuentes.filter(f => f.tipoDato === 'equivalencia').map(f =>
            [f.nombre, f.edicion || f.referencia || f.identificador].filter(Boolean).join(' · '),
          ).join(', ')}</p>
        </li>)}
      </ul>
    </>}
  </section>
}
