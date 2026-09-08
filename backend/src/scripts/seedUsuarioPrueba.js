require('dotenv').config()

const mongoose = require('mongoose')
const { connectDatabase } = require('../config/database')
const User = require('../models/User')

async function seedUsuarioPrueba() {
  const email = 'usuario.prueba@nutria.com'

  let usuario = await User.findOne({ email })

  if (!usuario) {
    usuario = new User({
      name: 'Usuario Prueba',
      email,
      role: 'nutritionist',
      authProvider: 'google',
      active: true,
      accountStatus: 'active',
    })
  } else {
    usuario.name = 'Usuario Prueba'
    usuario.role = 'nutritionist'
    usuario.authProvider = 'google'
    usuario.active = true
    usuario.accountStatus = 'active'

    // Los nutriólogos ya no utilizan contraseña local.
    usuario.password = undefined
  }

  await usuario.save()

  console.log(`Nutriólogo autorizado para Google: ${email}`)
}

connectDatabase()
  .then(seedUsuarioPrueba)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(
      `No fue posible crear el nutriólogo de prueba: ${error.message}`,
    )

    await mongoose.disconnect()
    process.exit(1)
  })