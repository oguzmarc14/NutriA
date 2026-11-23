import { detailedUpdate, recordSections, recordText, valueAt } from './recordSections.ts'

export const clinicalFields = [
  ['antecedentesPersonales','Antecedentes personales'],
  ['antecedentesFamiliares','Antecedentes familiares'],
  ['alergias','Alergias'],
  ['enfermedades','Enfermedades actuales'],
  ['medicamentos','Medicamentos'],
  ['cirugias','Cirugías'],
  ['lesionesActuales','Lesiones actuales'],
  ['padecimientos','Otros padecimientos'],
  ['observaciones','Observaciones generales'],
] as const

export const optionalClinicalFields = clinicalFields.filter(([key])=>key!=='observaciones')
  .map(([key])=>key)
export const optionalNutritionFields = [
  'nutricion.comidaFavorita','nutricion.comidaDisgusta','nutricion.cafePorDia',
  'nutricion.bebidasEnergeticasSemana','nutricion.bebidasAzucaradasSemana',
  'nutricion.intoleranciasAlimentarias','deporte.ejercicioRealizar',
] as const

export function clinicalActive(record: Record<string, unknown> | null): string[] {
  const stored=new Set(Array.isArray(record?.camposConDetalle)
    ? record.camposConDetalle.filter((x):x is string=>typeof x==='string') : [])
  for(const key of [...optionalClinicalFields,...optionalNutritionFields]){
    if(String(valueAt(record,key)??'').trim())stored.add(key)
  }
  return [...stored]
}
export function clinicalForm(record: Record<string, unknown> | null): Record<string,string> {
  const values=Object.fromEntries([
    ...clinicalFields.map(([key])=>[key,typeof record?.[key]==='string'?record[key]:'']),
    ...recordSections.flatMap(section=>section.fields.map(field=>[field.path,recordText(record,field.path)])),
  ]) as Record<string,string>
  if (!values['nutricion.objetivos'] && values['nutricion.objetivoPrincipal'])
    values['nutricion.objetivos']=values['nutricion.objetivoPrincipal']
  return values
}
/** Envía solo campos editados. La lista de Sí sin descripción es explícita y no se pierde al guardar. */
export function clinicalUpdate(base: Record<string,unknown>|null, form: Record<string,string>, activeDetails?: readonly string[]) {
  const details=new Set(activeDetails ?? clinicalActive(base))
  if (!base && !Object.values(form).some(value=>value.trim()) && !details.size)
    throw new Error('Registra los datos clínicos revisados antes de crear el expediente.')
  const update:Record<string,unknown>={}
  for(const [key] of clinicalFields){
    const value=(form[key]||'').trim(),original=typeof base?.[key]==='string'?base[key].trim():''
    if(value===original)continue
    update[key]=value
    if(activeDetails===undefined){if(value)details.add(key);else details.delete(key)}
  }
  const nested=detailedUpdate(base,form)
  Object.assign(update,nested)
  if(activeDetails===undefined) {
    for(const key of optionalNutritionFields){
      const value=(form[key]||'').trim()
      if(value!==recordText(base,key)){
        if(value)details.add(key)
        else details.delete(key)
      }
    }
  }
  return {...update,camposConDetalle:[...details]}
}
