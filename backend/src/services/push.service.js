const Device = require('../models/PushDevice')
const Receipt = require('../models/PushReceipt')
const User = require('../models/User')
const Notice = require('../models/Notification')
const enabled = () => process.env.PUSH_NOTIFICATIONS_ENABLED === 'true'
const headers = () => ({ 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN && { Authorization: 'Bearer ' + process.env.EXPO_ACCESS_TOKEN }) })
async function sendDevice(device, notice) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({to:device.token,title:'NutriA',body:notice.title?'Tienes un aviso nuevo. Abre NutriA para consultarlo.':notice.body,sound:'default',channelId:notice.channelId||'appointments-v2',priority:'high',
          data:{kind:notice.kind,route:notice.route,recipientUser:String(device.user)}}),signal:AbortSignal.timeout(8000),
      })
      if(response.status===429||response.status>=500)throw new Error('Servicio push temporalmente no disponible')
      if(!response.ok)throw Object.assign(new Error('Configuración push rechazada'),{permanent:true})
      const ticket=(await response.json()).data
      if(ticket?.details?.error==='DeviceNotRegistered'){await Device.deleteOne({_id:device._id,token:device.token,user:device.user});return}
      if(ticket?.status!=='ok')throw Object.assign(new Error('Expo rechazó el aviso'),{permanent:true})
      if(ticket.id){try{await Receipt.updateOne({ticket:ticket.id},{$setOnInsert:{device:device._id,user:device.user,token:device.token,nextCheckAt:new Date(Date.now()+15*60000),expiresAt:new Date(Date.now()+24*3600000)}},{upsert:true})}catch{console.error('No se pudo registrar un receipt push')}}
      return
    }catch(error){if(error.permanent||attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,500*2**attempt))}
  }
}
async function notifyUsers(ids, notice) {
  if(!ids.length)return
  await Notice.insertMany(ids.map(user=>({user,kind:notice.kind,titulo:notice.title||'Actualización de NutriA',detalle:notice.body,route:notice.route,expiresAt:new Date(Date.now()+30*86400000)})))
  if(!enabled())return
  const devices=await Device.find({user:{$in:ids}}).limit(100).lean()
  await Promise.allSettled(devices.map(device=>sendDevice(device,notice)))
}
async function sendAppointmentPush(recipients) {
  if (!enabled()) return
  const users = [...new Set(recipients.map(item => String(item.user)))]
  const devices = await Device.find({ user: { $in: users } }).limit(100).lean()
  await Promise.allSettled(devices.map(device => {
    const target = recipients.find(item => String(item.user) === String(device.user))
    return sendDevice(device, { kind: 'nutria-appointment', route: target.route, title: 'NutriA' })
  }))
}
async function notificarCita(cita) {
  try {
    const patient=cita.patient?._id||cita.patient, professional=cita.nutritionist?._id||cita.nutritionist
    const users=await User.find({active:true,$or:[{patient,role:'patient'},...professional?[{_id:professional,role:'nutritionist'}]:[]]}).select('_id role').lean()
    await Promise.allSettled(users.map(user=>notifyUsers([user._id],user.role==='patient'
      ? {kind:'nutria-appointment',route:'/mis-citas',title:cita.estado==='cancelada'?'Cita cancelada':'Actualización de cita',body:cita.estado==='cancelada'?'Tu cita fue cancelada. Abre Mis citas para consultar el cambio.':'Hay una actualización de tus citas. Abre Mis citas para ver los detalles.'}
      : {kind:'nutria-appointment',route:'/citas',body:'Hay una actualización en tu agenda. Abre NutriA para revisar la cita.'})))
  }catch{console.error('No se pudo procesar un aviso de cita')}
}
async function notificarReceta(receta, pending) {
  try {
    const users=await User.find(pending?{active:true,role:'admin'}:{active:true,_id:receta.autor?._id||receta.autor,role:'nutritionist'}).select('_id').limit(100).lean()
    await notifyUsers(users.map(u=>u._id),{kind:'nutria-community',route:pending?'/moderacion':'/comunidad',body:pending?'Hay una receta pendiente de revisión en NutriA.':'Tu receta tiene una actualización. Abre NutriA Community.'})
  }catch{console.error('No se pudo procesar un aviso de Community')}
}
async function notificarDietaAsignada(patient, actualizada = false) {
  try {
    const recipients = await User.find({ active: true, patient, role: 'patient' }).select('_id').lean()
    await notifyUsers(recipients.map(u => u._id), {
      kind:'nutria-diet-assigned',route:'/mi-plan',channelId:'nutrition-updates-v1',
      title:actualizada?'Dieta actualizada':'Nueva dieta asignada',
      body:actualizada?'Tu nutriólogo actualizó tu plan. Abre Mi plan para revisarlo.':'Tu nutriólogo te asignó una dieta. Abre Mi plan para consultarla.',
    })
  } catch (error) { console.error('No se pudo notificar un plan asignado:', error.message) }
}
async function notificarDietaAceptada(nutritionist, planId) {
  try {
    const recipients = await User.find({ _id:nutritionist,active:true,role:'nutritionist' }).select('_id').lean()
    await notifyUsers(recipients.map(u => u._id), {
      kind:'nutria-diet-accepted',route:'/planes',channelId:'nutrition-updates-v1',
      body:'Un paciente confirmó que recibió su dieta. Abre Planes alimenticios para consultar el registro.',
    })
  } catch (error) { console.error('No se pudo notificar la aceptación de dieta:', error.message) }
}
let processing=false
async function processReceipts() {
  if(!enabled()||processing)return
  processing=true
  try{
    const receipts=await Receipt.find({nextCheckAt:{$lte:new Date()},expiresAt:{$gt:new Date()}}).sort({nextCheckAt:1}).limit(100).lean()
    if(!receipts.length)return
    const response=await fetch('https://exp.host/--/api/v2/push/getReceipts',{method:'POST',headers:headers(),body:JSON.stringify({ids:receipts.map(r=>r.ticket)}),signal:AbortSignal.timeout(8000)})
    if(!response.ok)throw new Error('Receipts no disponibles')
    const data=(await response.json()).data||{}
    for(const item of receipts){
      const result=data[item.ticket]
      if(!result){await Receipt.updateOne({_id:item._id},{$set:{nextCheckAt:new Date(Date.now()+2*60000)}});continue}
      if(result.details?.error==='DeviceNotRegistered')await Device.deleteOne({_id:item.device,user:item.user,token:item.token})
      if(result.status==='error')console.error('Expo no entregó un aviso push:',result.details?.error||'unknown')
      await Receipt.deleteOne({_id:item._id})
    }
  }catch{console.error('No se pudieron consultar receipts push')}
  finally{processing=false}
}
module.exports={sendAppointmentPush,notificarCita,notificarReceta,notificarDietaAsignada,notificarDietaAceptada,processReceipts}
