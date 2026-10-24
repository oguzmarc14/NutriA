require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Patient = require('../models/Pacientes')
const Medicion = require('../models/Medicion')
const Expediente = require('../models/ExpedienteClinico')
const Alimento = require('../models/Alimento')
const Plan = require('../models/PlanAlimenticio')
const Seguimiento = require('../models/SeguimientoComida')

const uri = process.env.MONGODB_URI || ''
const local = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/nutria(?:\?|$)/i.test(uri)
if (!local) {
  console.error('SEGURIDAD: solo se permite mongodb://localhost:27017/nutria (o 127.0.0.1).')
  process.exit(1)
}

const dominio = 'nutria-demo.test'
const claveDemo = 'NutriADemo2026!'
const fecha = (dia) => new Date(`${dia}T12:00:00.000Z`)
const pacientesDemo = [
  { nombre: 'Ana López (Demo)', email: `ana@${dominio}`, sexo: 'female', nacimiento: '1998-03-14', pesos: [78.2, 76.8, 75.5, 74.1], talla: 1.64, objetivo: 'Pérdida de peso gradual' },
  { nombre: 'Carlos Pérez (Demo)', email: `carlos@${dominio}`, sexo: 'male', nacimiento: '1993-07-02', pesos: [68.5, 69.4, 70.2, 71.0], talla: 1.75, objetivo: 'Incrementar masa muscular' },
  { nombre: 'María Torres (Demo)', email: `maria@${dominio}`, sexo: 'female', nacimiento: '1987-11-20', pesos: [82.0, 81.5, 80.1, 79.3], talla: 1.60, objetivo: 'Mejorar hábitos alimenticios' },
  { nombre: 'Diego Ramírez (Demo)', email: `diego@${dominio}`, sexo: 'male', nacimiento: '2000-02-10', pesos: [91.0, 89.5, 88.2, 87.1], talla: 1.80, objetivo: 'Mejorar composición corporal' },
  { nombre: 'Sofía Martínez (Demo)', email: `sofia@${dominio}`, sexo: 'female', nacimiento: '1996-09-05', pesos: [60.0, 60.5, 61.2, 61.8], talla: 1.67, objetivo: 'Aumentar peso gradualmente' },
]
const catalogo = [
  ['Tortilla de maíz','Cereales',1,'pieza',30,64,1.7,13,0.8],
  ['Bistec de res cocido','Alimentos de origen animal',100,'g',100,210,28,0,10],
  ['Cebolla','Verduras',30,'g',30,12,0.3,2.8,0],
  ['Gelatina preparada','Azúcares',1,'taza',150,85,2,19,0],
  ['Agua natural','Bebidas',1,'vaso',250,0,0,0,0],
  ['Limón','Frutas',1,'pieza',40,12,0.4,4,0.1],
  ['Huevo','Alimentos de origen animal',1,'pieza',50,72,6.3,0.4,4.8],
  ['Pan integral','Cereales',1,'rebanada',30,75,3,13,1.2],
  ['Pechuga de pollo cocida','Alimentos de origen animal',100,'g',100,165,31,0,3.6],
  ['Arroz cocido','Cereales',100,'g',100,130,2.7,28,0.3],
  ['Manzana','Frutas',1,'pieza',180,95,0.5,25,0.3],
  ['Leche semidescremada','Leche',1,'vaso',240,120,8,12,4.5],
  ['Avena','Cereales',40,'g',40,150,5,27,3],
  ['Plátano','Frutas',1,'pieza',120,105,1.3,27,0.4],
  ['Frijoles cocidos','Leguminosas',100,'g',100,110,7.5,20,0.5],
  ['Lechuga','Verduras',50,'g',50,8,0.7,1.5,0.1],
]
function alimento(nombre, cantidad = 1) {
  const row = catalogo.find((x) => x[0] === nombre)
  const [, grupo, base, unidad, gramos, kcal, proteina, carbohidratos, grasas] = row
  return { tipo: 'personalizado', nombre, grupo,
    cantidad, porcion: { cantidad: base, unidad, gramos, descripcion: `${base} ${unidad}` },
    nutrimentos: { kcal, proteina, carbohidratos, grasas }, notas: '' }
}
function comidasDelDia() {
  return [
    { nombre: 'Desayuno', platillo: 'Huevos con pan integral', hora: '08:00', descripcion: 'Ejemplo de desayuno', alimentos: [alimento('Huevo',2), alimento('Pan integral',2), alimento('Leche semidescremada')] },
    { nombre: 'Colación', platillo: 'Manzana', hora: '11:00', alimentos: [alimento('Manzana')] },
    { nombre: 'Comida', platillo: 'Tacos de bistec con gelatina y agua de limón', hora: '14:00', descripcion: 'Ejemplo de varios componentes; el formulario de múltiples platillos aún requiere implementación.', alimentos: [alimento('Tortilla de maíz',3), alimento('Bistec de res cocido'), alimento('Cebolla'), alimento('Gelatina preparada'), alimento('Agua natural',2), alimento('Limón')] },
    { nombre: 'Colación vespertina', platillo: 'Plátano', hora: '17:00', alimentos: [alimento('Plátano')] },
    { nombre: 'Cena', platillo: 'Pollo con arroz y ensalada', hora: '20:00', alimentos: [alimento('Pechuga de pollo cocida'), alimento('Arroz cocido'), alimento('Lechuga')] },
  ]
}
async function main() {
  await mongoose.connect(uri)
  console.log('Conectado exclusivamente a NutriA LOCAL:', mongoose.connection.name)
  const nutriologos = []
  for (const [nombre, email] of [
    ['Laura Gómez (Demo)',`laura@${dominio}`],
    ['Roberto Díaz (Demo)',`roberto@${dominio}`],
  ]) {
    const usuario = await User.findOneAndUpdate(
      { email }, { $set: { name:nombre, role:'nutritionist', authProvider:'google', active:true, accountStatus:'active' } },
      { upsert:true, new:true, runValidators:true, setDefaultsOnInsert:true })
    nutriologos.push(usuario)
  }
  for (let i=0; i<pacientesDemo.length; i++) {
    const d=pacientesDemo[i], nutriologo=nutriologos[i%nutriologos.length]
    const paciente = await Patient.findOneAndUpdate(
      { email:d.email }, { $set: { name:d.nombre, nutritionist:nutriologo._id, email:d.email, sex:d.sexo, birthDate:fecha(d.nacimiento), active:true, notes:'DATOS FICTICIOS PARA PRUEBAS' } },
      { upsert:true, new:true, runValidators:true, setDefaultsOnInsert:true })
    let usuario = await User.findOne({ email:d.email }).select('+password')
    if (!usuario) usuario = new User({ email:d.email })
    Object.assign(usuario,{ name:d.nombre, role:'patient', authProvider:'password', patient:paciente._id, active:true, accountStatus:'active', password:claveDemo })
    await usuario.save() // dispara hash bcrypt del modelo
    await Expediente.findOneAndUpdate(
      { paciente:paciente._id }, { $set: { nutritionist:nutriologo._id, antecedentesPersonales:'Sin antecedentes reportados (demo)', nutricion:{ numeroComidasDia:5, objetivoPrincipal:'salud' }, observaciones:'Expediente ficticio de prueba' } },
      { upsert:true, runValidators:true, setDefaultsOnInsert:true })
    // Reemplazamos únicamente mediciones de demo previamente creadas para estos pacientes.
    await Medicion.deleteMany({ paciente:paciente._id })
    const fechas=['2026-09-05','2026-09-19','2026-10-03','2026-10-17']
    for(let j=0;j<fechas.length;j++){
      const peso=d.pesos[j]
      await Medicion.create({ paciente:paciente._id, nutritionist:nutriologo._id, edad: 26+i*3,
        esPrimeraMedicion:j===0, nivelActividadFisica:2+(i%3), peso, estatura:d.talla,
        imc:Number((peso/(d.talla*d.talla)).toFixed(2)), grasaCorporal:25-j*0.6,
        masaMuscular:28+j*0.3, fecha:fecha(fechas[j]) })
    }
    const nombrePlan=`PLAN DEMO - ${d.nombre}`
    const plan = await Plan.findOneAndUpdate(
      { paciente:paciente._id, nombre:nombrePlan },
      { $set: { nutritionist:nutriologo._id, nombre:nombrePlan, objetivo:d.objetivo,
        fechaInicio:fecha('2026-10-20'), activo:true, comidas:comidasDelDia() } },
      { upsert:true, new:true, runValidators:true, setDefaultsOnInsert:true })
    await Seguimiento.deleteMany({ paciente:paciente._id, plan:plan._id })
    for(let j=0;j<plan.comidas.length;j++){
      const comida=plan.comidas[j]
      await Seguimiento.create({ paciente:paciente._id, nutritionist:nutriologo._id,
        plan:plan._id, comida:comida._id, nombreComida:comida.nombre, platillo:comida.platillo,
        fecha:'2026-10-20', estado:['completada','parcial','omitida'][j%3],
        agrado:['gusto','neutral','no_gusto'][j%3], comentario:'Seguimiento de prueba' })
    }
    console.log(`✓ ${d.nombre}: usuario, expediente, 4 mediciones, 1 plan, 5 seguimientos`)
  }
  for (const row of catalogo) {
    const [nombre, grupo, cantidad, unidad, gramos, kcal, proteina, carbohidratos, grasas] = row
    await Alimento.updateOne({ nombreNormalizado:nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') },
      { $setOnInsert: { nombre, grupo, porcion:{cantidad,unidad,gramos}, nutrimentos:{kcal,proteina,carbohidratos,grasas},
        origen:'manual', activo:true, revisado:false, notasRevision:'Valores aproximados solo para demostración; no usar para prescripción clínica.' } },
      { upsert:true, runValidators:true })
  }
  console.log('\nDatos listos: 2 nutriólogos demo, 5 pacientes demo, 20 mediciones, 5 planes, 25 seguimientos y hasta 16 alimentos demo.')
  console.log(`Login paciente DEMO: ana@${dominio} / ${claveDemo}`)
  console.log('Los nutriólogos demo no pueden iniciar sesión con Google porque sus correos son ficticios.')
  console.log('Tu administrador existente no fue modificado.')
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>mongoose.disconnect())
