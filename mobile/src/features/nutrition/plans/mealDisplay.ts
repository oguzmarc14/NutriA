import type { Food, Meal } from './models.ts'

/** Mantiene cada ingrediente en su preparación, incluso en dietas antiguas sin preparacionId. */
export function mealPreparationGroups(meal: Pick<Meal,'alimentos'|'preparaciones'|'platillo'>) {
  const preparations = (meal.preparaciones || []).map(item=>({
    id:item.id,nombre:item.nombre,tipo:item.tipo,alimentos:[] as Food[],
  }))
  if(!preparations.length)preparations.push({
    id:'',nombre:meal.platillo||'Platillo',tipo:'platillo',alimentos:[],
  })
  for(const food of meal.alimentos || []){
    const group=preparations.find(p=>p.id===food.preparacionId)||preparations[0]
    group.alimentos.push(food)
  }
  return preparations.filter(group=>group.alimentos.length>0)
}
