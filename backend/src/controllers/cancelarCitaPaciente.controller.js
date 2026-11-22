const mongoose = require('mongoose')
const Paciente = require('../models/Pacientes')
const Cita = require('../models/Cita')
const { deleteAppointment } = require('../services/calendar.service')

// HU-22: un paciente únicamente puede cancelar sus propias citas futuras.
// Conservamos historial y evitamos eventos huérfanos en Google Calendar.
async function cancelarMiCita(req,res,next) {
  try {
    res.set('Cache-Control','no-store')
    const id=req.params.id
    if(!mongoose.isValidObjectId(id)) {
      return res.status(400).json({message:'Identificador de cita inválido.'})
    }
    if(!req.user.patient) {
      return res.status(404).json({message:'La cuenta no tiene un paciente asociado.'})
    }
    const paciente=await Paciente.findOne({_id:req.user.patient,active:true})
      .select('_id nutritionist').lean()
    if(!paciente?.nutritionist) {
      return res.status(404).json({message:'Paciente no encontrado.'})
    }
    // Nunca se toma un ID de paciente del body ni se permite acceder a otra consulta.
    const cita=await Cita.findOne({
      _id:id,patient:paciente._id,nutritionist:paciente.nutritionist,
    }).select('+calendarEventId')
    if(!cita)return res.status(404).json({message:'La cita no existe en tu cuenta.'})
    if(!['programada','confirmada'].includes(cita.estado)) {
      return res.status(409).json({message:'Esta cita ya no está disponible para cancelación.'})
    }
    if(new Date(cita.inicio).getTime()<=Date.now()) {
      return res.status(409).json({message:'Las citas que ya comenzaron forman parte del historial y no pueden cancelarse.'})
    }

    // Si existe evento remoto, se retira antes de cambiar la cita local.
    // La falta de permisos/conexión no debe dejar eventos activos en Google.
    let sincronizada
    try {
      sincronizada=await deleteAppointment(cita)
    } catch(error) {
      console.error('No se pudo cancelar en Google Calendar:',error.message)
      return res.status(502).json({message:'No fue posible actualizar Google Calendar. Tu cita sigue activa; intenta nuevamente.'})
    }
    if(!sincronizada) {
      return res.status(409).json({
        message:'No se pudo sincronizar con Google Calendar. Pide al consultorio que reconecte su calendario; la cita sigue activa.',
      })
    }

    cita.estado='cancelada'
    cita.calendarEventId=null
    cita.recordatorio24hEnviado=null
    cita.recordatorio2hEnviado=null
    await cita.save()
    void req.app?.locals?.notificarCita?.(cita)
    return res.json({
      message:'Tu cita fue cancelada. Puedes consultar el registro en tu historial.',
      cita:{_id:cita._id,inicio:cita.inicio,estado:cita.estado},
      calendarSynced:true,
    })
  } catch(error) {return next(error)}
}
module.exports={cancelarMiCita}
