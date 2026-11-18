const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const crypto=require('node:crypto')
const {z}=require('zod')

const source=fs.readFileSync(path.join(__dirname,'../src/controllers/recuperacion.controller.js'),'utf8')
const authRoute=fs.readFileSync(path.join(__dirname,'../src/routes/auth.routes.js'),'utf8')
const userSchema=fs.readFileSync(path.join(__dirname,'../src/models/User.js'),'utf8')
const middleware=fs.readFileSync(path.join(__dirname,'../src/middleware/auth.middleware.js'),'utf8')
const MAIL='paciente@ejemplo.com'
function fixture({existe=true,reciente=false,falloEmail=false,tokenConsumido=false}={}){
  const calls={envios:[],saves:0,reset:0,rollback:0,hash:null,filter:null}
  let actualHash=null
  const user={
    _id:'abc',name:'Paciente',email:MAIL,
    passwordResetRequestedAt:reciente?new Date(Date.now()-60000):null,
    passwordResetToken:null,passwordResetExpiresAt:null,
    async save(){calls.saves++;actualHash=this.passwordResetToken},
  }
  const User={
    findOne(query){
      assert.equal(query.role,'patient')
      assert.equal(query.authProvider,'password')
      return {select:async()=>existe?user:null}
    },
    async updateOne(query,update){
      calls.rollback++
      assert.equal(query.passwordResetToken,actualHash)
      assert.ok('$set' in update)
      actualHash=null
    },
    async findOneAndUpdate(query,update){
      calls.reset++
      calls.filter=query
      if(tokenConsumido || query.passwordResetToken!==actualHash || !actualHash)return null
      assert.ok(query.passwordResetExpiresAt.$gt instanceof Date)
      assert.equal(query.role,'patient')
      assert.equal(query.active,true)
      assert.equal(query.authProvider,'password')
      assert.match(update.$set.password,/^hashed:/)
      assert.ok(update.$set.passwordChangedAt instanceof Date)
      assert.ok(Object.keys(update.$unset).includes('passwordResetToken'))
      actualHash=null
      return user
    },
  }
  const deps={
    crypto,bcryptjs:{hash:async value=>'hashed:'+value},zod:{z},
    '../models/User':User,
    '../services/email.service':{
      async enviarRecuperacionPaciente(args){
        calls.envios.push(args)
        if(falloEmail)throw new Error('no se pudo enviar')
      },
    },
  }
  const context={
    module:{exports:{}},require(name){
      assert.ok(Object.prototype.hasOwnProperty.call(deps,name),'Unmocked '+name)
      return deps[name]
    },console:{error(){}},Date,process,
  }
  vm.runInNewContext(source,context,{filename:'recuperacion.controller.js'})
  async function invoke(name,body){
    const res={statusCode:200,body:null,headers:{},
      set(k,v){this.headers[k]=v;return this},
      status(v){this.statusCode=v;return this},json(x){this.body=x;return this}}
    let thrown
    await context.module.exports[name]({body},res,e=>{thrown=e})
    if(thrown)throw thrown
    return res
  }
  return {invoke,calls,user,getHash:()=>actualHash}
}
test('HU-03 expone solicitud y restablecimiento sólo para pacientes',()=>{
  assert.match(authRoute,/router\.post\('\/paciente\/recuperar', solicitarRestablecimiento\)/)
  assert.match(authRoute,/router\.post\('\/paciente\/restablecer', restablecerContrasena\)/)
  assert.match(userSchema,/passwordResetToken: \{ type: String, select: false/)
  assert.match(middleware,/user\.passwordChangedAt/)
})
test('HU-03 no revela la existencia de un correo y valida su formato',async()=>{
  const a=fixture({existe:false}),b=fixture()
  const desconocido=await a.invoke('solicitarRestablecimiento',{email:'otro@ejemplo.com'})
  const conocido=await b.invoke('solicitarRestablecimiento',{email:MAIL})
  assert.equal(desconocido.statusCode,200)
  assert.equal(conocido.statusCode,200)
  assert.equal(desconocido.body.message,conocido.body.message)
  assert.equal(a.calls.envios.length,0)
  assert.equal(b.calls.envios.length,1)
  const invalido=await b.invoke('solicitarRestablecimiento',{email:'incorrecto'})
  assert.equal(invalido.statusCode,400)
})
test('HU-03 expira a los 30 minutos y limita reenvíos a 10 minutos',async()=>{
  const a=fixture()
  const start=Date.now()
  await a.invoke('solicitarRestablecimiento',{email:MAIL})
  assert.match(a.calls.envios[0].token,/^[a-f0-9]{64}$/)
  assert.equal(a.calls.envios[0].email,MAIL)
  assert.notEqual(a.getHash(),a.calls.envios[0].token)
  assert.equal(a.getHash(),crypto.createHash('sha256').update(a.calls.envios[0].token).digest('hex'))
  assert.ok(a.user.passwordResetExpiresAt.getTime()-start <= 30*60*1000+2000)
  assert.ok(a.user.passwordResetExpiresAt.getTime()-start > 29*60*1000)
  const b=fixture({reciente:true})
  await b.invoke('solicitarRestablecimiento',{email:MAIL})
  assert.equal(b.calls.envios.length,0)
  assert.equal(b.calls.saves,0)
})
test('HU-03 correo fallido no confirma identidad y recupera estado anterior',async()=>{
  const a=fixture({falloEmail:true})
  const r=await a.invoke('solicitarRestablecimiento',{email:MAIL})
  assert.equal(r.statusCode,200)
  assert.match(r.body.message,/Si existe/)
  assert.equal(a.calls.rollback,1)
})
test('HU-03 token es atómico, de un solo uso y contraseña se almacena hasheada',async()=>{
  const f=fixture()
  await f.invoke('solicitarRestablecimiento',{email:MAIL})
  const token=f.calls.envios[0].token
  const res=await f.invoke('restablecerContrasena',{token,password:'ContraseñaSegura123!'})
  assert.equal(res.statusCode,200)
  assert.equal(f.calls.reset,1)
  const repetido=await f.invoke('restablecerContrasena',{token,password:'OtraContraseñaSegura123!'})
  assert.equal(repetido.statusCode,400)
  assert.match(repetido.body.message,/utilizado/)
  const mal=await f.invoke('restablecerContrasena',{token:'x',password:'abc'})
  assert.equal(mal.statusCode,400)
})
