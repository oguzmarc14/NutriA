import { useEffect, useState } from 'react'
import {
  RefreshCw,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import client from '../api/client'

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarUsuarios() {
    try {
      setLoading(true)
      setError('')

      const { data } = await client.get('/usuarios')
      setUsuarios(data.usuarios)
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

  async function cambiarRol(usuarioId, role) {
    try {
      setActualizandoId(usuarioId)
      setError('')
      setMensaje('')

      const { data } = await client.put(
        `/usuarios/${usuarioId}/rol`,
        { role },
      )

      setUsuarios((actuales) =>
        actuales.map((usuario) =>
          usuario._id === data.usuario._id
            ? data.usuario
            : usuario,
        ),
      )

      setMensaje('Rol actualizado correctamente')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible actualizar el rol',
      )

      await cargarUsuarios()
    } finally {
      setActualizandoId(null)
    }
  }

  function obtenerNombreRol(role) {
    const roles = {
      admin: 'Administrador',
      nutritionist: 'Nutriólogo',
      patient: 'Paciente',
    }

    return roles[role] || role
  }

  return (
    <section className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4d816f]">
          Administración
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#173f34]">
          Gestión de usuarios
        </h1>

        <p className="mt-2 text-slate-500">
          Consulta los usuarios registrados y administra sus roles.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {mensaje}
        </div>
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
        <div className="grid gap-4">
          {usuarios.map((usuario) => (
            <article
              key={usuario._id}
              className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                    {usuario.role === 'admin' ? (
                      <ShieldCheck size={21} />
                    ) : (
                      <UserCog size={21} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-[#173f34]">
                      {usuario.name}
                    </h2>

                    <p className="truncate text-sm text-slate-500">
                      {usuario.email}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#4d816f]">
                      Rol actual: {obtenerNombreRol(usuario.role)}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-56">
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Cambiar rol
                    </span>

                    <select
                      value={usuario.role}
                      onChange={(event) =>
                        cambiarRol(
                          usuario._id,
                          event.target.value,
                        )
                      }
                      disabled={actualizandoId === usuario._id}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4d816f] disabled:opacity-60"
                    >
                      <option value="admin">
                        Administrador
                      </option>

                      <option value="nutritionist">
                        Nutriólogo
                      </option>

                      <option value="patient">
                        Paciente
                      </option>
                    </select>
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default UsuariosPage