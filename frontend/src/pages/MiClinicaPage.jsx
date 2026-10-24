import { useEffect, useState } from 'react'
import { Building2, Camera, Save, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/auth'

export default function MiClinicaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', nombreProfesional: '', logo: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let activo = true
    client.get('/clinica').then(({data}) => { if (activo) setForm({nombre:data.clinica?.nombre || '',nombreProfesional:data.clinica?.nombreProfesional || user.name,logo:data.clinica?.logo || ''}) })
      .catch(() => { if (activo) setError('No fue posible cargar la información de la clínica.') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [user.name])
  function cambiarLogo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!['image/png','image/jpeg','image/webp'].includes(archivo.type) || archivo.size > 650000) {
      setError('El logo debe ser PNG, JPG o WebP y pesar menos de 650 KB.')
      return
    }
    const lector = new FileReader()
    lector.onload = () => { setForm(actual => ({...actual,logo:lector.result}));setError('') }
    lector.readAsDataURL(archivo)
    e.target.value = ''
  }
  async function guardar(e) {
    e.preventDefault()
    setGuardando(true);setMensaje('');setError('')
    try {
      const {data} = await client.put('/clinica',form)
      setForm(data.clinica)
      setMensaje('Los cambios se guardaron correctamente.')
      window.dispatchEvent(new Event('nutria-clinica-actualizada'))
    } catch(err) {setError(err.response?.data?.message || 'No fue posible guardar los cambios.')}
    finally {setGuardando(false)}
  }
  return <section className="mx-auto max-w-3xl p-4 md:p-8">
    <button type="button" onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#246b55]"><ArrowLeft size={16}/>Volver al resumen</button>
    <h1 className="text-3xl font-extrabold text-[#173f34]">Mi clínica</h1>
    <p className="mt-1 text-sm text-[#708779]">Personaliza la identidad de tu consultorio.</p>
    <form onSubmit={guardar} className="mt-6 space-y-5 rounded-3xl border border-[#d4e5d9] bg-white/90 p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#d4e5d9] bg-[#e4f2e9]">{form.logo ? <img src={form.logo} alt="Logo actual" className="h-full w-full object-contain"/> : <Building2 size={32} className="text-[#246b55]"/>}</div>
        <div className="space-y-2"><p className="text-sm font-bold text-[#173f34]">Logotipo del consultorio</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#cadfd1] px-3 py-2 text-xs font-bold text-[#246b55]"><Camera size={16}/>Cambiar logo<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={cambiarLogo}/></label>
          {form.logo && <button type="button" onClick={() => setForm(f=>({...f,logo:''}))} className="ml-2 text-xs font-semibold text-[#a64b4b]">Quitar</button>}
          <p className="text-xs text-[#819188]">PNG, JPG o WebP · máximo 650 KB</p>
        </div>
      </div>
      <label className="block text-sm font-semibold text-[#526d5d]">Nombre del consultorio<input required maxLength={80} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre de tu clínica" className="mt-2 w-full rounded-xl border border-[#cadfd1] bg-white p-3 text-sm text-[#173f34] outline-none focus:border-[#246b55]"/></label>
      <label className="block text-sm font-semibold text-[#526d5d]">Nombre profesional<input maxLength={100} value={form.nombreProfesional} onChange={e=>setForm(f=>({...f,nombreProfesional:e.target.value}))} placeholder={user.name} className="mt-2 w-full rounded-xl border border-[#cadfd1] bg-white p-3 text-sm text-[#173f34] outline-none focus:border-[#246b55]"/></label>
      <p className="text-xs text-[#819188]">El nombre profesional es el que se mostrará en tu clínica; no modifica tu cuenta de acceso.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mensaje && <p role="status" className="rounded-xl bg-[#e4f2e9] p-3 text-sm text-[#246b55]">{mensaje}</p>}
      <button type="submit" disabled={guardando || cargando} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={17}/>{guardando?'Guardando...':'Guardar cambios'}</button>
    </form>
  </section>
}
