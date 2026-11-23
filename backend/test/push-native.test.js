const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path')
function fixture({sendError,receiptError,flag='true',role='nutritionist'}={}){
  const sent=[],stored=[],removed=[],notices=[],receiptsRemoved=[]
  const device={_id:'device',user:'staff',token:'ExpoPushToken[test]',platform:'android'}
  const Device={find:()=>({limit:()=>({lean:async()=>[device]})}),deleteOne:async filter=>removed.push(filter)}
  const Receipt={updateOne:async(...args)=>stored.push(args),find:()=>({sort:()=>({limit:()=>({lean:async()=>[{_id:'receipt',ticket:'ticket',device:'device',user:'original-owner',token:'ExpoPushToken[original]'}]})})}),deleteOne:async q=>receiptsRemoved.push(q)}
  const User={find:()=>({select:()=>({lean:async()=>[{_id:'staff',role}],limit:()=>({lean:async()=>[{_id:'staff',role:'nutritionist'}]})})})}
  const deps={'../models/PushDevice':Device,'../models/PushReceipt':Receipt,'../models/User':User,'../models/Notification':{insertMany:async docs=>notices.push(...docs)}}
  const module={exports:{}}
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/services/push.service.js'),'utf8'),{
    module,require:name=>deps[name],process:{env:{PUSH_NOTIFICATIONS_ENABLED:flag}},console:{error(){}},Date,String,Promise,AbortSignal,setTimeout,
    fetch:async(url,options)=>{sent.push({url,body:JSON.parse(options.body)});return{ok:true,status:200,json:async()=>url.endsWith('getReceipts')?{data:{ticket:receiptError?{status:'error',details:{error:receiptError}}:{status:'ok'}}}:{data:sendError?{status:'error',details:{error:sendError}}:{status:'ok',id:'ticket'}}}},
  })
  return{service:module.exports,sent,stored,removed,notices,receiptsRemoved}
}
test('appointment events create a private inbox item and generic role-aware push without patient names',async()=>{
  const f=fixture();await f.service.notificarCita({_id:'appointment',patient:'patient-id',nutritionist:'staff',notes:'PRIVATE NOTES',name:'PATIENT NAME'})
  assert.equal(f.notices.length,1);assert.equal(f.notices[0].user,'staff');assert.equal(f.notices[0].route,'/citas')
  assert.equal(f.sent.length,1);assert.equal(f.sent[0].body.data.recipientUser,'staff');assert.equal(f.sent[0].body.data.route,'/citas')
  assert.doesNotMatch(JSON.stringify(f.sent),/PRIVATE NOTES|PATIENT NAME/);assert.equal(f.stored.length,1)
})
test('the inbox still works when remote push is disabled',async()=>{
  const f=fixture({flag:'false'});await f.service.notificarCita({patient:'patient-id',nutritionist:'staff'})
  assert.equal(f.notices.length,1);assert.equal(f.sent.length,0)
})
test('DeviceNotRegistered removes only the exact device-owner-token association',async()=>{
  const f=fixture({sendError:'DeviceNotRegistered'});await f.service.notificarCita({patient:'patient-id',nutritionist:'staff'})
  assert.deepEqual(JSON.parse(JSON.stringify(f.removed[0])),{_id:'device',user:'staff',token:'ExpoPushToken[test]'})
})
test('receipt invalidation cannot delete a token that was reassigned to a different account',async()=>{
  const f=fixture({receiptError:'DeviceNotRegistered'});await f.service.processReceipts()
  assert.deepEqual(JSON.parse(JSON.stringify(f.removed[0])),{_id:'device',user:'original-owner',token:'ExpoPushToken[original]'})
  assert.equal(f.receiptsRemoved.length,1)
})

test('a cancelled appointment and an assigned diet create distinct patient notices',async()=>{
  const f=fixture({role:'patient'})
  await f.service.notificarCita({patient:'patient-id',nutritionist:'staff',estado:'cancelada'})
  await f.service.notificarDietaAsignada('patient-id')
  await f.service.notificarDietaAsignada('patient-id',true)
  assert.deepEqual(f.notices.map(({titulo,route})=>[titulo,route]),[
    ['Cita cancelada','/mis-citas'],
    ['Nueva dieta asignada','/mi-plan'],
    ['Dieta actualizada','/mi-plan'],
  ])
  assert.equal(f.sent.length,3)
  assert.ok(f.sent.every(({body})=>body.title==='NutriA' && !/cita|dieta/i.test(body.body)))
})
