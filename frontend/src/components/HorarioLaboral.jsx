import { useEffect, useState } from 'react'
import { CalendarDays, CalendarOff, Clock3, Plus, Save, Trash2 } from 'lucide-react'
import client from '../api/client'
import './horarioLaboral.css'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const inicial = {
  dias: [1, 2, 3, 4, 5],
  inicio: '09:00',
  fin: '18:00',
  zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City',
  diasNoLaborables: [],
}

export default function HorarioLaboral({ primerIngreso = false, onSaved }) {
  const [form, setForm] = useState(inicial)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoMotivo, setNuevoMotivo] = useState('')

  useEffect(() => {
    let active = true
    client.get('/horario').then(({data}) => {
      if (active && data.horario?.configurado) {
        setForm({
          dias: data.horario.dias,
          inicio: data.horario.inicio,
          fin: data.horario.fin,
          zonaHoraria: data.horario.zonaHoraria,
          diasNoLaborables: (data.horario.diasNoLaborables || []).map(d => ({
            fecha:d.fecha, motivo:d.motivo || '',
          })),
        })
      }
    }).catch(() => {
      if (active) setError('No fue posible cargar tu horario.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  function toggle(dia) {
    setForm(actual => ({
      ...actual,
      dias: actual.dias.includes(dia)
        ? actual.dias.filter(d => d !== dia)
        : [...actual.dias, dia].sort(),
    }))
    setSuccess('')
  }

  function agregarFecha() {
    setError('')
    setSuccess('')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
      setError('Selecciona una fecha válida para el día no laborable.')
      return
    }
    if (form.diasNoLaborables.some(d => d.fecha === nuevaFecha)) {
      setError('Ese día ya está marcado como no laborable.')
      return
    }
    if (form.diasNoLaborables.length >= 100) {
      setError('Puedes guardar un máximo de 100 fechas no laborables.')
      return
    }
    setForm(actual => ({
      ...actual,
      diasNoLaborables: [
        ...actual.diasNoLaborables,
        { fecha: nuevaFecha, motivo: nuevoMotivo.trim().slice(0,80) },
      ].sort((a,b) => a.fecha.localeCompare(b.fecha)),
    }))
    setNuevaFecha('')
    setNuevoMotivo('')
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.dias.length) {
      setError('Selecciona al menos un día laboral.')
      return
    }
    if (form.fin <= form.inicio) {
      setError('La hora de salida debe ser posterior a la de entrada.')
      return
    }
    setSaving(true)
    try {
      const {data} = await client.put('/horario', form)
      setSuccess('Tu horario y los días no laborables se guardaron correctamente.')
      window.dispatchEvent(new CustomEvent('nutria-horario-actualizado', { detail:data.horario }))
      onSaved?.(data.horario)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar tu horario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="horario-laboral" className="nutria-horario-panel rounded-[26px] border p-4 shadow-sm sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="nutria-horario-icon grid size-12 shrink-0 place-items-center rounded-2xl">
          <CalendarDays size={24} aria-hidden="true"/>
        </span>
        <div>
          <h2 className="text-xl font-black">
            {primerIngreso ? '¡Bienvenido! Configura tu agenda' : 'Mis días y horas de trabajo'}
          </h2>
          <p className="nutria-horario-muted mt-1 text-sm leading-relaxed">
            Define qué días atiendes, tu horario general y tus descansos especiales.
          </p>
        </div>
      </div>

      {loading ? (
        <p role="status" className="nutria-horario-muted text-sm">Cargando horario…</p>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <fieldset>
            <legend className="mb-3 text-sm font-extrabold">Días de atención</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIAS.map((dia,i) => (
                <label key={dia}
                  className={'nutria-horario-dia flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-bold sm:text-sm ' +
                    (form.dias.includes(i) ? 'nutria-horario-dia--on' : '')}>
                  <input type="checkbox" checked={form.dias.includes(i)}
                    onChange={() => toggle(i)} className="accent-[#246b55]"/>
                  {dia}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              <span className="flex items-center gap-2"><Clock3 size={16}/>Hora de entrada</span>
              <input required type="time" value={form.inicio}
                onChange={e => setForm(f => ({...f,inicio:e.target.value}))}
                className="nutria-horario-input min-w-0 rounded-xl border p-3"/>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Hora de salida
              <input required type="time" value={form.fin}
                onChange={e => setForm(f => ({...f,fin:e.target.value}))}
                className="nutria-horario-input min-w-0 rounded-xl border p-3"/>
            </label>
          </div>
          <p className="nutria-horario-muted text-xs">
            Zona horaria: {form.zonaHoraria}. Las consultas deben finalizar antes de la hora de salida.
          </p>

          {!primerIngreso && (
            <section id="dias-no-laborables" className="nutria-horario-excepciones rounded-2xl border p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <CalendarOff size={21} className="mt-0.5 shrink-0" aria-hidden="true"/>
                <div>
                  <h3 className="text-base font-extrabold">Días no laborables y vacaciones</h3>
                  <p className="nutria-horario-muted mt-1 text-xs leading-relaxed">
                    Agrega festivos, vacaciones o cierres especiales. Esas fechas dejarán de aparecer como disponibles para nuevas citas.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-bold">
                  Fecha
                  <input type="date" value={nuevaFecha}
                    onChange={e => setNuevaFecha(e.target.value)}
                    className="nutria-horario-input min-h-11 min-w-0 rounded-xl border p-3 text-sm"/>
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Motivo (opcional)
                  <input type="text" maxLength={80} value={nuevoMotivo}
                    onChange={e => setNuevoMotivo(e.target.value)}
                    placeholder="Festivo, vacaciones, descanso..."
                    className="nutria-horario-input min-h-11 min-w-0 rounded-xl border p-3 text-sm"/>
                </label>
                <button type="button" onClick={agregarFecha}
                  className="nutria-horario-secondary flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-extrabold">
                  <Plus size={16}/>Agregar
                </button>
              </div>
              {form.diasNoLaborables.length > 0 ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {form.diasNoLaborables.map(item => (
                    <li key={item.fecha}
                      className="nutria-horario-excepcion flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold">{item.fecha}</p>
                        {item.motivo && <p className="nutria-horario-muted mt-1 break-words text-xs">{item.motivo}</p>}
                      </div>
                      <button type="button"
                        onClick={() => { setForm(f => ({
                          ...f,diasNoLaborables:f.diasNoLaborables.filter(d => d.fecha !== item.fecha),
                        }));setSuccess('') }}
                        title={'Quitar el día no laborable ' + item.fecha}
                        aria-label={'Quitar día no laborable ' + item.fecha}
                        className="nutria-horario-secondary grid size-10 shrink-0 place-items-center rounded-xl border">
                        <Trash2 size={16}/>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="nutria-horario-muted mt-3 text-xs">Aún no has añadido fechas no laborables.</p>
              )}
              <p className="nutria-horario-muted mt-3 text-[11px] leading-relaxed">
                Las citas ya registradas en esos días no se borran ni se cancelan automáticamente. Revísalas en Ver citas si necesitas reprogramarlas.
              </p>
            </section>
          )}

          {error && <p role="alert" className="nutria-horario-error rounded-xl border p-3 text-sm font-semibold">{error}</p>}
          {success && <p role="status" className="nutria-horario-success rounded-xl p-3 text-sm font-semibold">{success}</p>}
          <button type="submit" disabled={saving}
            className="nutria-horario-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold disabled:opacity-60">
            <Save size={18}/>{saving ? 'Guardando…' : 'Guardar mi horario'}
          </button>
        </form>
      )}
    </section>
  )
}
