const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter])

export function exportarPlanPDF(plan, paciente) {
  if (!plan) throw new Error('No hay un plan alimenticio para exportar.')
  const ventana = window.open('', '_blank')
  if (!ventana) throw new Error('Permite las ventanas emergentes para exportar el PDF.')
  const nombrePaciente = [paciente?.nombre, paciente?.apellidoPaterno, paciente?.apellidoMaterno].filter(Boolean).join(' ') || paciente?.nombreCompleto || 'Paciente'
  const comidas = Array.isArray(plan.comidas) ? plan.comidas : []
  const filas = comidas.map((comida) => {
    const alimentos = (comida.alimentos || []).map((a) => {
      const nombre = a.nombre || a.alimento?.nombre || a.alimentoId?.nombre || 'Alimento'
      const cantidad = a.cantidad || 1
      const porcion = a.porcion?.descripcion || a.porcion?.nombre || a.porcion || ''
      return `<li>${escapar(nombre)} — ${escapar(cantidad)} ${escapar(typeof porcion === 'string' ? porcion : '')}</li>`
    }).join('')
    return `<section class="comida"><h2>${escapar(comida.nombre || 'Comida')} <small>${escapar(comida.hora || '')}</small></h2>${comida.platillo ? `<p>${escapar(comida.platillo)}</p>` : ''}<ul>${alimentos || '<li>Sin alimentos registrados</li>'}</ul></section>`
  }).join('')
  ventana.document.open()
  ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Plan alimenticio - ${escapar(plan.nombre || 'NutriA')}</title><style>body{font:15px Arial,sans-serif;color:#173f34;max-width:850px;margin:40px auto;padding:0 24px}header{border-bottom:3px solid #246b55;padding-bottom:18px}h1{margin:8px 0;font-size:27px}h2{font-size:18px;margin-bottom:8px}.comida{break-inside:avoid;border-bottom:1px solid #d6e4db;padding:12px 0}small{color:#60786d;font-weight:normal}li{margin:7px 0}footer{margin-top:35px;font-size:12px;color:#60786d}@media print{body{margin:12mm auto}.comida{break-inside:avoid}}</style></head><body><header><strong>NutriA · Plan alimenticio</strong><h1>${escapar(plan.nombre || 'Plan alimenticio')}</h1><p><strong>Paciente:</strong> ${escapar(nombrePaciente)}</p><p><strong>Objetivo:</strong> ${escapar(plan.objetivo || 'No especificado')}</p><p><strong>Fecha:</strong> ${escapar((plan.fechaInicio || '').slice(0,10))}</p></header><main>${filas || '<p>Sin comidas registradas</p>'}</main><footer>Documento generado desde NutriA. Sigue las indicaciones de tu nutriólogo.</footer></body></html>`)
  ventana.document.close()
  ventana.focus()
  ventana.addEventListener('load', () => ventana.print(), { once: true })
}
