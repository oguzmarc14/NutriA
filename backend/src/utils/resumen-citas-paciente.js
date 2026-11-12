const { partesLocales, sumarDias } = require('./agenda-publica.utils')

const ACTIVO = new Set(['programada','confirmada'])
const defaults = {activo:true,cicloDias:30,anticipacionDias:5}
function resumenCitasPaciente(citas,config={},zonaHoraria='America/Mexico_City',ahora=new Date()){
  const now=ahora.getTime()
  const conFecha=(Array.isArray(citas)?citas:[]).filter(c=>Number.isFinite(new Date(c.inicio).getTime()))
  const pendientes=conFecha.filter(c=>ACTIVO.has(c.estado) && new Date(c.inicio).getTime()>now)
    .sort((a,b)=>new Date(a.inicio)-new Date(b.inicio))
  const completadas=conFecha.filter(c=>c.estado==='completada' && new Date(c.inicio).getTime()<=now)
    .sort((a,b)=>new Date(b.inicio)-new Date(a.inicio))
  const proxima=pendientes[0]||null
  const ultima=completadas[0]||null
  const preferencia={...defaults,...(config||{})}
  const hoy=partesLocales(ahora,zonaHoraria).fecha
  const avisos=[]
  if(proxima?.estado==='confirmada') {
    avisos.push({
      id:'cita-confirmada:'+String(proxima._id),
      tipo:'confirmada',titulo:'Tu cita está confirmada',
      detalle:'Tu próxima consulta está confirmada. Consulta su fecha y hora en Mis citas.',
      citaId:String(proxima._id),
    })
  } else if(proxima?.estado==='programada') {
    avisos.push({
      id:'cita-programada:'+String(proxima._id),
      tipo:'programada',titulo:'Tienes una cita por confirmar',
      detalle:'La próxima consulta está programada y pendiente de confirmación.',
      citaId:String(proxima._id),
    })
  } else if(preferencia.activo && ultima) {
    const ciclo=Number(preferencia.cicloDias),anticipo=Number(preferencia.anticipacionDias)
    if(Number.isInteger(ciclo)&&ciclo>=7&&ciclo<=90 &&
       Number.isInteger(anticipo)&&anticipo>=0&&anticipo<=30&&anticipo<=ciclo){
      const fechaUltima=partesLocales(new Date(ultima.inicio),zonaHoraria).fecha
      const siguiente=sumarDias(fechaUltima,ciclo)
      const faltan=Math.round((Date.parse(siguiente+'T12:00:00Z')-Date.parse(hoy+'T12:00:00Z'))/86400000)
      if(faltan<=anticipo && faltan>=-7) {
        avisos.push({
          id:'seguimiento:'+String(ultima._id)+':'+siguiente,
          tipo:'seguimiento',titulo:faltan>0?'Próximo seguimiento sugerido':'Revisa tu siguiente consulta',
          detalle:faltan>1?'Faltan '+faltan+' días para tu seguimiento sugerido.':
            faltan===1?'Falta 1 día para tu seguimiento sugerido.':
            faltan===0?'Hoy corresponde revisar tu seguimiento sugerido.':
            'La fecha sugerida de seguimiento ya pasó. Contacta a tu nutriólogo.',
          fechaSugerida:siguiente,diasRestantes:faltan,
        })
      }
    }
  }
  return {proxima,ultima,hoy,zonaHoraria,avisos}
}
module.exports={resumenCitasPaciente}
