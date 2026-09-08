import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  XCircle,
} from 'lucide-react'

import client from '../api/client'
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

  function ListaUsuarios({
    titulo,
    descripcion,
    usuarios,
    icono: Icono,
  }) {
    return (
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-[#173f34]">
            {titulo}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {descripcion}
          </p>
        </div>

        {usuarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbdcd4] bg-white p-8 text-center">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
              <Icono size={21} />
            </div>

            <p className="font-bold text-[#173f34]">
              No hay usuarios registrados
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {usuarios.map((usuario) => {
              const estado = obtenerEstado(usuario)
              const esUsuarioActual = usuario.id === user.id

              return (
                <article
                  key={usuario.id}
                  className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                        <Icono size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-[#173f34]">
                            {usuario.name}
                          </h3>

                          {esUsuarioActual && (
                            <span className="rounded-full bg-[#e8f3ee] px-2 py-0.5 text-[11px] font-bold text-[#246b55]">
                              Tú
                            </span>
                          )}
                        </div>

                        <p className="truncate text-sm text-slate-500">
                          {usuario.email}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          {usuario.active ? (
                            <CheckCircle2
                              size={15}
                              className={estado.clase}
                            />
                          ) : (
                            <XCircle
                              size={15}
                              className="text-slate-400"
                            />
                          )}

                          <span
                            className={`text-xs font-bold ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => cambiarEstado(usuario)}
                      disabled={
                        actualizandoId === usuario.id ||
                        esUsuarioActual
                      }
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        usuario.active
                          ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-[#246b55] text-white hover:bg-[#1d5947]'
                      }`}
                    >
                      {actualizandoId === usuario.id ? (
                        <LoaderCircle
                          className="animate-spin"
                          size={17}
                        />
                      ) : usuario.active ? (
                        <XCircle size={17} />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}

                      {esUsuarioActual
                        ? 'Tu cuenta'
                        : usuario.active
                          ? 'Desactivar acceso'
                          : 'Activar acceso'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    )
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
          />

          <ListaUsuarios
            titulo="Nutriólogos"
            descripcion="Profesionales autorizados para gestionar pacientes y su información clínica."
            usuarios={nutriologos}
            icono={UserCog}
          />
        </>
      )}
    </section>
  )
}

export default UsuariosPage