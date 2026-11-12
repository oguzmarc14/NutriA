import { useEffect, useState } from 'react'
import { BellRing, CalendarClock, Save, RefreshCw } from 'lucide-react'
import client from '../../api/client'
import { SEGUIMIENTO_INICIAL } from '../../utils/seguimientoConsultas'
import './configuracionSeguimiento.css'

export default function ConfiguracionSeguimiento() {
  const [config,setConfig] = useState({...SEGUIMIENTO_INICIAL})
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [success,setSuccess] = useState('')
  useEffect(() => {
    let activo=true
    client.get('/horario/seguimiento').then(({data})=>{
      if (activo && data?.configuracion) setConfig(data.configuracion)
    }).catch(err=>{
      if (activo) setError(err.response?.data?.message || 'No fue posible cargar los recordatorios.')
    }).finally(()=>{if(activo)setLoading(false)})
    return ()=>{activo=false}
  },[])

  function cambiar(campo,valor) {
    setConfig(v=>({...v,[campo]:valor}))
    setSuccess('')
  }

  async function guardar(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const ciclo = Number(config.cicloDias)
    const anticipacion = Number(config.anticipacionDias)
    if (!Number.isInteger(ciclo) || ciclo<7 || ciclo>90 ||
        !Number.isInteger(anticipacion) || anticipacion<0 ||
        anticipacion>30 || anticipacion>ciclo) {
      setError('El ciclo debe ser de 7 a 90 días; el aviso de 0 a 30 días y no mayor que el ciclo.')
      return
    }
    setSaving(true)
    try {
      const {data} = await client.put('/horario/seguimiento',{
        activo:Boolean(config.activo),
        cicloDias:ciclo,
        anticipacionDias:anticipacion,
      })
      setConfig(data.configuracion)
      setSuccess('Preferencias de seguimiento guardadas.')
      window.dispatchEvent(new Event('nutria-seguimiento-actualizado'))
    } catch(err) {
      setError(err.response?.data?.message || 'No fue posible guardar los recordatorios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="recordatorios-seguimiento"
      className="nutria-seguimiento-config scroll-mt-20 rounded-[26px] border p-4 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="nutria-seguimiento-icon grid size-12 shrink-0 place-items-center rounded-2xl">
          <BellRing size={24} aria-hidden="true"/>
        </span>
        <div>
          <h2 className="text-lg font-black sm:text-xl">Recordatorios de seguimiento</h2>
          <p className="nutria-seguimiento-muted mt-1 text-sm leading-relaxed">
            Recibe avisos en NutriA cuando se acerque la revisión sugerida después de la última consulta completada.
            No representa una fecha de caducidad de la dieta.
          </p>
        </div>
      </div>

      {loading ? <p role="status" className="nutria-seguimiento-muted mt-5 text-sm">Cargando preferencias…</p> :
        <form onSubmit={guardar} className="mt-5 space-y-5">
          <label className="nutria-seguimiento-card flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3">
            <span className="text-sm font-bold">Activar avisos de seguimiento en NutriA</span>
            <input type="checkbox" className="size-5 shrink-0 accent-[#287553]"
              checked={config.activo} onChange={e=>cambiar('activo',e.target.checked)}/>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-extrabold">
              <span className="flex items-center gap-2"><CalendarClock size={17}/>Cada cuántos días revisar</span>
              <input type="number" min={7} max={90} step={1} required
                value={config.cicloDias} disabled={!config.activo}
                onChange={e=>cambiar('cicloDias',e.target.value)}
                className="nutria-seguimiento-input min-h-11 w-full min-w-0 rounded-xl border px-3"/>
              <span className="nutria-seguimiento-muted text-[11px] font-normal">
                Por ejemplo: 15 días, 30 días (un mes aproximado) o 45 días.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-extrabold">
              Días de anticipación del aviso
              <input type="number" min={0} max={30} step={1} required
                value={config.anticipacionDias} disabled={!config.activo}
                onChange={e=>cambiar('anticipacionDias',e.target.value)}
                className="nutria-seguimiento-input min-h-11 w-full min-w-0 rounded-xl border px-3"/>
              <span className="nutria-seguimiento-muted text-[11px] font-normal">
                Por ejemplo: 5 días antes de la revisión sugerida.
              </span>
            </label>
          </div>
          <div className="nutria-seguimiento-example rounded-xl border p-3 text-xs leading-relaxed">
            <strong>Ejemplo:</strong> ciclo de {config.cicloDias || '30'} días y aviso
            {Number(config.anticipacionDias)===0 ? ' el día del seguimiento.' :
              ' ' + (config.anticipacionDias || '5') + ' días antes.'}
            {' '}Sólo verás el recordatorio si la última consulta está completada y no hay otra próxima cita registrada.
          </div>
          <p className="nutria-seguimiento-muted text-[11px] leading-relaxed">
            Estos avisos aparecen en las tarjetas y la campanita mientras utilizas NutriA.
            No se envían mensajes automáticos a pacientes ni notificaciones push con la aplicación cerrada.
          </p>
          {error && <p role="alert" className="nutria-seguimiento-error rounded-xl border p-3 text-xs font-semibold">{error}</p>}
          {success && <p role="status" className="nutria-seguimiento-success rounded-xl p-3 text-xs font-semibold">{success}</p>}
          <button type="submit" disabled={saving}
            className="nutria-seguimiento-save inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold disabled:opacity-60">
            {saving ? <RefreshCw size={17} className="animate-spin"/> : <Save size={17}/>}
            {saving ? 'Guardando…' : 'Guardar recordatorios'}
          </button>
        </form>}
    </section>
  )
}
