// Avisos informativos para el nutriólogo. No son diagnósticos ni notificaciones push.
// Los datos clínicos siguen protegidos en las rutas autenticadas correspondientes.
import { avisoProximoSeguimiento } from './seguimientoConsultas'

export function obtenerAvisosPaciente(paciente, configSeguimiento = null, hoy = null, zonaHoraria = null) {
  if (!paciente) return []
  const avisos = []
  const seguimiento = avisoProximoSeguimiento(paciente,configSeguimiento,hoy,zonaHoraria)
  if (seguimiento) avisos.push(seguimiento)

  if (paciente.accountStatus === 'pending') {
    avisos.push({
      id: 'invitacion',
      titulo: 'Invitación pendiente',
      detalle: 'La cuenta todavía está pendiente de activación. Puedes revisar el estado o reenviar la invitación desde la tarjeta.',
      accion: null,
      categoria: 'Cuenta',
    })
  }

  if (!String(paciente.phone || '').trim()) {
    avisos.push({
      id: 'telefono',
      titulo: 'Teléfono por registrar',
      detalle: 'Puedes agregar un número de contacto si el paciente desea compartirlo.',
      accion: 'editar',
      categoria: 'Datos generales',
    })
  }

  if (!paciente.birthDate) {
    avisos.push({
      id: 'nacimiento',
      titulo: 'Fecha de nacimiento por registrar',
      detalle: 'Este dato es opcional. Puedes completarlo cuando corresponda.',
      accion: 'editar',
      categoria: 'Datos generales',
    })
  }

  // No inferir que faltan documentos cuando el backend todavía no devuelve el dato.
  if (paciente.tieneExpediente === false) {
    avisos.push({
      id: 'expediente',
      titulo: 'Expediente por iniciar',
      detalle: 'Todavía no hay un expediente clínico registrado. Puedes comenzarlo cuando sea oportuno.',
      accion: 'expediente',
      categoria: 'Organización clínica',
    })
  }

  if (paciente.tienePlan === false) {
    avisos.push({
      id: 'plan',
      titulo: 'Plan alimenticio por preparar',
      detalle: 'No se ha registrado un plan para este paciente. Su elaboración depende de la valoración profesional.',
      accion: 'plan',
      categoria: 'Organización clínica',
    })
  }

  if (paciente.ultimaMedicion === null) {
    avisos.push({
      id: 'mediciones',
      titulo: 'Sin mediciones registradas',
      detalle: 'Si forman parte del seguimiento acordado, puedes registrar mediciones cuando corresponda.',
      accion: 'mediciones',
      categoria: 'Seguimiento',
    })
  }

  return avisos
}
