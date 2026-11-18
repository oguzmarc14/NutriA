import {useCallback,useEffect,useMemo,useState} from 'react'
import {BadgeCheck, Banknote, CalendarDays, CheckCircle2, ClipboardList, LoaderCircle, RefreshCw, ShieldCheck, Wallet, XCircle} from 'lucide-react'
import client from '../api/client'
import {useAuth} from '../context/auth'
import './pagos.css'

const metodos=[
  {value:'transferencia',label:'Transferencia bancaria'},
  {value:'deposito',label:'Depósito'},
  {value:'efectivo',label:'Efectivo'},
  {value:'otro',label:'Otro método externo'},
]
const estados={
  reportado:{label:'Por verificar',className:'nutria-pago-reportado'},
  confirmado:{label:'Confirmado por el nutriólogo',className:'nutria-pago-confirmado'},
  rechazado:{label:'No confirmado',className:'nutria-pago-rechazado'},
}
const hoyLocal=()=>{
  const fecha=new Date()
  return new Date(fecha.getTime()-fecha.getTimezoneOffset()*60000).toISOString().slice(0,10)
}
const moneda = cents => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((Number(cents)||0)/100)
const fechaTexto = fecha => {
  if(!fecha)return 'Fecha no disponible'
  try{return new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(fecha))}
  catch{return 'Fecha no disponible'}
}
function CardPago({pago,puedeRevisar,guardando,onRevisar}){
  const estado=estados[pago.estado]||estados.reportado
  return <article className="nutria-pagos-card min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-base font-black">{pago.concepto||'Consulta nutricional'}</p>
        <p className="mt-2 text-2xl font-black tabular-nums">{moneda(pago.montoCentavos)}</p>
        <p className="mt-1 text-xs opacity-75">Importe reportado · MXN</p>
      </div>
      <span className={'nutria-pago-estado inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold '+estado.className}>
        {pago.estado==='confirmado'?<BadgeCheck size={15}/>:<ClipboardList size={15}/>}
        {estado.label}
      </span>
    </div>
    <dl className="mt-4 grid min-w-0 gap-2 text-xs sm:grid-cols-2">
      <div className="flex items-start gap-2"><CalendarDays size={16} className="shrink-0"/><span>Fecha: <strong>{fechaTexto(pago.fechaPago)}</strong></span></div>
      <div className="flex items-start gap-2"><Banknote size={16} className="shrink-0"/><span>Método: <strong>{metodos.find(x=>x.value===pago.metodo)?.label||'Otro'}</strong></span></div>
      {pago.referencia&&<div className="sm:col-span-2 break-all">Referencia: <strong>{pago.referencia}</strong></div>}
    </dl>
    {puedeRevisar&&pago.estado==='reportado'&&<div className="mt-4 flex flex-wrap items-center justify-start gap-2 border-t border-current/10 pt-4">
      <button type="button" disabled={guardando} onClick={()=>onRevisar(pago,'confirmado')}
        className="nutria-pago-aprobar inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold disabled:opacity-50">
        <CheckCircle2 size={16}/>Confirmar recepción
      </button>
      <button type="button" disabled={guardando} onClick={()=>onRevisar(pago,'rechazado')}
        className="nutria-pago-rechazar inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold disabled:opacity-50">
        <XCircle size={16}/>No confirmar
      </button>
    </div>}
  </article>
}
export default function PagosPage(){
  const {user}=useAuth()
  const paciente=user?.role==='patient'
  const nutricionista=user?.role==='nutritionist'
  const [pacientes,setPacientes]=useState([])
  const [pacienteId,setPacienteId]=useState('')
  const [pagos,setPagos]=useState([])
  const [cargando,setCargando]=useState(true)
  const [guardando,setGuardando]=useState(false)
  const [error,setError]=useState('')
  const [mensaje,setMensaje]=useState('')
  const [monto,setMonto]=useState('')
  const [metodo,setMetodo]=useState('transferencia')
  const [fecha,setFecha]=useState(hoyLocal)
  const [referencia,setReferencia]=useState('')
  const [concepto,setConcepto]=useState('Consulta nutricional')
  const [revisar,setRevisar]=useState(null)
  const [revisando,setRevisando]=useState(false)
  useEffect(()=>{
    if(!nutricionista)return
    let activo=true
    client.get('/pacientes').then(({data})=>{
      if(!activo)return
      const lista=data.pacientes||[]
      setPacientes(lista)
      setPacienteId(prev=>prev||lista[0]?._id||'')
    }).catch(err=>{if(activo)setError(err.response?.data?.message||'No fue posible consultar los pacientes.')})
    return()=>{activo=false}
  },[nutricionista])
  const cargar=useCallback(async()=>{
    if(nutricionista&&!pacienteId){setCargando(false);setPagos([]);return}
    setCargando(true)
    try{
      const {data}=paciente
        ?await client.get('/pagos/mios')
        :await client.get('/pagos/consultorio',{params:{pacienteId}})
      setPagos(data.pagos||[])
      setError('')
    }catch(err){setError(err.response?.data?.message||'No fue posible cargar los pagos.')}
    finally{setCargando(false)}
  },[paciente,nutricionista,pacienteId])
  useEffect(()=>{cargar()},[cargar])
  async function registrar(event){
    event.preventDefault()
    if(guardando)return
    setError('');setMensaje('')
    const importe=Number(monto)
    if(!Number.isFinite(importe)||importe<=0||importe>100000||Math.round(importe*100)/100!==importe){
      setError('Ingresa un importe positivo de hasta 100,000 MXN, con dos decimales como máximo.')
      return
    }
    if(!fecha||fecha>hoyLocal()){setError('La fecha debe ser válida y no estar en el futuro.');return}
    setGuardando(true)
    try{
      const {data}=await client.post('/pagos/mios',{
        monto:importe,metodo,fechaPago:fecha,referencia:referencia.trim(),concepto:concepto.trim(),
      })
      setMonto('');setReferencia('')
      setMensaje(data.message||'Pago registrado como reportado.')
      await cargar()
    }catch(err){setError(err.response?.data?.message||'No se pudo registrar el pago.')}
    finally{setGuardando(false)}
  }
  async function confirmarRevision(){
    if(!revisar||revisando)return
    setRevisando(true);setError('');setMensaje('')
    try{
      const {data}=await client.patch('/pagos/consultorio/'+encodeURIComponent(revisar.pago._id)+'/estado',{estado:revisar.estado})
      setMensaje(data.message||'Estado actualizado.')
      setRevisar(null)
      await cargar()
    }catch(err){setError(err.response?.data?.message||'No se pudo revisar este pago.');setRevisar(null)}
    finally{setRevisando(false)}
  }
  const pendientes=useMemo(()=>pagos.filter(p=>p.estado==='reportado').length,[pagos])
  if(!paciente&&!nutricionista)return null
  return <main className="nutria-pagos mx-auto w-full min-w-0 max-w-5xl space-y-5 p-4 pb-28 sm:p-7">
    <header className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wider opacity-65">NutriA · Administración</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex min-w-0 items-center gap-3 text-2xl font-black sm:text-3xl"><Wallet size={27}/> {paciente?'Mis pagos':'Pagos de pacientes'}</h1>
        <button type="button" onClick={cargar} disabled={cargando} className="nutria-pagos-boton inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold disabled:opacity-50">
          <RefreshCw size={16}/>Actualizar
        </button>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75">
        {paciente?'Registra un pago que ya realizaste fuera de NutriA y consulta si tu nutriólogo lo confirmó.':
          'Revisa los pagos que tus pacientes informaron y confirma únicamente el dinero recibido.'}
      </p>
    </header>
    <section className="nutria-pagos-nota flex min-w-0 gap-3 rounded-2xl border p-4 text-sm leading-6">
      <ShieldCheck size={22} className="mt-0.5 shrink-0"/>
      <p><strong>Importante:</strong> NutriA no cobra ni procesa dinero. Los registros son declaraciones de pagos externos; un pago <strong>por verificar</strong> no significa que el consultorio haya recibido el importe. No escribas números completos de tarjetas ni datos bancarios privados.</p>
    </section>
    {paciente&&<section className="nutria-pagos-card rounded-3xl border p-4 sm:p-6">
      <h2 className="text-lg font-black">Registrar pago realizado</h2>
      <p className="mt-1 text-xs opacity-75">El registro se enviará como «Por verificar».</p>
      <form onSubmit={registrar} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-bold">Importe en MXN
          <input type="number" step="0.01" min="0.01" max="100000" required value={monto} onChange={e=>setMonto(e.target.value)}
            placeholder="Ej. 350.00" className="nutria-pagos-input mt-2 min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm"/>
        </label>
        <label className="block min-w-0 text-sm font-bold">Método de pago
          <select value={metodo} onChange={e=>setMetodo(e.target.value)}
            className="nutria-pagos-input mt-2 min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm">
            {metodos.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-sm font-bold">Fecha en que pagaste
          <input type="date" value={fecha} max={hoyLocal()} required onChange={e=>setFecha(e.target.value)}
            className="nutria-pagos-input mt-2 min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm"/>
        </label>
        <label className="block min-w-0 text-sm font-bold">Referencia (opcional)
          <input type="text" value={referencia} maxLength={80} onChange={e=>setReferencia(e.target.value)}
            placeholder="Ej. Folio de transferencia" className="nutria-pagos-input mt-2 min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm"/>
        </label>
        <label className="block min-w-0 text-sm font-bold sm:col-span-2">Concepto
          <input type="text" minLength={2} maxLength={120} required value={concepto} onChange={e=>setConcepto(e.target.value)}
            className="nutria-pagos-input mt-2 min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm"/>
        </label>
        <button type="submit" disabled={guardando}
          className="nutria-pago-aprobar inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold disabled:opacity-50 sm:col-span-2 sm:justify-self-end">
          {guardando?<LoaderCircle size={17} className="animate-spin"/>:<Banknote size={17}/>}
          {guardando?'Guardando…':'Reportar pago'}
        </button>
      </form>
    </section>}
    {nutricionista&&<section className="nutria-pagos-card rounded-2xl border p-4">
      <label className="block text-sm font-black" htmlFor="paciente-pagos">Seleccionar paciente</label>
      <select id="paciente-pagos" value={pacienteId} onChange={e=>{setPacienteId(e.target.value);setMensaje('')}}
        className="nutria-pagos-input mt-2 min-h-11 w-full max-w-xl rounded-xl border px-3 text-sm">
        {pacientes.length===0&&<option value="">No hay pacientes registrados</option>}
        {pacientes.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
      </select>
    </section>}
    {mensaje&&<p role="status" className="nutria-pagos-exito rounded-xl border p-4 text-sm font-semibold">{mensaje}</p>}
    {error&&<p role="alert" className="nutria-pagos-error rounded-xl border p-4 text-sm">{error}</p>}
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-black">{paciente?'Historial de pagos':'Pagos reportados'}</h2>
        {!cargando&&<span className="text-xs font-bold opacity-70">{pagos.length} registros · {pendientes} por verificar</span>}
      </div>
      {cargando?<div role="status" className="nutria-pagos-card rounded-2xl border p-5 text-sm">Cargando pagos…</div>:
        pagos.length===0?<div className="nutria-pagos-card rounded-2xl border p-6 text-center text-sm opacity-75">Aún no hay pagos registrados para este paciente.</div>:
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {pagos.map(p=><CardPago key={p._id} pago={p} puedeRevisar={nutricionista} guardando={revisando}
            onRevisar={(pago,estado)=>setRevisar({pago,estado})}/>)}
        </div>}
    </section>
    {revisar&&<div className="nutria-pagos-overlay fixed inset-0 z-[240] grid place-items-center p-4" onMouseDown={e=>{if(e.target===e.currentTarget&&!revisando)setRevisar(null)}}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="revision-pago-titulo" className="nutria-pagos-card w-full max-w-md rounded-3xl border p-5 text-center shadow-2xl sm:p-7">
        <ShieldCheck size={30} className="mx-auto"/>
        <h2 id="revision-pago-titulo" className="mt-3 text-xl font-black">{revisar.estado==='confirmado'?'¿Confirmas que recibiste este pago?':'¿Marcar reporte como no confirmado?'}</h2>
        <p className="mt-3 text-sm leading-6 opacity-75">{moneda(revisar.pago.montoCentavos)} · Este cambio quedará registrado y no se podrá revertir desde este formulario.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={()=>setRevisar(null)} disabled={revisando}
            className="nutria-pagos-boton inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Volver</button>
          <button type="button" onClick={confirmarRevision} disabled={revisando}
            className="nutria-pago-aprobar inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50">
            {revisando?<LoaderCircle size={16} className="animate-spin"/>:revisar.estado==='confirmado'?<CheckCircle2 size={16}/>:<XCircle size={16}/>}
            {revisando?'Guardando…':'Sí, actualizar'}
          </button>
        </div>
      </section>
    </div>}
  </main>
}
