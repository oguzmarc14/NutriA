const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const {z}=require('zod')
const source=fs.readFileSync(path.join(__dirname,'../src/controllers/usuarios.controller.js'),'utf8')
const route=fs.readFileSync(path.join(__dirname,'../src/routes/usuarios.routes.js'),'utf8')
const SELF='507f1f77bcf86cd799439011'
const OTHER='507f191e810c19729de860ea'
function fixture({rol='nutritionist',activos=2,conPacientes=false,id=OTHER}={}){
  const calls={saved:false}
  const usuario={
    _id:id,id,role:rol,active:true,authProvider:'google',name:'Ejemplo',email:'uno@ejemplo.com',
    async save(){calls.saved=true},
  }
  const deps={
    zod:{z},mongoose:{isValidObjectId:s=>/^[0-9a-f]{24}$/i.test(s)},
    '../models/User':{
      findOne:()=>({select:async()=>usuario}),
      countDocuments:async()=>activos,
    },
    '../models/Pacientes':{exists:async()=>conPacientes},
  }
  const context={module:{exports:{}},require(s){assert.ok(s in deps,'Unmocked '+s);return deps[s]},String}
  vm.runInNewContext(source,context,{filename:'usuarios.controller.js'})
  async function call({role='admin',target=id}={}){
    const res={statusCode:200,body:null,status(n){this.statusCode=n;return this},json(x){this.body=x;return this}}
    let error
    await context.module.exports.actualizarRolUsuario({
      params:{id:target},body:{role},user:{id:SELF,_id:SELF},
    },res,e=>{error=e})
    if(error)throw error
    return res
  }
  return {call,calls,usuario}
}
test('HU-04 sólo administradores pueden modificar rol',()=>{
  assert.match(route,/router\.use\(allowRoles\('admin'\)\)/)
  assert.match(route,/router\.patch\('\/:id\/rol', actualizarRolUsuario\)/)
})
test('HU-04 permite promover nutriólogo sin pacientes a administrador',async()=>{
  const f=fixture()
  const r=await f.call({role:'admin'})
  assert.equal(r.statusCode,200)
  assert.equal(f.usuario.role,'admin')
  assert.equal(f.calls.saved,true)
})
test('HU-04 protege cuenta propia y último administrador',async()=>{
  const self=fixture({rol:'admin',id:SELF})
  assert.equal((await self.call({role:'nutritionist',target:SELF})).statusCode,409)
  const last=fixture({rol:'admin',activos:1})
  assert.equal((await last.call({role:'nutritionist'})).statusCode,409)
  assert.equal(last.calls.saved,false)
})
test('HU-04 no deja sin nutriólogo a pacientes activos',async()=>{
  const f=fixture({conPacientes:true})
  assert.equal((await f.call({role:'admin'})).statusCode,409)
  assert.equal(f.calls.saved,false)
})
test('HU-04 no admite otros roles ni IDs inválidos',async()=>{
  const f=fixture()
  assert.equal((await f.call({role:'patient'})).statusCode,400)
  assert.equal((await f.call({target:'mal'})).statusCode,400)
})
