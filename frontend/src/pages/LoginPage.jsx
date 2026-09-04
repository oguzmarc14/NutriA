import { zodResolver } from '@hookform/resolvers/zod'
import { Apple, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../context/auth'

const schema = z.object({
  email: z.string().trim().email('Ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

function LoginPage() {
  const { login, user } = useAuth()
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  async function onSubmit(values) {
    setApiError('')

    try {
      await login(values)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) {
      setApiError(error.response?.data?.message || 'No fue posible iniciar sesión')
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f6f8f6] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden overflow-hidden bg-[#173f34] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <Apple size={22} />
          </div>
          <span className="text-2xl font-extrabold">NutriA</span>
        </div>

        <div className="max-w-xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-[#9bc6b6]">
            Gestión nutricional inteligente
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight">
            El progreso de tus pacientes, claro y organizado.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#c8ddd5]">
            Centraliza expedientes, mediciones y planes alimenticios en una plataforma diseñada para nutriólogos.
          </p>
        </div>

        <p className="text-sm text-[#9bc6b6]">NutriA · MVP académico 2026</p>
      </section>

      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#246b55] text-white">
              <Apple size={22} />
            </div>
            <span className="text-2xl font-extrabold text-[#173f34]">NutriA</span>
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
            Bienvenido
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
            Inicia sesión
          </h2>
          <p className="mt-2 text-slate-500">Accede a tu espacio de trabajo nutricional.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#29473e]" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nutriologo@nutria.mx"
                className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 text-[#173f34] outline-none transition placeholder:text-slate-300 focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
                {...register('email')}
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#29473e]" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 pr-12 text-[#173f34] outline-none transition placeholder:text-slate-300 focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {apiError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 font-bold text-white shadow-lg shadow-[#246b55]/15 transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <LoaderCircle className="animate-spin" size={19} />}
              {isSubmitting ? 'Ingresando…' : 'Ingresar a NutriA'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
