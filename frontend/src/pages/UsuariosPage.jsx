import { useEffect, useState } from 'react'
import {
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
} from 'lucide-react'

import client from '../api/client'
import ListaUsuarios from '../components/usuarios/ListaUsuarios'
import { useAuth } from '../context/auth'

function UsuariosPage() {
  const { user } = useAuth()

  const [administradores, setAdministradores] = useState([])
  const [nutriologos, setNutriologos] = useState([])

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [formulario, setFormulario] = useState({
    name: '',
    email: '',
    role: 'nutritionist',
  })

  async function cargarUsuarios() {
    try {
      setLoading(true)
      setError('')

      const { data } = await client.get('/usuarios')

      setAdministradores(data.administradores || [])
      setNutriologos(data.nutriologos || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible cargar los usuarios',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  function cambiarCampo(event) {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  async function registrarUsuario(event) {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (
      !formulario.name.trim() ||
      !formulario.email.trim()
    ) {
      setError('Ingresa el nombre y correo del usuario')
      return
    }

    try {
      setGuardando(true)

      await client.post('/usuarios', {
        name: formulario.name.trim(),
        email: formulario.email.trim().toLowerCase(),
        role: formulario.role,
      })

      setFormulario({
        name: '',
        email: '',
        role: 'nutritionist',
      })

      setMostrarFormulario(false)

      setMensaje(
        formulario.role === 'admin'
          ? 'Administrador autorizado correctamente'
          : 'Nutriólogo autorizado correctamente',
      )

      await cargarUsuarios()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible autorizar al usuario',
      )
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(usuario) {
    try {
      setActualizandoId(usuario.id)
      setError('')
      setMensaje('')

      const nuevoEstado = !usuario.active

      await client.patch(
        `/usuarios/${usuario.id}/estado`,
        {
          active: nuevoEstado,
        },
      )

      setMensaje(
        nuevoEstado
          ? 'Acceso activado correctamente'
          : 'Acceso desactivado correctamente',
      )

      await cargarUsuarios()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible actualizar el acceso',
      )
    } finally {
      setActualizandoId(null)
    }
  }

  function obtenerEstado(usuario) {
    if (!usuario.active) {
      return {
        texto: 'Acceso desactivado',
        clase: 'text-slate-500',
      }
    }

    if (usuario.googleVerified) {
      return {
        texto: 'Verificado con Google',
        clase: 'text-emerald-700',
      }
    }

    return {
      texto: 'Pendiente de primer acceso',
      clase: 'text-amber-700',
    }
  }

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
            Administración
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
            Gestión de usuarios
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Autoriza las cuentas de Google que podrán acceder
            como administradores o nutriólogos a NutriA.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMostrarFormulario((actual) => !actual)
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d5947]"
        >
          <UserPlus size={18} />
          Autorizar nuevo usuario
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={registrarUsuario}
          className="mb-8 rounded-2xl border border-[#dfe8e3] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="font-extrabold text-[#173f34]">
                Nuevo usuario
              </h2>

              <p className="text-sm text-slate-500">
                Registra el correo de Google y selecciona su rol.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-[#29473e]"
              >
                Nombre completo
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formulario.name}
                onChange={cambiarCampo}
                placeholder="Ej. Ana López"
                className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 text-[#173f34] outline-none transition placeholder:text-slate-300 focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#29473e]"
              >
                Correo de Google
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={cambiarCampo}
                placeholder="usuario@gmail.com"
                className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 text-[#173f34] outline-none transition placeholder:text-slate-300 focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-bold text-[#29473e]"
              >
                Rol
              </label>

              <select
                id="role"
                name="role"
                value={formulario.role}
                onChange={cambiarCampo}
                className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 text-[#173f34] outline-none transition focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
              >
                <option value="nutritionist">
                  Nutriólogo
                </option>

                <option value="admin">
                  Administrador
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false)
                setError('')
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <LoaderCircle
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <UserPlus size={17} />
              )}

              {guardando
                ? 'Autorizando...'
                : 'Autorizar acceso'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw
            className="animate-spin"
            size={17}
          />

          Cargando usuarios...
        </div>
      ) : (
        <>
          <ListaUsuarios
            titulo="Administradores"
            descripcion="Usuarios encargados de gestionar el acceso del personal al sistema."
            usuarios={administradores}
            icono={ShieldCheck}
            usuarioActualId={user.id}
            actualizandoId={actualizandoId}
            obtenerEstado={obtenerEstado}
            onCambiarEstado={cambiarEstado}
          />

          <ListaUsuarios
            titulo="Nutriólogos"
            descripcion="Profesionales autorizados para gestionar pacientes y su información clínica."
            usuarios={nutriologos}
            icono={UserCog}
            usuarioActualId={user.id}
            actualizandoId={actualizandoId}
            obtenerEstado={obtenerEstado}
            onCambiarEstado={cambiarEstado}
          />
        </>
      )}
    </section>
  )
}

export default UsuariosPage
