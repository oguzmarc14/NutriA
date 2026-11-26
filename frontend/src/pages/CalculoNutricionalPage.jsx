import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, Calculator, Check, ChevronRight, ClipboardList, Save, UserRound, AlertCircle } from 'lucide-react'
import client from '../api/client'
import { usePacienteTrabajo } from '../context/pacienteTrabajo'
import ReferenciaCalculo, { fechaDeCalculo, fechaDeMedicion } from '../components/calculo/ReferenciaCalculo'
import ModalRequisitosPlan from '../components/planes/ModalRequisitosPlan'
import { evaluarRequisitosPlan } from '../utils/requisitosPlan.js'

const factores = [
  { value: '1.2', label: '1.20 · Sedentario' },
  { value: '1.375', label: '1.375 · Actividad ligera' },
  { value: '1.55', label: '1.55 · Actividad moderada' },
  { value: '1.725', label: '1.725 · Actividad alta' },
  { value: '1.9', label: '1.90 · Actividad muy alta' },
]
const factorPorNivel = { 1: '1.2', 2: '1.375', 3: '1.55', 4: '1.725', 5: '1.9' }
const actividadesPediatricas = {
  inactiva: ['Inactiva', 'Principalmente actividades cotidianas.'],
  ligera: ['Poco activa', 'Rutina con algo de movimiento adicional.'],
  activa: ['Activa', 'Rutina con actividad física regular.'],
  'muy-activa': ['Muy activa', 'Rutina con un volumen alto de actividad física.'],
}
const formato = valor => Number.isFinite(valor) ? Math.round(valor * 10) / 10 : '—'
const campo = 'w-full rounded-xl border border-[#c8ddd2] bg-white px-3 py-2.5 text-sm text-[#173f34] outline-none focus:border-[#4d816f] focus:ring-2 focus:ring-[#d7e8dc]'
const tarjeta = 'rounded-2xl border border-[#d2e3d8] bg-white/90 p-5 shadow-[0_8px_24px_rgba(31,72,57,.04)]'

export default function CalculoNutricionalPage() {
  const { pacienteTrabajo } = usePacienteTrabajo()
  const navigate = useNavigate()
  const location = useLocation()
  const volverAlPlan = Boolean(pacienteTrabajo?.id && location.state?.volverAlPlanPaciente === pacienteTrabajo.id)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const selectorMedicionRef = useRef(null)
  const [medicionId, setMedicionId] = useState('')
  const [sexo, setSexo] = useState('')
  const [factor, setFactor] = useState('1.2')
  const [actividadPediatrica, setActividadPediatrica] = useState('')
  const [ajuste, setAjuste] = useState('0')
  const [carbohidratos, setCarbohidratos] = useState('50')
  const [proteinas, setProteinas] = useState('20')
  const [grasas, setGrasas] = useState('30')
  const [observaciones, setObservaciones] = useState('')
  const [alertaRequisitos, setAlertaRequisitos] = useState(null)

  useEffect(() => {
    if (!pacienteTrabajo?.id) { setDatos(null); setMedicionId(''); setAlertaRequisitos(null); return }
    let activo = true
    setCargando(true); setError(''); setExito(''); setDatos(null); setMedicionId(''); setSexo(''); setAlertaRequisitos(null)
    client.get('/calculo-nutricional/' + pacienteTrabajo.id)
      .then(({ data }) => {
        if (!activo) return
        setDatos(data)
        const requisitos = evaluarRequisitosPlan({
          expediente: data.expediente,
          ultimaMedicion: data.mediciones?.[0] || null,
        })
        setAlertaRequisitos(requisitos.estado === 'incompleto'
          ? { pacienteId: pacienteTrabajo.id, tipo: requisitos.tipo }
          : null)
        setMedicionId(data.mediciones?.[0]?._id || '')
        if (['male', 'female'].includes(data.paciente?.sex)) setSexo(data.paciente.sex)
      })
      .catch(err => { if (activo) setError(err.response?.data?.message || 'No fue posible cargar los datos del paciente') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [pacienteTrabajo?.id])

  useEffect(() => {
    const seleccionada = datos?.mediciones?.find(item => item._id === medicionId)
    const sugerido = factorPorNivel[seleccionada?.nivelActividadFisica]
    if (sugerido) setFactor(sugerido)
  }, [datos?.mediciones, medicionId])

  const medicionReciente = datos?.mediciones?.[0]
  const calculoReciente = datos?.calculos?.[0]

  function recalcularConMedicionReciente() {
    setMedicionId(medicionReciente._id)
    selectorMedicionRef.current?.focus()
    selectorMedicionRef.current?.scrollIntoView({ block: 'center' })
  }

  const medicion = datos?.mediciones?.find(item => item._id === medicionId)
  const pediatrico = Boolean(medicion && medicion.edad < 19)
  useEffect(() => {
    setActividadPediatrica('')
    setCarbohidratos(pediatrico ? '' : '50')
    setProteinas(pediatrico ? '' : '20')
    setGrasas(pediatrico ? '' : '30')
  }, [pediatrico, pacienteTrabajo?.id])
  const resultado = useMemo(() => {
    if (!medicion || !sexo || medicion.edad < 19) return null
    const basal = 10 * medicion.peso + 6.25 * medicion.estatura * 100 - 5 * medicion.edad + (sexo === 'male' ? 5 : -161)
    const gasto = basal * Number(factor)
    const objetivo = gasto + Number(ajuste)
    if (!Number.isFinite(objetivo) || objetivo <= 0) return null
    return {
      basal, gasto, objetivo,
      carbohidratos: objetivo * Number(carbohidratos) / 400,
      proteinas: objetivo * Number(proteinas) / 400,
      grasas: objetivo * Number(grasas) / 900,
    }
  }, [medicion, sexo, factor, ajuste, carbohidratos, proteinas, grasas])

  const porcentajesValidos = [carbohidratos, proteinas, grasas].every(v => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100) && Math.abs(Number(carbohidratos) + Number(proteinas) + Number(grasas) - 100) < 0.001
  const valido = medicion?.edadCalculoValida !== false && porcentajesValidos && (pediatrico
    ? sexo && (medicion.edad < 3 || actividadPediatrica) && (medicion.edad > 0 || datos?.paciente?.birthDate)
    : resultado && Number(ajuste) >= -1000 && Number(ajuste) <= 1000)

  async function guardar(e) {
    e.preventDefault()
    if (!valido || !pacienteTrabajo?.id || !medicionId) return
    setGuardando(true); setError(''); setExito('')
    try {
      const { data } = await client.post('/calculo-nutricional/' + pacienteTrabajo.id, {
        medicionId, sexoCalculo: sexo, factorActividad: pediatrico ? 1 : Number(factor), ajusteKcal: pediatrico ? 0 : Number(ajuste),
        ...(pediatrico && medicion.edad >= 3 && { actividadPediatrica }),
        porcentajes: { carbohidratos: Number(carbohidratos), proteinas: Number(proteinas), grasas: Number(grasas) },
        observaciones,
      })
      setDatos(actual => ({ ...actual, calculos: [data.calculo, ...(actual?.calculos || [])] }))
      if (volverAlPlan) { navigate('/planes', { replace: true }); return }
      setExito('Cálculo guardado como borrador. Aún no es una prescripción ni se ha asignado un plan.')
    } catch (err) { setError(err.response?.data?.message || 'No fue posible guardar el cálculo') }
    finally { setGuardando(false) }
  }

  return <section className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-7 sm:px-5 md:px-8 md:py-9">
    <ModalRequisitosPlan
      contexto="calculo"
      tipo={!pacienteTrabajo?.id ? 'paciente' : alertaRequisitos?.pacienteId === pacienteTrabajo.id ? alertaRequisitos.tipo : null}
      onElegirPaciente={() => navigate('/pacientes?para=calculo-nutricional')}
      onCancelar={() => pacienteTrabajo?.id ? setAlertaRequisitos(null) : navigate('/')}
      onExpediente={() => {
        setAlertaRequisitos(null)
        navigate('/pacientes/' + encodeURIComponent(pacienteTrabajo.id) + '/expediente')
      }}
      onMediciones={() => {
        setAlertaRequisitos(null)
        navigate('/mediciones?paciente=' + encodeURIComponent(pacienteTrabajo.id))
      }}
    />
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#4d816f]">Motor nutricional · Etapa 1</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#173f34]">Cálculo nutricional</h1>
      <p className="mt-1 text-sm text-[#648073]">Calcula requerimientos a partir de las mediciones y guarda borradores verificables por paciente.</p>
    </div>
    {pacienteTrabajo?.id && <>
      <div className={tarjeta + ' flex flex-wrap items-center justify-between gap-3'}>
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e1f0e7] text-[#246b55]"><UserRound/></div>
          <div><p className="text-xs text-[#648073]">Paciente activo</p><h2 className="font-bold text-[#173f34]">{pacienteTrabajo.name}</h2></div></div>
        <span className="rounded-full bg-[#f0f5ef] px-3 py-1 text-xs font-semibold text-[#4d816f]">{pediatrico ? 'EER pediátrica · DRI 2023' : 'Mifflin-St Jeor · Adultos'}</span>
      </div>
      <ReferenciaCalculo calculo={calculoReciente} medicionReciente={medicionReciente}
        onRecalcular={recalcularConMedicionReciente}/>
      {datos && <div className={tarjeta + ' space-y-3'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-extrabold text-[#173f34]">Contexto del expediente clínico</h2>
          <p className="mt-1 text-xs text-[#648073]">Información registrada previamente para revisar antes de calcular.</p></div>
          <button type="button" onClick={() => navigate('/pacientes/' + pacienteTrabajo.id + '/expediente')} className="rounded-xl border border-[#c8ddd2] px-3 py-2 text-xs font-bold text-[#246b55] hover:bg-[#eef5f1]">Abrir expediente →</button>
        </div>
        {datos.expediente ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Objetivos de la dieta', (() => {
              const nutricion = datos.expediente.nutricion || {}
              const nombres = {
                perdida_peso: 'Pérdida de peso corporal',
                incremento_masa: 'Incremento de masa muscular',
                imagen_personal: 'Imagen personal',
                salud: 'Salud',
                rendimiento_deportivo: 'Rendimiento deportivo',
                control_enfermedades: 'Control de enfermedades',
                otro: nutricion.objetivoOtro?.trim() || 'Otro',
              }
              const objetivos = Array.isArray(nutricion.objetivos) && nutricion.objetivos.length
                ? nutricion.objetivos
                : nutricion.objetivoPrincipal ? [nutricion.objetivoPrincipal] : []
              return objetivos.map(valor => nombres[valor] || valor).join(' · ')
            })()],
            ['Alergias', datos.expediente.alergias],
            ['Intolerancias', datos.expediente.nutricion?.intoleranciasAlimentarias],
            ['Enfermedades', datos.expediente.enfermedades],
            ['Medicamentos', datos.expediente.medicamentos],
            ['Comidas al día', datos.expediente.nutricion?.numeroComidasDia],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f1f6f2] p-3">
            <p className="text-xs font-semibold text-[#648073]">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-[#173f34]">{value || 'No registrado'}</p>
          </div>)}
        </div> : <p className="text-sm text-amber-800">Este paciente aún no tiene expediente clínico registrado. Revísalo antes de diseñar un plan.</p>}
        <p className="text-xs text-[#648073]">Estos datos se consultan automáticamente, pero no sustituyen la revisión del nutriólogo ni modifican la ecuación sin su autorización.</p>
      </div>}
      {cargando && <p className="text-sm text-[#648073]">Cargando mediciones y cálculos...</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {exito && <p role="status" className="rounded-xl border border-[#b8dcc4] bg-[#ecf7ee] p-3 text-sm text-[#246b55]">{exito}</p>}
      {datos && !datos.mediciones?.length && <div className={tarjeta}>
        <h2 className="font-bold text-[#173f34]">Falta una medición</h2>
        <p className="mt-2 text-sm text-[#648073]">Registra peso, estatura, edad y actividad física antes de calcular.</p>
        <button onClick={() => navigate('/mediciones')} className="mt-4 rounded-xl bg-[#246b55] px-4 py-2 text-sm font-bold text-white">Ir a mediciones</button>
      </div>}
      {datos && !!datos.mediciones?.length && <form onSubmit={guardar} className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        <div className="space-y-5">
          <div className={tarjeta + ' space-y-4'}>
            <div className="flex items-center gap-2"><ClipboardList size={19} className="text-[#246b55]"/><h2 className="font-extrabold text-[#173f34]">Datos de evaluación</h2></div>
            <label className="block text-xs font-bold text-[#52716a]">Medición de referencia
              <select ref={selectorMedicionRef} className={campo + ' mt-2'} value={medicionId} onChange={e => setMedicionId(e.target.value)}>
                {datos.mediciones.map(m => <option key={m._id} value={m._id}>{fechaDeMedicion(m.fecha)} · {m.peso} kg · {m.edad} años</option>)}
              </select>
            </label>
            {medicion && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Peso', medicion.peso + ' kg'], ['Estatura', formato(medicion.estatura * 100) + ' cm'], ['Edad', medicion.edad + ' años'], ['Actividad registrada', 'Nivel ' + medicion.nivelActividadFisica]].map(([label, value]) =>
                <div key={label} className="rounded-xl bg-[#f1f6f2] p-3"><p className="text-xs text-[#648073]">{label}</p><p className="mt-1 font-bold text-[#173f34]">{value}</p></div>)}
            </div>}
            {medicion?.edadCalculoValida === false && <p role="alert" className="text-sm text-red-700">Revisa las fechas de nacimiento y medición para calcular la edad.</p>}
            {medicion?.fuenteEdadCalculo === 'edad registrada' && <p className="text-sm text-amber-800">Se usará la edad registrada porque faltan fechas para calcularla.</p>}
            {medicion?.edad < 19 && <p className="flex gap-2 text-sm text-amber-800"><AlertCircle size={18}/>Se usará EER · DRI 2023 según la edad al tomar la medición.</p>}
          </div>
          <div className={tarjeta + ' space-y-4'}>
            <div className="flex items-center gap-2"><Calculator size={19} className="text-[#246b55]"/><h2 className="font-extrabold text-[#173f34]">Parámetros del cálculo</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#52716a]">Ecuación <input className={campo + ' mt-2 bg-[#f1f6f2]'} value={pediatrico ? 'EER pediátrica · DRI 2023' : 'Mifflin-St Jeor'} disabled readOnly /></label>
              <label className="text-xs font-bold text-[#52716a]">Sexo utilizado en la ecuación
                <select required className={campo + ' mt-2'} value={sexo} onChange={e => setSexo(e.target.value)}>
                  <option value="">Seleccionar</option><option value="female">Femenino</option><option value="male">Masculino</option>
                </select>
              </label>
              {pediatrico && medicion.edad >= 3 && <fieldset className="min-w-0 sm:col-span-2" aria-describedby="actividad-ayuda" disabled={guardando}>
                <legend className="text-sm font-bold text-[#173f34]">Nivel de actividad física</legend>
                <p id="actividad-ayuda" className="mt-1 text-xs text-[#52716a]">Elige la categoría DRI 2023 que mejor describa la actividad habitual según tu valoración.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(actividadesPediatricas).map(([valor, [nombre, descripcion]], nivel) => (
                    <label key={valor} className="relative block cursor-pointer">
                      <input type="radio" name="actividadPediatrica" value={valor} required checked={actividadPediatrica === valor}
                        onChange={() => setActividadPediatrica(valor)} className="peer sr-only" />
                      <span className="flex h-full min-h-20 items-start gap-3 rounded-xl border border-[#c8ddd2] bg-white p-3 hover:border-[#4d816f] peer-checked:border-[#216955] peer-checked:bg-[#e6f2eb] peer-focus-visible:ring-2 peer-focus-visible:ring-[#216955] peer-focus-visible:ring-offset-2 peer-disabled:opacity-60">
                        <span className="shrink-0 rounded-lg bg-[#eff6f1] p-2 text-[#246b55]" aria-hidden="true">
                          {actividadPediatrica === valor ? <Check size={18} /> : <Activity size={18} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-[#52716a]">Nivel {nivel + 1}</span>
                          <span className="block text-sm font-bold text-[#173f34]">{nombre}</span>
                          <span className="block text-xs leading-relaxed text-[#52716a]">{descripcion}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>}
              {!pediatrico && <><label className="text-xs font-bold text-[#52716a]">Factor de actividad · sugerido según la medición
                <select className={campo + ' mt-2'} value={factor} onChange={e => setFactor(e.target.value)}>
                  {factores.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-[#52716a]">Ajuste energético (kcal/día)
                <input type="number" required min="-1000" max="1000" step="25" className={campo + ' mt-2'} value={ajuste} onChange={e => setAjuste(e.target.value)}/>
              </label>
              </>}
            </div>
            <p className="text-xs leading-relaxed text-[#648073]">{pediatrico
              ? 'Selecciona la distribución de macronutrientes según la edad y la valoración clínica. Para menores de un año, registra la fecha de nacimiento para usar la edad en meses.'
              : 'Confirma el factor de actividad y el sexo de la ecuación. El ajuste es manual y requiere criterio clínico.'}</p>
            <h3 className="font-bold text-[#173f34]">Distribución de macronutrientes</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[[ 'Carbohidratos', carbohidratos, setCarbohidratos ],[ 'Proteínas', proteinas, setProteinas ],[ 'Grasas', grasas, setGrasas ]].map(([label, value, set]) =>
                <label key={label} className="text-xs font-bold text-[#52716a]">{label} (%)
                  <input type="number" min="0" max="100" step="1" required value={value} onChange={e => set(e.target.value)} className={campo + ' mt-2'}/>
                </label>)}
            </div>
            <p className={'text-xs font-semibold ' + (porcentajesValidos ? 'text-[#246b55]' : 'text-amber-700')}>Total: {Number(carbohidratos) + Number(proteinas) + Number(grasas)}% · Debe sumar 100%</p>
            <label className="block text-xs font-bold text-[#52716a]">Notas clínicas (opcional)
              <textarea maxLength={1000} rows={3} className={campo + ' mt-2'} value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Justificación del ajuste, consideraciones y seguimiento..."/>
            </label>
          </div>
        </div>
        <div className="space-y-5">
          <div className={tarjeta + ' space-y-4 xl:sticky xl:top-20'}>
            <div className="flex items-center gap-2"><Activity size={19} className="text-[#246b55]"/><h2 className="font-extrabold text-[#173f34]">Resultados estimados</h2></div>
            {pediatrico ? <p className="text-sm text-[#648073]">Al guardar el borrador, NutriA calculará la estimación pediátrica. Puedes revisar el resultado en el historial.</p> : resultado ? <>
              <div className="grid grid-cols-2 gap-3">
                {[[ 'Metabolismo basal', resultado.basal ],[ 'Gasto total', resultado.gasto ],[ 'Objetivo energético', resultado.objetivo ]].map(([label, valor]) =>
                  <div key={label} className="rounded-xl bg-[#f1f6f2] p-3"><p className="text-xs text-[#648073]">{label}</p><p className="mt-1 text-xl font-extrabold text-[#173f34]">{formato(valor)} <span className="text-xs font-medium">kcal</span></p></div>)}
              </div>
              <div className="grid grid-cols-3 gap-2">{[[ 'Carbs', resultado.carbohidratos, 4 ],[ 'Proteína', resultado.proteinas, 4 ],[ 'Grasas', resultado.grasas, 9 ]].map(([label, valor, kcalPorGramo]) =>
                <div key={label} className="rounded-xl border border-[#d2e3d8] p-2 text-center"><p className="text-xs text-[#648073]">{label}</p><p className="mt-1 font-bold text-[#173f34]">{formato(valor)} g</p><p className="mt-1 text-xs font-medium text-[#648073]">{formato(valor * kcalPorGramo)} kcal</p></div>)}</div>
            </> : <p className="text-sm text-[#648073]">Completa los datos para visualizar el cálculo.</p>}
            <button type="submit" disabled={!valido || guardando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173f34] disabled:cursor-not-allowed disabled:opacity-40"><Save size={17}/>{guardando ? 'Guardando...' : 'Guardar borrador'}</button>
            <p className="text-xs leading-relaxed text-[#648073]">Los resultados son estimaciones para revisión profesional. No constituyen una dieta aprobada ni incluyen todavía equivalentes SMAE.</p>
          </div>
        </div>
      </form>}
      {datos && <div className={tarjeta}>
        <h2 className="mb-3 font-extrabold text-[#173f34]">Historial de cálculos</h2>
        {!datos.calculos?.length ? <p className="text-sm text-[#648073]">Aún no hay cálculos guardados.</p> :
          <div className="space-y-2">{datos.calculos.map(c => <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e0eae3] bg-[#f7faf7] px-4 py-3">
            <div><p className="text-sm font-bold text-[#173f34]">{formato(c.resultado?.objetivoKcal)} kcal/día · Borrador</p><p className="text-xs text-[#648073]">Guardado: {fechaDeCalculo(c.createdAt)} · {c.formula === 'eer-dri-2023' ? 'EER pediátrica · DRI 2023' : 'Mifflin-St Jeor'}</p><p className="text-xs text-[#648073]">Medición: {fechaDeMedicion(c.fechaMedicion)} · {c.peso} kg</p>
              {c.detalleFormula?.ecuacion && <div className="mt-2 space-y-1 text-xs text-[#315d4b]">
                <p className="font-semibold">{c.detalleFormula.ecuacion}</p>
                <p>{c.detalleFormula.rangoEdad} · {c.sexoCalculo === 'female' ? 'Femenino' : 'Masculino'} · {actividadesPediatricas[c.actividadPediatrica]?.[0] || 'Actividad según edad'}</p>
                <p>Edad usada {Number(c.detalleFormula.edadAnios.toFixed(4))} años ({c.detalleFormula.fuenteEdad}) · Talla {formato(c.estaturaCm)} cm</p>
              </div>}
            </div>
            <span className="text-xs text-[#648073]">C {c.porcentajes?.carbohidratos}% · P {c.porcentajes?.proteinas}% · G {c.porcentajes?.grasas}%</span>
          </div>)}</div>}
        <button type="button" onClick={() => navigate('/planes')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#246b55] hover:underline">Ir a planes alimenticios <ChevronRight size={16}/></button>
        <p className="mt-2 text-xs text-[#648073]">La integración automática con equivalentes y planes alimenticios se desarrollará en la siguiente etapa.</p>
      </div>}
    </>}
  </section>
}
