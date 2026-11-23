import { portionLabel } from './portionLabel.ts'
import { mealPreparationGroups } from './mealDisplay.ts'
import type { Food, Plan } from './models'

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))

const format = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })
const metrics = [
  ['kcal', 'Energía del plan', 'kcal'],
  ['proteina', 'Proteína', 'g'],
  ['carbohidratos', 'Carbohidratos', 'g'],
  ['grasas', 'Grasas', 'g'],
] as const

function scaled(food: Food, key: (typeof metrics)[number][0]) {
  return (Number(food.nutrimentos?.[key]) || 0) * (Number(food.cantidad) || 0)
}

export type ClinicBrand = { nombre?: string; nombreProfesional?: string; logo?: string }

export function planDocument(plan: Plan, patientName: string, clinic?: ClinicBrand) {
  const name = clinic?.nombre?.trim() || clinic?.nombreProfesional?.trim() || 'Consultorio de nutrición'
  const logo = clinic?.logo
  const hasLogo = typeof logo === 'string' && logo.length <= 950000 && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(logo)
  if (!plan?.comidas?.length) throw new Error('Este plan no contiene comidas para exportar.')
  const groups = plan.comidas.map(mealPreparationGroups)
  const foods = groups.flatMap(meal => meal.flatMap(group => group.alimentos))
  const summary = metrics.map(([key, label, unit]) =>
    `<div class="metric"><b>${format.format(foods.reduce((total, food) => total + scaled(food, key), 0))} ${unit}</b><span>${label}</span></div>`
  ).join('')
  const meals = plan.comidas.map((meal, index) => {
    const preparations = groups[index]
    const energy = preparations.flatMap(group => group.alimentos).reduce((total, food) => total + scaled(food, 'kcal'), 0)
    const details = preparations.map(group => `
      <h3>${group.tipo === 'bebida' ? 'Bebida' : 'Platillo'} · ${escapeHtml(group.nombre || 'Sin nombre')}</h3>
      <table><thead><tr><th>Alimento</th><th>Cantidad</th><th class="energy">kcal</th></tr></thead>
      <tbody>${group.alimentos.map(food => `<tr><td><strong>${escapeHtml(food.nombre)}</strong>
        ${food.notas ? `<span class="notes">${escapeHtml(food.notas)}</span>` : ''}
        </td><td>${escapeHtml(portionLabel(food))}</td>
        <td class="energy">${format.format(scaled(food, 'kcal'))}</td></tr>`).join('')}</tbody></table>`).join('')
    return `<section><div class="meal-heading">
      <h2>${escapeHtml(meal.nombre || 'Comida')}</h2>
      <p>${[meal.hora, format.format(energy) + ' kcal'].filter(Boolean).map(escapeHtml).join(' · ')}</p>
      </div>${meal.descripcion ? `<p><strong>Indicaciones</strong> · ${escapeHtml(meal.descripcion)}</p>` : ''}
      ${details || '<p>Esta comida se guardó sin ingredientes y requiere revisión del nutriólogo.</p>'}</section>`
  }).join('')
  const date = plan.fechaInicio ? new Date(plan.fechaInicio) : null
  const dateLabel = date && Number.isFinite(+date)
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(date) : ''
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(plan.nombre || 'Plan alimenticio')}</title>
    <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 12px/1.5 Arial, sans-serif; color: #173f34; }
    .hero { padding: 0 0 16px; border-bottom: 3px solid #28785b; break-inside: avoid; }
    .brand { color: #246b55; font-size: 11px; font-weight: bold; letter-spacing: .14em; text-transform: uppercase; }
    .clinic { display: flex; gap: 12px; align-items: center; font-size: 25px; font-weight: bold; line-height: 1.15; overflow-wrap: anywhere; }
    .clinic img { width: 60px; height: 60px; object-fit: contain; border: 1px solid #d8e8df; border-radius: 9px; }
    h1 { font-size: 27px; line-height: 1.15; margin: 9px 0 12px; }
    h2 { font-size: 17px; margin: 0; }
    h3 { font-size: 12px; margin: 10px 0 4px; color: #246b55; }
    h1, h2, h3, td, p { overflow-wrap: anywhere; }
    p { margin: 6px 0; white-space: pre-wrap; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px 24px; color: #49675b; }
    .summary { display: flex; margin: 14px 0; gap: 8px; break-inside: avoid; }
    .metric { flex: 1; border: 1px solid #d8e8df; border-radius: 8px; padding: 8px; }
    .metric b { display: block; font-size: 16px; color: #246b55; }
    .metric span { font-size: 10px; color: #49675b; }
    section { margin: 18px 0; }
    .meal-heading { background: #edf6f0; border-top: 2px solid #81b59a; padding: 8px 10px; break-inside: avoid; break-after: avoid; }
    .meal-heading p, .notes { color: #49675b; }
    h3, thead { break-after: avoid; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    th, td { padding: 5px 8px; border-bottom: 1px solid #dce9e1; vertical-align: top; text-align: left; }
    th { font-size: 10px; color: #49675b; }
    th:first-child { width: 53%; }
    th:last-child { width: 13%; }
    tr { break-inside: avoid; }
    .energy { text-align: right; white-space: nowrap; }
    .notes { display: block; font-size: 10px; white-space: pre-wrap; }
    footer { border-top: 1px solid #dce9e1; padding-top: 8px; color: #49675b; font-size: 10px; }
    @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <header class="hero"><div class="brand">Plan alimenticio</div>
    <div class="clinic">${hasLogo ? `<img src="${escapeHtml(logo)}" alt="Logotipo del consultorio">` : ''}<div>${escapeHtml(name)}</div></div>
    <h1>${escapeHtml(plan.nombre || 'Plan alimenticio')}</h1>
    <div class="meta">
      <span>${patientName ? 'Paciente · ' + escapeHtml(patientName) : 'Dieta guardada'}</span>
      ${dateLabel ? `<span>Inicio · ${escapeHtml(dateLabel)}</span>` : ''}
      ${plan.metaEnergiaKcal != null ? `<span>Meta · ${format.format(plan.metaEnergiaKcal)} kcal/día</span>` : ''}
    </div>${plan.objetivo ? `<p><strong>Objetivo</strong> · ${escapeHtml(plan.objetivo)}</p>` : ''}</header>
    <div class="summary">${summary}</div>${meals}
    <footer><strong>Tecnología de NutriA</strong> · Los valores nutricionales son estimados.</footer></body></html>`
}
