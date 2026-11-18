import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, LoaderCircle, Mail } from 'lucide-react'
import client from '../api/client'

export default function RecuperarContrasenaPage() {
  const [email,setEmail]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [enviado,setEnviado]=useState(false)
  async function solicitar(event){
    event.preventDefault()
    if(loading)return
    setError('')
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){
      setError('Escribe un correo válido para continuar.')
      return
    }
    setLoading(true)
    try{
      await client.post('/auth/paciente/recuperar',{email:email.trim()})
      setEnviado(true)
    }catch(err){setError(err.response?.data?.message || 'No fue posible procesar la solicitud. Intenta más tarde.')}
    finally{setLoading(false)}
  }
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf2e7] px-4 py-8">
    <section className="w-full max-w-md rounded-[28px] border border-[#d8e7dc] bg-[#fffefa] p-6 shadow-[0_28px_80px_rgba(28,67,53,.14)] sm:p-8">
      <img src="/imagenes/logo-nutria.png" alt="NutriA" className="mx-auto h-28 w-40 object-contain"/>
      <span className="mx-auto mt-3 grid size-12 place-items-center rounded-2xl bg-[#e0eee4] text-[#246b55]"><KeyRound size={23}/></span>
      <h1 className="mt-4 text-center text-2xl font-black text-[#173f34]">Recuperar contraseña</h1>
      {enviado ? <div className="mt-5" role="status">
        <p className="rounded-2xl bg-[#e5f4e9] p-4 text-center text-sm leading-6 text-[#315d47]">
          Si tienes una cuenta de paciente activa con ese correo, recibirás un enlace. Revisa también la carpeta de spam.
        </p>
        <p className="mt-3 text-center text-xs text-[#718277]">El enlace caduca después de 30 minutos. Puedes solicitar otro más adelante.</p>
      </div> : <>
        <p className="mt-3 text-center text-sm leading-6 text-[#66776b]">Indica el correo de tu cuenta de paciente. Te enviaremos un enlace seguro si está registrada.</p>
        <form onSubmit={solicitar} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-[#315442]" htmlFor="email-recuperacion">Correo electrónico</label>
          <div className="relative">
            <Mail aria-hidden="true" size={18} className="absolute left-3 top-3 text-[#789386]"/>
            <input id="email-recuperacion" type="email" name="email" autoComplete="email" required maxLength={254}
              value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="paciente@correo.com"
              className="min-h-11 w-full min-w-0 rounded-xl border border-[#bacfc1] bg-white py-2 pl-10 pr-3 text-sm text-[#173f34] focus:outline-[#246b55]"/>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 text-sm font-bold text-white disabled:opacity-50">
            {loading?<LoaderCircle size={17} className="animate-spin"/>:<Mail size={17}/>}
            {loading?'Enviando…':'Enviar enlace'}
          </button>
        </form>
      </>}
      <Link to="/login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-bold text-[#246b55] hover:underline"><ArrowLeft size={16}/>Volver al inicio de sesión</Link>
    </section>
  </main>
}
