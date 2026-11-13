// Clasificación visual de avisos existentes, sin inferir urgencias clínicas.
export const GRUPOS_AVISOS = [
  { id:'cuenta', titulo:'Cuenta' },
  { id:'clinica', titulo:'Organización clínica' },
  { id:'seguimiento', titulo:'Seguimiento' },
  { id:'datos', titulo:'Datos generales' },
]

export function grupoDeAviso(aviso) {
  if (aviso?.categoria === 'Cuenta') return 'cuenta'
  if (aviso?.categoria === 'Organización clínica') return 'clinica'
  if (aviso?.categoria === 'Seguimiento') return 'seguimiento'
  return 'datos'
}

// No almacenar el contenido clínico del aviso en el navegador: solo ID y fecha.
// Cuando un seguimiento corresponde a otra fecha, vuelve a aparecer sin revisar.
export function claveRevisionAviso(aviso) {
  return String(aviso?.id || '') + ':' + String(aviso?.fecha || '')
}
export function resumenDeAvisos(avisos=[],revisados=[]) {
  const vistos=new Set(revisados)
  const cuentas={total:avisos.length,pendientes:0,vistos:0,cuenta:0,clinica:0,seguimiento:0,datos:0}
  avisos.forEach(aviso=>{
    cuentas[grupoDeAviso(aviso)]++
    if (vistos.has(claveRevisionAviso(aviso))) cuentas.vistos++
    else cuentas.pendientes++
  })
  return cuentas
}
export function filtrarAvisos(avisos=[],revisados=[],estado='todos',grupo='todos') {
  const vistos=new Set(revisados)
  return avisos.filter(aviso=>
    (grupo === 'todos' || grupoDeAviso(aviso) === grupo) &&
    (estado === 'todos' ||
      (estado === 'pendientes' && !vistos.has(claveRevisionAviso(aviso))) ||
      (estado === 'vistos' && vistos.has(claveRevisionAviso(aviso)))
    )
  )
}
