/** Presenta alimentos por preparación, conservando ingredientes de planes antiguos sin IDs. */
export function agruparPreparaciones(comida) {
  const grupos = (comida?.preparaciones || []).map(item => ({
    id: item.id, nombre: item.nombre || '', tipo: item.tipo === 'bebida' ? 'bebida' : 'platillo',
    alimentos: [],
  }))
  if (!grupos.length) grupos.push({
    id: '', nombre: comida?.platillo || 'Platillo', tipo: 'platillo', alimentos: [],
  })
  for (const food of comida?.alimentos || []) {
    const destino = grupos.find(item => item.id === food.preparacionId) || grupos[0]
    destino.alimentos.push(food)
  }
  return grupos.filter(item => item.alimentos.length > 0)
}
