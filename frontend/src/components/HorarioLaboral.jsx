import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Save } from 'lucide-react'
import client from '../api/client'
const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const inicial = {dias:[1,2,3,4,5],inicio:'09:00',fin:'18:00',zonaHoraria:Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City'}
export default function HorarioLaboral({ primerIngreso = false, onSaved }) {
  const [form,setForm] = useState(inicial)
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [success,setSuccess] = useState('')
  useEffect(() => {
    let active = true
    client.get('/horario').then(({data}) => {
      if(active && data.horario?.configurado) setForm({
        dias:data.horario.dias,inicio:data.horario.inicio,fin:data.horario.fin,zonaHoraria:data.horario.zonaHoraria
      })
    }).catch(() => {if(active)setError('No fue posible cargar tu horario.')}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[])
  function toggle(dia) {setForm(f=>({...f,dias:f.dias.includes(dia)?f.dias.filter(d=>d!==dia):[...f.dias,dia].sort()}))}
  async function save(e) {
    e.preventDefault();setError('');setSuccess('')
    if (!form.dias.length) {setError('Selecciona al menos un día laboral.');return}
    if (form.fin <= form.inicio) {setError('La hora de salida debe ser posterior a la de entrada.');return}
    setSaving(true)
    try {
      const {data}=await client.put('/horario',form)
      setSuccess('Tu horario se guardó correctamente.')
      window.dispatchEvent(new CustomEvent('nutria-horario-actualizado',{detail:data.horario}))
      onSaved?.(data.horario)
    } catch(err) {setError(err.response?.data?.message || 'No se pudo guardar tu horario.')}
    finally {setSaving(false)}
  }
  return <section className="rounded-3xl border border-[#cfe0d6] bg-white p-5 shadow-xl sm:p-7">
    <div className="mb-5 flex items-center gap-3"><div className="rounded-2xl bg-[#e3f0e7] p-3 text-[#246b55]"><CalendarDays size={24}/></div><div><h2 className="text-xl font-extrabold text-[#173f34]">{primerIngreso?'¡Bienvenido! Configura tu agenda':'Mis días y horas de trabajo'}</h2><p className="text-sm text-[#607b6c]">Selecciona cuándo atiendes. Tus días libres no aparecerán como disponibles para nuevas citas.</p></div></div>
    {loading?<p className="text-sm text-[#607b6c]">Cargando horario…</p>:<form onSubmit={save} className="space-y-5">
      <fieldset><legend className="mb-3 text-sm font-bold text-[#173f34]">Días de atención</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{DIAS.map((dia,i)=><label key={dia} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${form.dias.includes(i)?'border-[#246b55] bg-[#e7f3eb] text-[#205941]':'border-[#dce8df] bg-white text-[#687e70]'}`}><input type="checkbox" checked={form.dias.includes(i)} onChange={()=>toggle(i)} className="accent-[#246b55]"/>{dia}</label>)}</div></fieldset>
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-[#173f34]"><span className="flex items-center gap-2"><Clock3 size={16}/>Hora de entrada</span><input required type="time" value={form.inicio} onChange={e=>setForm(f=>({...f,inicio:e.target.value}))} className="rounded-xl border border-[#cfe0d6] p-3"/></label><label className="grid gap-2 text-sm font-bold text-[#173f34]">Hora de salida<input required type="time" value={form.fin} onChange={e=>setForm(f=>({...f,fin:e.target.value}))} className="rounded-xl border border-[#cfe0d6] p-3"/></label></div>
      <p className="text-xs text-[#607b6c]">Zona horaria: {form.zonaHoraria}. Las consultas duran una hora y deben terminar antes de tu hora de salida.</p>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {success&&<p role="status" className="rounded-xl bg-[#e7f3eb] p-3 text-sm font-semibold text-[#246b55]">{success}</p>}
      <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={18}/>{saving?'Guardando…':'Guardar mi horario'}</button>
    </form>}
  </section>
}
