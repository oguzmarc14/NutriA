// Mostrar una sola alerta prioritaria en la card; el resto se consulta en el modal.
export function avisoDestacado(avisos = []) {
  const preferencia = ['seguimiento-cita', 'mediciones', 'expediente', 'plan']
  return preferencia.map(id => avisos.find(a => a.id === id)).find(Boolean) ||
    avisos.find(a => Boolean(a.accion)) || avisos[0] || null
}
