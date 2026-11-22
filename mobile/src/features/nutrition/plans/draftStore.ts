import * as SecureStore from 'expo-secure-store'
import { randomUUID } from 'expo-crypto'
import type { DraftPlan } from './models'
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
type Metadata = { revision: string; count: number; savedAt: number }
const queues = new Map<string,Promise<unknown>>()
const manifestKey = (key:string) => key + '.manifest'
const chunkKey = (key:string,revision:string,index:number) => key + '.' + revision + '.' + index
function serial<T>(key:string,action:()=>Promise<T>):Promise<T> {
  const next=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(action)
  queues.set(key,next);void next.finally(()=>{if(queues.get(key)===next)queues.delete(key)}).catch(()=>{})
  return next
}
function metadata(raw:string|null):Metadata|null {
  if(!raw)return null
  const value=JSON.parse(raw) as Metadata
  if(!/^[a-zA-Z0-9-]+$/.test(value.revision)||!Number.isInteger(value.count)||value.count<1||value.count>512||!Number.isFinite(value.savedAt))throw new Error('El borrador local no se pudo leer.')
  return value
}
async function removeChunks(key:string,meta:Metadata) { await Promise.all(Array.from({length:meta.count},(_,i)=>SecureStore.deleteItemAsync(chunkKey(key,meta.revision,i),options))) }
export function validDraft(value:unknown):value is DraftPlan {
  if(!value||typeof value!=='object')return false
  const p=value as DraftPlan
  return [p.name,p.goal,p.date,p.energy].every(v=>typeof v==='string')&&Array.isArray(p.meals)&&p.meals.length<=100&&p.meals.every(m=>typeof m.key==='string'&&typeof m.nombre==='string'&&typeof m.percentage==='string'&&Array.isArray(m.alimentos)&&m.alimentos.length<=500&&m.alimentos.every(f=>typeof f.key==='string'&&typeof f.nombre==='string'&&typeof f.quantity==='string'&&f.nutrimentos&&['kcal','proteina','carbohidratos','grasas'].every(k=>Number.isFinite(f.nutrimentos[k as keyof typeof f.nutrimentos])))&&(!m.preparaciones||Array.isArray(m.preparaciones)&&m.preparaciones.every(prep=>typeof prep.id==='string'&&typeof prep.nombre==='string'&&['platillo','bebida'].includes(prep.tipo))))
}
export function saveDraft(key:string,draft:DraftPlan) {return serial(key,async()=>{
  const text=JSON.stringify(draft)
  if(text.length>200000)throw new Error('El borrador supera el tamaño permitido para guardarlo en el teléfono. Puedes guardar el plan en NutriA.')
  const previous=metadata(await SecureStore.getItemAsync(manifestKey(key),options)),revision=randomUUID(),count=Math.ceil(text.length/400)
  try{
    for(let i=0;i<count;i++)await SecureStore.setItemAsync(chunkKey(key,revision,i),text.slice(i*400,(i+1)*400),options)
    const meta={revision,count,savedAt:Date.now()}
    await SecureStore.setItemAsync(manifestKey(key),JSON.stringify(meta),options)
    if(previous)await removeChunks(key,previous).catch(()=>{})
    return meta.savedAt
  }catch(error){await removeChunks(key,{revision,count,savedAt:0}).catch(()=>{});throw error}
})}
export function loadDraft(key:string) {return serial(key,async()=>{
  const meta=metadata(await SecureStore.getItemAsync(manifestKey(key),options));if(!meta)return null
  if(Date.now()-meta.savedAt>7*86400000){await SecureStore.deleteItemAsync(manifestKey(key),options);await removeChunks(key,meta);return null}
  const parts=await Promise.all(Array.from({length:meta.count},(_,i)=>SecureStore.getItemAsync(chunkKey(key,meta.revision,i),options)))
  if(parts.some(p=>p===null))throw new Error('El borrador local está incompleto.')
  const draft:unknown=JSON.parse(parts.join(''));if(!validDraft(draft))throw new Error('El borrador local tiene un formato inválido.')
  return {draft,savedAt:meta.savedAt}
})}
export function removeDraft(key:string) {return serial(key,async()=>{
  const meta=metadata(await SecureStore.getItemAsync(manifestKey(key),options));await SecureStore.deleteItemAsync(manifestKey(key),options);if(meta)await removeChunks(key,meta)
})}
export function restoreDraftIds(draft:DraftPlan):DraftPlan {
  const prefix='restored-'+randomUUID()
  return {...draft,meals:draft.meals.map((meal,index)=>{
    const preparationMap=new Map((meal.preparaciones||[]).map((prep,i)=>[prep.id,prefix+'-prep-'+index+'-'+i]))
    return {...meal,key:prefix+'-meal-'+index,preparaciones:meal.preparaciones?.map(prep=>({...prep,id:preparationMap.get(prep.id)!})),alimentos:meal.alimentos.map((food,i)=>({...food,key:prefix+'-food-'+index+'-'+i,preparacionId:preparationMap.get(food.preparacionId||'')||food.preparacionId}))}
  })}
}
