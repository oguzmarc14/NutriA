import {portionLabel} from './portionLabel.ts'
import {mealPreparationGroups} from './mealDisplay.ts'
import type {Plan} from './models'
export const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,
  char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))
export function planDocument(plan:Plan,patientName:string){
  const css='@page{margin:26px}body{font-family:Arial,sans-serif;color:#173f34;font-size:12px}h1{font-size:22px}h2{font-size:16px;margin:0}h3{font-size:13px}section{border:1px solid #c8ddcf;border-radius:12px;padding:14px;margin:14px 0;break-inside:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #e3eee7;padding:8px;vertical-align:top}.notes{display:block;color:#527166;font-size:11px;margin-top:4px}.amount{text-align:right;min-width:95px}.brand{color:#267259;font-weight:bold}'
  const head='<p class="brand">NutriA · Plan alimenticio</p><h1>'+escapeHtml(plan.nombre)+'</h1><p>'+
    escapeHtml(patientName)+' · Fecha del menú: '+escapeHtml(plan.fechaInicio.slice(0,10))+
    (plan.metaEnergiaKcal?'<br>Meta de energía: '+escapeHtml(plan.metaEnergiaKcal)+' kcal/día':'')+'</p>'+
    (plan.objetivo?'<p>'+escapeHtml(plan.objetivo)+'</p>':'')
  const meals=plan.comidas.map(meal=>{
    const groups=mealPreparationGroups(meal)
    const details=groups.length?groups.map(group=>
      '<h3>'+escapeHtml(group.tipo==='bebida'?'Bebida: ':'Platillo: ')+escapeHtml(group.nombre||'Sin nombre')+'</h3>'+
      '<table>'+group.alimentos.map(food=>
        '<tr><td>'+escapeHtml(food.nombre)+(food.notas?'<span class="notes">'+escapeHtml(food.notas)+'</span>':'')+
        '</td><td class="amount">'+escapeHtml(portionLabel(food))+'</td></tr>').join('')+'</table>').join('')
      :'<p>Esta comida fue guardada sin ingredientes; requiere revisión del nutriólogo.</p>'
    return '<section><h2>'+escapeHtml(meal.nombre)+(meal.hora?' · '+escapeHtml(meal.hora):'')+'</h2>'+
      (meal.descripcion?'<p>'+escapeHtml(meal.descripcion)+'</p>':'')+details+'</section>'
  }).join('')
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
    css+'</style></head><body>'+head+meals+'</body></html>'
}
