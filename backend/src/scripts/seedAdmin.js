require('dotenv').config()

const mongoose = require('mongoose')
const { connectDatabase } = require('../config/database')
const User = require('../models/User')

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || 'Administrador NutriA'
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password || password.length < 8) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres)')
  }

  let user = await User.findOne({ email }).select('+password')

  if (!user) {
    user = new User({ name, email, password, role: 'admin' })
  } else {
    user.name = name
    user.password = password
    user.role = 'admin'
    user.active = true
  }

  await user.save()
  console.log(`Administrador disponible: ${email}`)
}

connectDatabase()
  .then(seedAdmin)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(`No fue posible crear el administrador: ${error.message}`)
    await mongoose.disconnect()
    process.exit(1)
  })
