import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserCog,
  UserPlus,
  XCircle,
} from 'lucide-react'

import client from '../api/client'

function UsuariosPage() {
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
  })

  async function cargarNutriologos() {
    try {
      setLoading(true)
      setError('')

      const { data } = await client.get(
        '/usuarios/nutriologos',
      )

      setNutriologos(data.nutriologos)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible cargar los nutriólogos',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarNutriologos()
  }, [])

  function cambiarCampo(event) {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  async function registrarNutriologo(event) {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (
      !formulario.name.trim() ||
      !formulario.email.trim()
    ) {
      setError(
        'Ingresa el nombre y correo del nutriólogo',
      )
      return
    }

    try {
      setGuardando(true)

      const { data } = await client.post(
        '/usuarios/nutriologos',
        {
          name: formulario.name.trim(),
          email: formulario.email
            .trim()
            .toLowerCase(),
        },
      )

      setNutriologos((actuales) => [
        data.nutriologo,
        ...actuales,
      ])

      setFormulario({
        name: '',
        email: '',
      })

      setMostrarFormulario(false)

      setMensaje(
        'Nutriólogo autorizado correctamente',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible autorizar al nutriólogo',
      )
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(nutriologo) {
    try {
      setActualizandoId(nutriologo.id)
      setError('')
      setMensaje('')

      const nuevoEstado = !nutriologo.active

      const { data } = await client.patch(
        `/usuarios/nutriologos/${nutriologo.id}/estado`,
        {
          active: nuevoEstado,
        },
      )

      setNutriologos((actuales) =>
        actuales.map((item) =>
          item.id === data.nutriologo.id
            ? data.nutriologo
            : item,
        ),
      )

      setMensaje(
        nuevoEstado
          ? 'Acceso del nutriólogo activado'
          : 'Acceso del nutriólogo desactivado',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible actualizar el acceso',
      )
    } finally {
      setActualizandoId(null)
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
            Gestión de nutriólogos
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Autoriza las cuentas de Google que podrán acceder
            como nutriólogos a NutriA.
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
          Autorizar nutriólogo
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
          onSubmit={registrarNutriologo}
          className="mb-7 rounded-2xl border border-[#dfe8e3] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="font-extrabold text-[#173f34]">
                Nuevo nutriólogo
              </h2>

              <p className="text-sm text-slate-500">
                Registra el correo de Google que tendrá
                acceso al sistema.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
                placeholder="nutriologo@gmail.com"
                className="w-full rounded-xl border border-[#d7e2dd] bg-white px-4 py-3 text-[#173f34] outline-none transition placeholder:text-slate-300 focus:border-[#4d816f] focus:ring-4 focus:ring-[#e8f3ee]"
              />
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
          Cargando nutriólogos...
        </div>
      ) : nutriologos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbdcd4] bg-white p-10 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
            <UserCog size={22} />
          </div>

          <h2 className="font-extrabold text-[#173f34]">
            No hay nutriólogos autorizados
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Autoriza el primer correo de Google para
            permitirle acceder a NutriA.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {nutriologos.map((nutriologo) => (
            <article
              key={nutriologo.id}
              className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_8px_30px_rgba(32,78,64,0.05)]"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f3ee] text-[#246b55]">
                    <UserCog size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-[#173f34]">
                      {nutriologo.name}
                    </h2>

                    <p className="truncate text-sm text-slate-500">
                      {nutriologo.email}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {nutriologo.active ? (
                        <>
                          <CheckCircle2
                            size={15}
                            className="text-emerald-600"
                          />

                          <span className="text-xs font-bold text-emerald-700">
                            Acceso activo
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle
                            size={15}
                            className="text-slate-400"
                          />

                          <span className="text-xs font-bold text-slate-500">
                            Acceso desactivado
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cambiarEstado(nutriologo)
                  }
                  disabled={
                    actualizandoId === nutriologo.id
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    nutriologo.active
                      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-[#246b55] text-white hover:bg-[#1d5947]'
                  }`}
                >
                  {actualizandoId ===
                  nutriologo.id ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={17}
                    />
                  ) : nutriologo.active ? (
                    <XCircle size={17} />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {nutriologo.active
                    ? 'Desactivar acceso'
                    : 'Activar acceso'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default UsuariosPage