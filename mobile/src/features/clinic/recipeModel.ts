export type RecipeDraft = { title:string; description:string; portions:string; ingredients:{name:string;amount:string;unit:string}[]; steps:string; tags:string }
export function recipePayload(form:RecipeDraft) {
  const porciones=Number(form.portions), instrucciones=form.steps.split('\n').map(s=>s.trim()).filter(Boolean)
  const ingredientes=form.ingredients.map(item=>({nombre:item.name.trim(),cantidad:Number(item.amount.replace(',','.')),unidad:item.unit.trim()}))
  const etiquetas=form.tags.split(',').map(t=>t.trim()).filter(Boolean)
  if(form.title.trim().length<3 || form.title.trim().length>120 || form.description.trim().length>1200 || !Number.isInteger(porciones) || porciones<1 || porciones>100 || !instrucciones.length || instrucciones.length>30 || instrucciones.some(step=>step.length>1000) || !ingredientes.length || ingredientes.length>100 || ingredientes.some(i=>!i.nombre || i.nombre.length>120 || !Number.isFinite(i.cantidad) || i.cantidad<=0 || !i.unidad || i.unidad.length>40) || etiquetas.length>12 || etiquetas.some(t=>t.length>40)) throw new Error('Revisa título, ingredientes, cantidades positivas, porciones de 1 a 100 y los pasos de preparación.')
  return {titulo:form.title.trim(),descripcion:form.description.trim(),porciones,ingredientes,instrucciones,etiquetas}
}
