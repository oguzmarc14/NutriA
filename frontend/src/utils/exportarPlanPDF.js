const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter])
const numero = valor => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(Number(valor) || 0)
const nutrimentos = alimentos => alimentos.reduce((suma, a) => {
  const cantidad = Number(a.cantidad) || 1
  for (const clave of ['kcal', 'proteina', 'carbohidratos', 'grasas']) suma[clave] += (Number(a.nutrimentos?.[clave]) || 0) * cantidad
  return suma
}, { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 })

export function exportarPlanPDF(plan, paciente) {
  if (!plan) throw new Error('No hay un plan alimenticio para exportar.')
  const comidas = Array.isArray(plan.comidas) ? plan.comidas : []
  if (!comidas.length) throw new Error('Este plan no contiene comidas para exportar.')
  const ventana = window.open('', '_blank')
  if (!ventana) throw new Error('Activa las ventanas emergentes para imprimir o guardar la dieta como PDF.')
  const nombrePaciente = paciente?.name || paciente?.nombreCompleto || [paciente?.nombre, paciente?.apellidoPaterno, paciente?.apellidoMaterno].filter(Boolean).join(' ') || 'Paciente'
  const fecha = plan.fechaInicio ? new Date(plan.fechaInicio) : null
  const fechaTexto = fecha && !Number.isNaN(fecha.getTime()) ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(fecha) : 'No especificada'
  const totales = nutrimentos(comidas.flatMap(comida => comida.alimentos || []))
  const filas = comidas.map((comida, index) => {
    const alimentos = comida.alimentos || []
    const subtotal = nutrimentos(alimentos)
    const items = alimentos.map(a => {
      const cantidad = Number(a.cantidad) || 1
      const porcion = a.porcion || {}
      const unidad = porcion.descripcion || [porcion.cantidad && porcion.cantidad !== 1 ? numero(porcion.cantidad) : '', porcion.unidad].filter(Boolean).join(' ') || (porcion.gramos ? numero(porcion.gramos) + ' g por porción' : 'porción')
      const kcal = (Number(a.nutrimentos?.kcal) || 0) * cantidad
      return `<tr><td><strong>${escapar(a.nombre || 'Alimento')}</strong>${a.notas ? `<span class="muted">${escapar(a.notas)}</span>` : ''}</td><td>${escapar(numero(cantidad))} × ${escapar(unidad)}</td><td class="numeric">${escapar(numero(kcal))}</td></tr>`
    }).join('')
    return `<section class="meal"><div class="meal-head"><div><span class="eyebrow">TIEMPO ${index + 1}</span><h2>${escapar(comida.nombre || 'Comida')}</h2>${comida.platillo ? `<p class="dish">${escapar(comida.platillo)}</p>` : ''}</div><div class="time">${escapar(comida.hora || 'Sin horario')}</div></div>${comida.descripcion ? `<p class="notes">${escapar(comida.descripcion)}</p>` : ''}<table><thead><tr><th>Alimento</th><th>Cantidad</th><th class="numeric">kcal</th></tr></thead><tbody>${items || '<tr><td colspan="3">Sin alimentos registrados</td></tr>'}</tbody></table><div class="subtotal">Total de esta comida <strong>${escapar(numero(subtotal.kcal))} kcal</strong></div></section>`
  }).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(plan.nombre || 'Dieta NutriA')}</title><style>
    @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:14px/1.55 Arial,Helvetica,sans-serif;color:#203d34;background:#eef4ef;margin:0}.sheet{max-width:860px;margin:24px auto;padding:35px;background:#fff;box-shadow:0 8px 30px #1d49351c}.brand{font-size:13px;font-weight:800;letter-spacing:.12em;color:#28785b}.hero{padding:0 0 22px;border-bottom:3px solid #28785b}.hero h1{font-size:28px;line-height:1.2;margin:12px 0 14px;color:#173f34;overflow-wrap:anywhere}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}.meta p{margin:0}.meta b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#638275}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:22px 0}.metric{border:1px solid #dceae0;background:#f5faf6;border-radius:12px;padding:12px 9px}.metric b{display:block;font-size:20px;color:#246b55}.metric span{font-size:11px;color:#5a7768}.meal{margin:20px 0;border:1px solid #dceae0;border-radius:13px;overflow:hidden;break-inside:avoid;page-break-inside:avoid}.meal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;background:#f2f8f3;padding:15px}.eyebrow{font-size:10px;font-weight:700;color:#6d8b7a;letter-spacing:.1em}.meal h2{margin:3px 0;font-size:19px;color:#173f34}.dish{margin:2px 0;color:#466858}.time{white-space:nowrap;font-weight:700;color:#246b55}.notes{margin:12px 15px;font-size:12px;color:#5d7367}table{width:100%;border-collapse:collapse;table-layout:fixed}th{text-align:left;background:#fbfdfb;color:#638275;font-size:11px;text-transform:uppercase}td,th{padding:10px 14px;border-bottom:1px solid #edf2ee;overflow-wrap:anywhere}td:first-child,th:first-child{width:48%}td:nth-child(2),th:nth-child(2){width:36%}.numeric{text-align:right}.muted{display:block;font-size:11px;color:#6a8174}.subtotal{display:flex;justify-content:space-between;gap:12px;padding:12px 15px;background:#f7faf7;font-size:12px}footer{margin-top:28px;padding-top:16px;border-top:1px solid #dceae0;color:#698072;font-size:11px}.actions{max-width:860px;margin:24px auto 0;display:flex;gap:10px;justify-content:flex-end}.actions button{border:0;border-radius:10px;padding:12px 20px;background:#246b55;color:white;font-weight:700;cursor:pointer}@media(max-width:600px){.sheet{margin:10px;padding:18px}.meta{grid-template-columns:1fr}.summary{grid-template-columns:repeat(2,1fr)}.hero h1{font-size:23px}td,th{padding:8px 7px}.actions{margin:12px}}@media print{body{background:#fff}.sheet{margin:0;padding:0;box-shadow:none;max-width:none}.actions{display:none}.meal{break-inside:avoid}.summary{break-inside:avoid}}
  </style></head><body><div class="actions"><button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button></div><main class="sheet"><header class="hero"><div class="brand">NUTRIA · PLAN ALIMENTICIO</div><h1>${escapar(plan.nombre || 'Plan alimenticio')}</h1><div class="meta"><p><b>Paciente</b>${escapar(nombrePaciente)}</p><p><b>Fecha del plan</b>${escapar(fechaTexto)}</p><p><b>Objetivo</b>${escapar(plan.objetivo || 'No especificado')}</p><p><b>Comidas</b>${comidas.length}</p></div></header><div class="summary"><div class="metric"><b>${numero(totales.kcal)}</b><span>kcal totales</span></div><div class="metric"><b>${numero(totales.proteina)} g</b><span>Proteína</span></div><div class="metric"><b>${numero(totales.carbohidratos)} g</b><span>Carbohidratos</span></div><div class="metric"><b>${numero(totales.grasas)} g</b><span>Grasas</span></div></div>${filas}<footer>Plan generado desde NutriA. Sigue las indicaciones de tu profesional de nutrición. Los valores nutricionales son estimados.</footer></main></body></html>`
  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
}
