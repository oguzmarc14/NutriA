import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react'
import client from '../api/client'
import CampoContrasena from '../components/auth/CampoContrasena'

export default function RestablecerContrasenaPage(){
  const [params]=useSearchParams()
  const token=params.get('token')||''
  const [password,setPassword]=useState('')
  const [confirmacion,setConfirmacion]=useState('')
  const [visible,setVisible]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState(false)
  async function cambiar(event){
    event.preventDefault()
    setError('')
    if(!/^[0-9a-f]{64}$/i.test(token)){setError('El enlace es inválido. Solicita uno nuevo.');return}
    if(password.length<8||password.length>128){setError('La contraseña debe tener entre 8 y 128 caracteres.');return}
    if(password!==confirmacion){setError('Las contraseñas no coinciden.');return}
    setLoading(true)
    try{
      await client.post('/auth/paciente/restablecer',{token,password})
      setSuccess(true)
      setPassword('')
      setConfirmacion('')
    }catch(err){setError(err.response?.data?.message||'No se pudo actualizar la contraseña.')}
    finally{setLoading(false)}
  }
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf2e7] px-4 py-8">
    <section className="w-full max-w-md rounded-[28px] border border-[#d8e7dc] bg-[#fffefa] p-6 shadow-[0_28px_80px_rgba(28,67,53,.14)] sm:p-8">
      <img src="/imagenes/logo-nutria.png" alt="NutriA" className="mx-auto h-28 w-40 object-contain"/>
      <span className="mx-auto mt-3 grid size-12 place-items-center rounded-2xl bg-[#e0eee4] text-[#246b55]">{success?<CheckCircle2 size={23}/>:<KeyRound size={23}/>}</span>
      <h1 className="mt-4 text-center text-2xl font-black text-[#173f34]">{success?'Contraseña actualizada':'Crear nueva contraseña'}</h1>
      {success?<p role="status" className="mt-4 rounded-2xl bg-[#e5f4e9] p-4 text-center text-sm leading-6 text-[#315d47]">Ya puedes iniciar sesión con tu nueva contraseña.</p>:<>
        <p className="mt-3 text-center text-sm leading-6 text-[#66776b]">El enlace caduca en 30 minutos y solo puede usarse una vez.</p>
        {token?<form onSubmit={cambiar} className="mt-6 space-y-4">
          <CampoContrasena id="nueva" label="Nueva contraseña" value={password}
            onChange={setPassword} visible={visible} onToggle={()=>setVisible(v=>!v)}/>
          <CampoContrasena id="confirmacion" label="Confirmar contraseña" value={confirmacion}
            onChange={setConfirmacion} visible={visible} onToggle={()=>setVisible(v=>!v)}/>
          {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white disabled:opacity-50">
            {loading&&<LoaderCircle size={17} className="animate-spin"/>}{loading?'Guardando…':'Restablecer contraseña'}
          </button>
        </form>:<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">El enlace no contiene un token válido.</p>}
      </>}
      <Link to={success?'/login':'/recuperar-contrasena'}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center text-sm font-bold text-[#246b55] hover:underline">
        {success?'Ir a iniciar sesión':'Solicitar otro enlace'}
      </Link>
    </section>
  </main>
}
