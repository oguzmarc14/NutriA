export type RecordField = { path: string; label: string; type?: 'number' | 'boolean' | 'time' | 'options' | 'multiple'; options?: readonly (readonly [string, string])[] }
export const habitDetails: Record<string,string> = {
  'tratamientoFarmacologico.descripcion':'tratamientoFarmacologico.usa',
  'tabaquismo.frecuenciaSemanal':'tabaquismo.fuma',
  'alcohol.frecuencia':'alcohol.consume',
  'drogas.descripcion':'drogas.consume',
  'anabolicos.descripcion':'anabolicos.consume',
  'suplementos.descripcion':'suplementos.consume',
}
export const objectives = [['perdida_peso','Pérdida de peso'],['incremento_masa','Incremento de masa'],['imagen_personal','Imagen personal'],['salud','Salud'],['rendimiento_deportivo','Rendimiento deportivo'],['control_enfermedades','Control de enfermedades'],['otro','Otro']] as const
export const recordSections: { label: string; fields: RecordField[] }[] = [
  { label: 'Farmacológico y hábitos', fields: [
    {path:'tratamientoFarmacologico.usa',label:'Tratamiento farmacológico actual',type:'boolean'}, {path:'tratamientoFarmacologico.descripcion',label:'Tratamiento farmacológico'},
    {path:'tabaquismo.fuma',label:'Tabaquismo',type:'boolean'}, {path:'tabaquismo.frecuenciaSemanal',label:'Frecuencia semanal de tabaquismo'},
    {path:'alcohol.consume',label:'Consumo de alcohol',type:'boolean'}, {path:'alcohol.frecuencia',label:'Frecuencia de alcohol'},
    {path:'drogas.consume',label:'Uso de drogas',type:'boolean'}, {path:'drogas.descripcion',label:'Descripción del consumo'},
    {path:'anabolicos.consume',label:'Uso de anabólicos',type:'boolean'}, {path:'anabolicos.descripcion',label:'Anabólicos'},
    {path:'suplementos.consume',label:'Suplementos',type:'boolean'}, {path:'suplementos.descripcion',label:'Suplementos'},
  ] },
  { label: 'Nutrición y objetivos', fields: [
    {path:'nutricion.primeraComida',label:'Primera comida',type:'time'}, {path:'nutricion.ultimaComida',label:'Última comida',type:'time'},
    {path:'nutricion.numeroComidasDia',label:'Comidas al día',type:'number'}, {path:'nutricion.comidaFavorita',label:'Comida favorita'}, {path:'nutricion.comidaDisgusta',label:'Comidas que no le gustan'},
    {path:'nutricion.cafePorDia',label:'Café por día'}, {path:'nutricion.bebidasEnergeticasSemana',label:'Bebidas energéticas por semana'},
    {path:'nutricion.bebidasAzucaradasSemana',label:'Bebidas azucaradas por semana'}, {path:'nutricion.intoleranciasAlimentarias',label:'Intolerancias alimentarias'},
    {path:'nutricion.objetivoPrincipal',label:'Objetivo principal',type:'options',options:objectives}, {path:'nutricion.objetivos',label:'Objetivos de la dieta',type:'multiple',options:objectives}, {path:'nutricion.objetivoOtro',label:'Describe otro objetivo'},
  ] },
  { label: 'Actividad física y deporte', fields: [
    {path:'deporte.lugarEntrenamiento',label:'Lugar de entrenamiento',type:'options',options:[['casa','Casa'],['gym','Gimnasio'],['parque','Parque'],['otro','Otro']]},
    {path:'deporte.lugarOtro',label:'Otro lugar'}, {path:'deporte.diasPorSemana',label:'Días por semana (0 a 7)',type:'number'},
    {path:'deporte.ejercicioRealizar',label:'Ejercicio realizado'}, {path:'deporte.nivelExperiencia',label:'Experiencia',type:'options',options:[['principiante','Principiante'],['principiante_intermedio','Principiante/intermedio'],['intermedio','Intermedio'],['avanzado','Avanzado']]},
  ] },
]
export function valueAt(record: Record<string, unknown> | null, path: string): unknown {
  const [section, name] = path.split('.')
  const data = record?.[section]
  return name ? data && typeof data === 'object' ? (data as Record<string, unknown>)[name] : undefined : data
}
export function recordText(record: Record<string, unknown> | null, path: string) {
  const value = valueAt(record,path)
  return Array.isArray(value) ? value.join(',') : value == null ? '' : String(value)
}
export function detailedUpdate(base: Record<string, unknown> | null, form: Record<string,string>) {
  const update: Record<string, Record<string,unknown>> = {}
  for (const field of recordSections.flatMap(section => section.fields)) {
    const value = (form[field.path] || '').trim()
    if (value === recordText(base,field.path)) continue
    const [section,name] = field.path.split('.')
    if (!update[section]) update[section] = { ...(typeof base?.[section] === 'object' ? base[section] as Record<string,unknown> : {}) }
    let next: unknown = value
    if (field.type === 'boolean') next = value === '' ? undefined : value === 'true'
    if (field.type === 'number') { next = value === '' ? undefined : Number(value.replace(',','.')); if (next !== undefined && (!Number.isFinite(next) || Number(next) < 0 || !Number.isInteger(next) || field.path === 'deporte.diasPorSemana' && Number(next) > 7)) throw new Error('Revisa ' + field.label.toLowerCase()) }
    if (field.type === 'multiple') next = value ? value.split(',') : []
    if (field.type === 'time' && value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Revisa el horario de ' + field.label.toLowerCase())
    if (field.options && value && (field.type === 'multiple' ? value.split(',') : [value]).some(v => !field.options!.some(([key]) => key === v))) throw new Error('Revisa ' + field.label.toLowerCase())
    update[section][name] = next
  }
  return update
}
