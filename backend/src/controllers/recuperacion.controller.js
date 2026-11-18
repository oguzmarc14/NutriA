const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const User = require('../models/User')
const { enviarRecuperacionPaciente } = require('../services/email.service')

const SOLICITUD_GENERICA = 'Si existe una cuenta de paciente activa con ese correo, recibirás un enlace para restablecer tu contraseña.'
const ventana = 10 * 60 * 1000
const expiracion = 30 * 60 * 1000
const solicitudSchema = z.object({email:z.string().trim().email().max(254)}).strict()
const restablecerSchema = z.object({
  token:z.string().regex(/^[0-9a-f]{64}$/i),
  password:z.string().min(8).max(128),
}).strict()

async function solicitarRestablecimiento(req,res,next) {
  try {
    res.set('Cache-Control','no-store')
    const validado=solicitudSchema.safeParse(req.body)
    if(!validado.success)return res.status(400).json({message:'Introduce un correo electrónico válido.'})
    const email=validado.data.email.toLowerCase()
    const usuario=await User.findOne({
      email,role:'patient',authProvider:'password',active:true,accountStatus:'active',
    }).select('+passwordResetRequestedAt +passwordResetToken +passwordResetExpiresAt')
    const mensaje={message:SOLICITUD_GENERICA}
    if(!usuario)return res.json(mensaje)

    const ultima=usuario.passwordResetRequestedAt?.getTime?.() || 0
    if(Date.now()-ultima<ventana)return res.json(mensaje)

    const token=crypto.randomBytes(32).toString('hex')
    const hash=crypto.createHash('sha256').update(token).digest('hex')
    const anterior={
      passwordResetToken:usuario.passwordResetToken || null,
      passwordResetExpiresAt:usuario.passwordResetExpiresAt || null,
      passwordResetRequestedAt:usuario.passwordResetRequestedAt || null,
    }
    usuario.passwordResetToken=hash
    usuario.passwordResetExpiresAt=new Date(Date.now()+expiracion)
    usuario.passwordResetRequestedAt=new Date()
    await usuario.save()
    try {
      await enviarRecuperacionPaciente({email:usuario.email,name:usuario.name,token})
    } catch(error) {
      // No revelar existencia de cuentas por diferencias en el mensaje HTTP.
      await User.updateOne({_id:usuario._id,passwordResetToken:hash},{$set:anterior})
      console.error('No fue posible enviar la recuperación de contraseña.')
    }
    return res.json(mensaje)
  } catch(error) {return next(error)}
}

async function restablecerContrasena(req,res,next) {
  try {
    res.set('Cache-Control','no-store')
    const validado=restablecerSchema.safeParse(req.body)
    if(!validado.success)return res.status(400).json({message:'El enlace o la contraseña no tienen un formato válido.'})
    const hash=crypto.createHash('sha256').update(validado.data.token).digest('hex')
    // Operación atómica: dos solicitudes no pueden consumir el mismo token.
    // El hash se crea antes porque findOneAndUpdate no ejecuta pre('save').
    const password=await bcrypt.hash(validado.data.password,12)
    const usuario=await User.findOneAndUpdate({
      passwordResetToken:hash,passwordResetExpiresAt:{$gt:new Date()},
      role:'patient',authProvider:'password',accountStatus:'active',active:true,
    },{
      $set:{password,passwordChangedAt:new Date()},
      $unset:{passwordResetToken:'',passwordResetExpiresAt:'',passwordResetRequestedAt:''},
    },{new:true})
    if(!usuario)return res.status(400).json({message:'El enlace expiró, es inválido o ya fue utilizado. Solicita otro.'})
    return res.json({message:'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'})
  } catch(error) {return next(error)}
}
module.exports={solicitarRestablecimiento,restablecerContrasena}
