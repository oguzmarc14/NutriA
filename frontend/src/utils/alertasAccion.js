export function confirmarAccion(titulo, detalle = '', peligro = false) {
  return new Promise(resolve => {
    const event = new CustomEvent('nutria:confirmar', { cancelable: true,
      detail: { titulo, detalle, peligro, resolve } })
    if (window.dispatchEvent(event)) resolve(false)
  })
}

export function avisarAccion(mensaje) {
  window.dispatchEvent(new CustomEvent('nutria:resultado', { detail: mensaje }))
}

export function resultadoDeOperacion(method, url, data) {
  const path = url?.split('?')[0]
  if (!path) return
  if (path === '/auth/paciente/activar') return 'Cuenta activada.'
  if (path.startsWith('/auth/')) return
  if (path === '/citas') return 'Cita registrada.'
  if (/^\/citas\/[^/]+\/estado$/.test(path)) {
    return { cancelada: 'Cita cancelada. Se conserva en el historial.',
      completada: 'Cita marcada como completada.', confirmada: 'Cita confirmada.' }[data?.estado] || 'Estado de cita actualizado.'
  }
  if (path.startsWith('/citas/')) return method === 'delete' ? 'Cita eliminada.' : 'Cita actualizada.'
  if (path === '/calendar/disconnect') return 'Google Calendar desconectado.'
  if (path.endsWith('/reenviar-invitacion')) return 'Invitación reenviada.'
  if (path.startsWith('/pacientes')) return { post: 'Paciente registrado.', put: 'Paciente actualizado.', delete: 'Paciente eliminado.' }[method]
  if (path.startsWith('/planes/')) return method === 'delete' ? 'Plan eliminado.' : 'Plan guardado.'
  if (path.startsWith('/usuarios')) return method === 'post' ? 'Usuario registrado.' : 'Usuario actualizado.'
  if (path.startsWith('/horario')) return 'Horario guardado.'
  if (path.startsWith('/mediciones')) return 'Medición guardada.'
  if (path.startsWith('/expediente')) return 'Expediente guardado.'
  if (path.startsWith('/calculo-nutricional')) return 'Cálculo nutricional guardado.'
  if (path.startsWith('/seguimiento-comidas')) return 'Registro de comida guardado.'
  if (path.startsWith('/gamificacion')) return 'Preferencia guardada.'
  if (path === '/clinica') return 'Datos de la clínica guardados.'
  if (path.startsWith('/community')) return path.endsWith('/moderar') ? 'Moderación aplicada.'
    : path.endsWith('/publicar') ? (data?.estado === 'publicada' ? 'Receta publicada.' : 'Receta enviada a revisión.') : 'Receta guardada.'
  return 'Cambios guardados.'
}
