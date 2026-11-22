import test from 'node:test'
import assert from 'node:assert/strict'
import { localSignOut } from '../src/features/auth/localSignOut.ts'
import { portionLabel } from '../src/features/nutrition/plans/portionLabel.ts'
import { clinicalForm, clinicalUpdate } from '../src/features/nutrition/clinicalRecordModel.ts'
import { planDocument } from '../src/features/nutrition/plans/planDocument.ts'
import { recipePayload } from '../src/features/clinic/recipeModel.ts'
import { noticeDestination } from '../src/features/notifications/noticeModel.ts'
import { loadTS } from './load-ts.mjs'

test('logout clears the local session even when push removal returns 401 or networking fails',async()=>{
  let cleared=false,deleted=false
  const result=await localSignOut(async()=>{deleted=true},()=>{cleared=true},[async()=>{throw Error('401')},async()=>{throw Error('offline')}])
  assert.equal(deleted,true);assert.equal(cleared,true)
  assert.deepEqual((await result.cleanup).map(r=>r.status),['rejected','rejected'])
})
test('logout reports a secure-store failure instead of pretending that credentials were deleted',async()=>{
  let cleared=false
  await assert.rejects(localSignOut(async()=>{throw Error('storage')},()=>{cleared=true},[]),/storage/)
  assert.equal(cleared,false)
})
test('patient quantities multiply base portions and grams and never concatenate misleading fractions',()=>{
  assert.equal(portionLabel({cantidad:2,porcion:{cantidad:0.5,unidad:'taza',gramos:100,descripcion:'1/2 taza'}}),'1 taza · 200 g')
  assert.equal(portionLabel({cantidad:1.5,porcion:{cantidad:1,unidad:'pieza'}}),'1 1/2 piezas')
  assert.equal(portionLabel({cantidad:0}), 'Cantidad no disponible')
})
test('editing detailed clinical sections preserves siblings and sends real booleans and validated enums',()=>{
  const base={nutricion:{primeraComida:'08:00',aguaPorDia:2,intoleranciasAlimentarias:'Lactosa'},deporte:{diasPorSemana:2},alcohol:{consume:true,frecuencia:'Semanal'}}
  const form=clinicalForm(base);form['nutricion.primeraComida']='09:00';form['alcohol.consume']='false'
  const result=clinicalUpdate(base,form)
  assert.equal(result.nutricion.primeraComida,'09:00');assert.equal(result.nutricion.intoleranciasAlimentarias,'Lactosa');assert.equal(result.nutricion.aguaPorDia,2)
  assert.equal(result.alcohol.consume,false);assert.equal(result.alcohol.frecuencia,'Semanal');assert.equal(result.deporte,undefined)
  form['deporte.diasPorSemana']='8';assert.throws(()=>clinicalUpdate(base,form),/Días|días/)
})
test('PDF preserves stored meal order, instructions and quantities while escaping all patient-provided HTML',()=>{
  const food={cantidad:2,nombre:'<script>food</script>',notas:'Sin <sal>',porcion:{cantidad:0.5,unidad:'taza'},nutrimentos:{kcal:70,proteina:2,carbohidratos:15,grasas:0}}
  const html=planDocument({nombre:'Prueba',fechaInicio:'2026-11-22',comidas:[{nombre:'Cena',hora:'20:30',descripcion:'Nota <comida>',alimentos:[food]},{nombre:'Desayuno',alimentos:[]}]},'<Paciente>')
  assert.ok(html.indexOf('Cena')<html.indexOf('Desayuno'));assert.match(html,/1 taza/);assert.match(html,/Sin &lt;sal&gt;/);assert.match(html,/&lt;Paciente&gt;/);assert.doesNotMatch(html,/<script>/)
})
test('recipe publication payload rejects empty ingredients and invalid quantities before any API mutation',()=>{
  const form={title:'Receta de prueba',description:'',portions:'2',ingredients:[{name:'Tortilla',amount:'0,5',unit:'pieza'}],steps:'Paso uno\nPaso dos',tags:'Sencilla'}
  assert.equal(recipePayload(form).ingredientes[0].cantidad,0.5);assert.equal(recipePayload(form).instrucciones.length,2)
  assert.throws(()=>recipePayload({...form,ingredients:[]}),/Revisa/);assert.throws(()=>recipePayload({...form,portions:'0'}),/Revisa/)
})
test('notification navigation whitelists role destinations instead of trusting server or push routes',()=>{
  assert.equal(noticeDestination('patient','/usuarios'),null);assert.equal(noticeDestination('admin','https://evil.test'),null)
  assert.equal(noticeDestination('nutritionist','/citas'),'/citas');assert.equal(noticeDestination('admin','/moderacion'),'/moderacion')
})
function notificationFixture(){
  const scheduled=new Map(),calls={asked:0}
  const notifications={AndroidImportance:{HIGH:1},SchedulableTriggerInputTypes:{DATE:'date'},setNotificationChannelAsync:async()=>{},requestPermissionsAsync:async()=>{calls.asked++;return{granted:true}},getPermissionsAsync:async()=>({granted:true}),getAllScheduledNotificationsAsync:async()=>[...scheduled].map(([identifier,content])=>({identifier,content})),cancelScheduledNotificationAsync:async id=>scheduled.delete(id),scheduleNotificationAsync:async value=>scheduled.set(value.identifier,value.content)}
  return {scheduled,calls,notifications}
}
test('reminder reconciliation removes cancelled appointments without prompting for permission again',async()=>{
  const f=notificationFixture(),module=loadTS('src/features/notifications/reminders.ts',{'expo-notifications':f.notifications,'expo-secure-store':{},'react-native':{Platform:{OS:'android'}}})
  const future=new Date(Date.now()+30*3600000).toISOString()
  assert.equal(await module.programReminders([{_id:'appointment',inicio:future,estado:'confirmada'}],false),2);assert.equal(f.scheduled.size,2);assert.equal(f.calls.asked,0)
  assert.equal(await module.programReminders([{_id:'appointment',inicio:future,estado:'cancelada'}],false),0);assert.equal(f.scheduled.size,0)
})
test('protected draft chunks commit atomically, retain the previous version on failure and restore distinct IDs',async()=>{
  const values=new Map();let fail=false,id=0
  const storage={WHEN_UNLOCKED_THIS_DEVICE_ONLY:1,getItemAsync:async k=>values.get(k)||null,setItemAsync:async(k,v)=>{if(fail&&k.endsWith('.1'))throw Error('write');assert.ok(Buffer.byteLength(v)<2000);values.set(k,v)},deleteItemAsync:async k=>values.delete(k)}
  const module=loadTS('src/features/nutrition/plans/draftStore.ts',{'expo-secure-store':storage,'expo-crypto':{randomUUID:()=> 'id-'+(++id)}})
  const draft={name:'Borrador',goal:'',date:'2026-11-22',energy:'2000',meals:[{key:'old',nombre:'Desayuno',percentage:'100',preparaciones:[{id:'prep',nombre:'Plato',tipo:'platillo'}],alimentos:[]}]}
  await module.saveDraft('test',draft);assert.equal((await module.loadDraft('test')).draft.name,'Borrador')
  fail=true;await assert.rejects(module.saveDraft('test',{...draft,goal:'x'.repeat(1200)}),/write/);fail=false
  assert.equal((await module.loadDraft('test')).draft.name,'Borrador')
  const restored=module.restoreDraftIds(draft);assert.notEqual(restored.meals[0].key,'old');assert.notEqual(restored.meals[0].preparaciones[0].id,'prep')
  await module.removeDraft('test');assert.equal(await module.loadDraft('test'),null)
})
