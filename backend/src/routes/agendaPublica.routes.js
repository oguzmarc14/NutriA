const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const Cita = require('../models/Cita')
const { fechaLocalAhora, sumarDias, construirDisponibilidad } = require('../utils/agenda-publica.utils')
const router = express.Router()

// Sólo disponibilidad y nombre comercial. Nunca devuelve nombres, correos ni
// otros datos de pacientes ni los horarios ocupados individualmente.
router.get('/:nutritionistId', async (req,res,next) => {
  try {
    res.set('Cache-Control','no-store')
    const id = req.params.nutritionistId
    if(!mongoose.isValidObjectId(id))return res.status(404).json({message:'Calendario no disponible'})
    const user = await User.findOne({_id:id,role:'nutritionist',active:true})
      .select('name clinica horarioCitas horarioLaboral').lean()
    if(!user?.horarioLaboral?.configurado || !user?.horarioCitas?.configurado ||
       !user.horarioCitas.publicado)
      return res.status(404).json({message:'Calendario no disponible'})
    const zona = user.horarioLaboral.zonaHoraria
    const hoy = fechaLocalAhora(zona)
    const dias = Number(req.query.dias || 14)
    const desde = String(req.query.desde || hoy)
    if(!Number.isInteger(dias) || dias<1 || dias>21 ||
       !/^\d{4}-\d{2}-\d{2}$/.test(desde) ||
       !Number.isFinite(new Date(desde+'T12:00:00Z').getTime()) ||
       new Date(desde+'T12:00:00Z').toISOString().slice(0,10)!==desde ||
       desde<hoy || desde>sumarDias(hoy,30))
      return res.status(400).json({message:'Rango de fechas inválido'})
    const startDate=new Date(desde+'T00:00:00Z')
    const endDate=new Date(sumarDias(desde,dias)+'T00:00:00Z')
    const lower=new Date(startDate.getTime()-2*86400000)
    const upper=new Date(endDate.getTime()+2*86400000)
    const booked=await Cita.find({nutritionist:user._id,estado:{$ne:'cancelada'},
      inicio:{$lt:upper},fin:{$gt:lower}}).select('inicio fin -_id').lean()
    const fechas=Array.from({length:dias},(_,i)=>{
      const fecha=sumarDias(desde,i)
      return {fecha,espacios:construirDisponibilidad(fecha,user.horarioCitas,user.horarioLaboral,booked)}
    })
    res.json({
      clinica:user.clinica?.nombre || 'Consultorio nutricional',
      profesional:user.clinica?.nombreProfesional || user.name,
      zonaHoraria:zona,
      duracionMinutos:60,
      desde,
      dias:fechas,
      aviso:'Los horarios pueden cambiar. Elegir uno no representa una reserva confirmada.',
    })
  } catch(e){next(e)}
})
module.exports=router
