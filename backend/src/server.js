require('dotenv').config()

const app = require('./app')
const { connectDatabase } = require('./config/database')

const port = Number(process.env.PORT) || 4000

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta configurar JWT_SECRET en backend/.env')
  }

  await connectDatabase()

  const {processReceipts}=require('./services/push.service')
  void processReceipts()
  const receipts=setInterval(()=>void processReceipts(),60000);receipts.unref()
  const { reconcile } = require('./services/agendaCheckout.service')
  const checkPayments = () => void reconcile().catch(() => console.error('No se pudo reconciliar pagos de agenda.'))
  checkPayments()
  const payments = setInterval(checkPayments, 60000); payments.unref()
  app.listen(port, () => {
    console.log(`NutriA API disponible en http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error(`No fue posible iniciar la API: ${error.message}`)
  process.exit(1)
})
