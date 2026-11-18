const mongoose=require('mongoose')
const {z}=require('zod')
const Paciente=require('../models/Pacientes')
const Pago=require('../models/Pago')

const reporteSchema=z.object({
  monto:z.number().finite().positive().max(100000),
  metodo:z.enum(['transferencia','efectivo','deposito','otro']),
  fechaPago:z.iso.date(),
  referencia:z.string().trim().max(80).optional().default(''),
  concepto:z.string().trim().min(2).max(120).optional().default('Consulta nutricional'),
}).strict()
const revisarSchema=z.object({estado:z.enum(['confirmado','rechazado'])}).strict()
const campos='montoCentavos moneda metodo referencia concepto fechaPago estado revisadoAt createdAt'

function fechaValida(fecha) {
  const d=new Date(fecha+'T12:00:00Z')
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===fecha&&
    fecha<=new Date().toISOString().slice(0,10)
}
async function pacienteAutenticado(req,res) {
  if(!req.user.patient){res.status(404).json({message:'No tienes una cuenta de paciente asociada.'});return null}
  const paciente=await Paciente.findOne({_id:req.user.patient,active:true}).select('_id nutritionist').lean()
  if(!paciente?.nutritionist)res.status(404).json({message:'Paciente no encontrado.'})
  return paciente
}
async function listarMisPagos(req,res,next) {
  try{
    res.set('Cache-Control','no-store')
    const paciente=await pacienteAutenticado(req,res)
    if(!paciente)return
    const pagos=await Pago.find({paciente:paciente._id,nutritionist:paciente.nutritionist})
      .select(campos).sort({fechaPago:-1,createdAt:-1}).limit(200).lean()
    return res.json({pagos})
  }catch(error){return next(error)}
}
async function registrarMiPago(req,res,next) {
  try{
    res.set('Cache-Control','no-store')
    const validado=reporteSchema.safeParse(req.body)
    if(!validado.success)return res.status(400).json({message:'Revisa el importe, la fecha y los datos de tu pago.'})
    if(!fechaValida(validado.data.fechaPago))return res.status(400).json({message:'La fecha del pago debe ser válida y no puede estar en el futuro.'})
    const paciente=await pacienteAutenticado(req,res)
    if(!paciente)return
    const montoCentavos=Math.round(validado.data.monto*100)
    if(!Number.isSafeInteger(montoCentavos)||Math.abs(montoCentavos-validado.data.monto*100)>0.001){
      return res.status(400).json({message:'El importe debe tener como máximo dos decimales.'})
    }
    const pago=await Pago.create({
      paciente:paciente._id,nutritionist:paciente.nutritionist,montoCentavos,moneda:'MXN',
      metodo:validado.data.metodo,fechaPago:new Date(validado.data.fechaPago+'T12:00:00Z'),
      referencia:validado.data.referencia,concepto:validado.data.concepto,estado:'reportado',
    })
    return res.status(201).json({
      message:'Pago registrado como reportado. Tu nutriólogo debe confirmar que lo recibió.',
      pago:{_id:pago._id,estado:pago.estado,montoCentavos:pago.montoCentavos,moneda:pago.moneda},
    })
  }catch(error){return next(error)}
}
async function listarPagosPaciente(req,res,next) {
  try{
    res.set('Cache-Control','no-store')
    const id=req.query.pacienteId
    if(!mongoose.isValidObjectId(id))return res.status(400).json({message:'Paciente inválido.'})
    const paciente=await Paciente.findOne({_id:id,nutritionist:req.user._id,active:true})
      .select('_id name').lean()
    if(!paciente)return res.status(404).json({message:'Paciente no encontrado en tu consultorio.'})
    const pagos=await Pago.find({paciente:paciente._id,nutritionist:req.user._id})
      .select(campos).sort({fechaPago:-1,createdAt:-1}).limit(200).lean()
    return res.json({paciente:{_id:paciente._id,name:paciente.name},pagos})
  }catch(error){return next(error)}
}
async function revisarPago(req,res,next) {
  try{
    res.set('Cache-Control','no-store')
    if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:'Pago inválido.'})
    const validado=revisarSchema.safeParse(req.body)
    if(!validado.success)return res.status(400).json({message:'Estado inválido.'})
    // Una sola revisión por reporte, atómica y limitada a su consultorio.
    const pago=await Pago.findOneAndUpdate({
      _id:req.params.id,nutritionist:req.user._id,estado:'reportado',
    },{$set:{estado:validado.data.estado,revisadoAt:new Date()}},{new:true})
      .select(campos).lean()
    if(!pago)return res.status(409).json({message:'El pago no existe, no pertenece a tu clínica o ya fue revisado.'})
    return res.json({message:'Estado del reporte actualizado.',pago})
  }catch(error){return next(error)}
}
module.exports={listarMisPagos,registrarMiPago,listarPagosPaciente,revisarPago,fechaValida}
