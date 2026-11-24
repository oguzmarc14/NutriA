const { modeloPaciente } = require('../config/datosPacientes')
const mongoose=require('mongoose')

// HU-23/24: registro DECLARADO de pagos externos a NutriA.
// El sistema no procesa tarjetas, dinero, banca ni emite recibos fiscales.
const pagoSchema=new mongoose.Schema({
  paciente:{type:mongoose.Schema.Types.ObjectId,ref:'Patient',required:true,index:true},
  nutritionist:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  montoCentavos:{type:Number,required:true,min:1,max:10000000},
  moneda:{type:String,enum:['MXN'],default:'MXN'},
  metodo:{type:String,enum:['transferencia','efectivo','deposito','otro'],required:true},
  referencia:{type:String,trim:true,maxlength:80,default:''},
  concepto:{type:String,trim:true,maxlength:120,default:'Consulta nutricional'},
  fechaPago:{type:Date,required:true},
  estado:{type:String,enum:['reportado','confirmado','rechazado'],default:'reportado',index:true},
  revisadoAt:{type:Date,default:null},
}, {timestamps:true})
pagoSchema.index({paciente:1,createdAt:-1})
pagoSchema.index({nutritionist:1,paciente:1,createdAt:-1})
module.exports=modeloPaciente('Pago',pagoSchema)
