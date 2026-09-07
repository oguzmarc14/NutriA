require('dotenv').config()

const mongoose = require('mongoose')
const { connectDatabase } = require('../config/database')
const User = require('../models/User')

async function seedUsuarioPrueba() {
  const email = 'usuario.prueba@nutria.com'

  let usuario = await User.findOne({ email }).select('+password')

  if (!usuario) {
    usuario = new User({
      name: 'Usuario Prueba',
      email,
      password: 'Prueba1234',
      role: 'nutritionist',
    })
  } else {
    usuario.name = 'Usuario Prueba'
    usuario.password = 'Prueba1234'
    usuario.role = 'nutritionist'
    usuario.active = true
  }

  await usuario.save()

  console.log(`Usuario de prueba disponible: ${email}`)
}

connectDatabase()
  .then(seedUsuarioPrueba)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(`No fue posible crear el usuario de prueba: ${error.message}`)
    await mongoose.disconnect()
    process.exit(1)
  })