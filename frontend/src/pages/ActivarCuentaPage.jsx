import { Eye, EyeOff, Leaf, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import client from '../api/client'

function ActivarCuentaPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function activarCuenta(event) {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('El enlace de invitación está incompleto')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setLoading(true)
      await client.post('/auth/paciente/activar', { token, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible activar tu cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf2e7] px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] border border-white/80 bg-[#fffefa] p-6 shadow-[0_28px_80px_rgba(28,67,53,0.16)] sm:p-8">
        <img src="/imagenes/logo-nutria.png" alt="NutriA" className="mx-auto h-32 w-44 object-contain" />

        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#dcebdd] text-[#246b55]">
              <Leaf size={26} />
            </div>
            <h1 className="text-2xl font-black text-[#173f34]">¡Tu cuenta está lista!</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ya puedes entrar a NutriA con tu correo y la contraseña que acabas de crear.
            </p>
            <Link to="/login" className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#718557]">Invitación de paciente</p>
              <h1 className="mt-2 text-2xl font-black text-[#173f34] sm:text-3xl">Crea tu contraseña</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Utilizarás esta contraseña junto con tu correo para entrar a NutriA.
              </p>
            </div>

            <form onSubmit={activarCuenta} className="mt-6 space-y-4">
              <PasswordField id="password" label="Nueva contraseña" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
              <PasswordField id="confirmation" label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} />

              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">{error}</div>}

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                {loading && <LoaderCircle size={17} className="animate-spin" />}
                {loading ? 'Activando...' : 'Crear contraseña'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function PasswordField({ id, label, value, onChange, visible, onToggle }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} minLength={8} required autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="w-full rounded-xl border border-[#d5e1db] bg-white px-4 py-3 pr-11 text-sm text-[#173f34] outline-none focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  )
}

export default ActivarCuentaPage
