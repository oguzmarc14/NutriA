require('dotenv').config()

const app = require('./app')
const { connectDatabase } = require('./config/database')

const port = Number(process.env.PORT) || 4000

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta configurar JWT_SECRET en backend/.env')
  }

  await connectDatabase()

  app.listen(port, () => {
    console.log(`NutriA API disponible en http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error(`No fue posible iniciar la API: ${error.message}`)
  process.exit(1)
})
