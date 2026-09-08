require('dotenv').config()

const mongoose = require('mongoose')
const { connectDatabase } = require('../config/database')
const User = require('../models/User')

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || 'Administrador NutriA'
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (!email) {
    throw new Error('Configura ADMIN_EMAIL')
  }

  let user = await User.findOne({ email })

  if (!user) {
    user = new User({
      name,
      email,
      role: 'admin',
      authProvider: 'google',
      active: true,
      accountStatus: 'active',
    })
  } else {
    user.name = name
    user.role = 'admin'
    user.authProvider = 'google'
    user.active = true
    user.accountStatus = 'active'

    // Ya no utilizamos contraseña local para administradores.
    user.password = undefined
  }

  await user.save()

  console.log(`Administrador autorizado para Google: ${email}`)
}

connectDatabase()
  .then(seedAdmin)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(
      `No fue posible crear el administrador: ${error.message}`,
    )

    await mongoose.disconnect()
    process.exit(1)
  })