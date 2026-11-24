const mongoose = require('mongoose')
const { modelos, marcaColeccion, marcaId, validarBase } = require('../config/datosPacientes')
const { MongoClient, BSON } = mongoose.mongo
const opciones = { promoteLongs: false }
const serializar = documento => BSON.serialize(documento)
const iguales = (a, b) => serializar(a).equals(serializar(b))
const clave = id => BSON.EJSON.stringify(id, { relaxed: false })
const colecciones = modelos.map(modelo => mongoose.pluralize()(modelo))

async function copiarColeccion(origen, destino) {
  const cursor = origen.find({}, opciones).batchSize(250)
  async function guardar(lote) {
    const encontrados = await destino.find({ _id: { $in: lote.map(item => item._id) } }, opciones).toArray()
    const conocidos = new Map(encontrados.map(item => [clave(item._id), item]))
    const nuevos = []
    for (const documento of lote) {
      const anterior = conocidos.get(clave(documento._id))
      if (!anterior) nuevos.push(documento)
      else if (!iguales(anterior, documento)) throw new Error('Hay documentos diferentes en ' + destino.collectionName + '. No se sobrescribieron.')
    }
    if (nuevos.length) await destino.insertMany(nuevos)
  }

  let lote = []
  try {
    for await (const documento of cursor) {
      lote.push(documento)
      if (lote.length < 250) continue
      await guardar(lote)
      lote = []
    }
    if (lote.length) await guardar(lote)
  } finally { await cursor.close() }
}

async function verificarColeccion(origen, destino) {
  const a = origen.find({}, opciones).sort({ _id: 1 })
  const b = destino.find({}, opciones).sort({ _id: 1 })
  let total = 0
  try {
    while (true) {
      const [izquierda, derecha] = await Promise.all([a.next(), b.next()])
      if (!izquierda && !derecha) return total
      if (!izquierda || !derecha || !iguales(izquierda, derecha))
        throw new Error('La verificación encontró diferencias en ' + origen.collectionName + '.')
      total++
    }
  } finally { await Promise.allSettled([a.close(), b.close()]) }
}

async function migrar({ client, origen, destino, copiar = false }) {
  validarBase(destino)
  if (!origen || origen === destino) throw new Error('Indica dos bases distintas.')
  const source = client.db(origen), target = client.db(destino)
  const control = target.collection(marcaColeccion)
  if (copiar && await control.findOne({ _id: marcaId })) {
    throw new Error('La base clínica ya está marcada como verificada. La copia se bloqueó para protegerla.')
  }
  if (copiar) {
    for (const name of colecciones) await copiarColeccion(source.collection(name), target.collection(name))
  }
  const resultados = {}
  for (const name of colecciones) resultados[name] = await verificarColeccion(source.collection(name), target.collection(name))
  if (copiar) {
    await control.insertOne({ _id: marcaId, origen, destino, verificadoAt: new Date(), colecciones: resultados })
  }
  return resultados
}

async function main() {
  const uri = process.env.MONGODB_MIGRATION_URI
  const [modo, origen, destino] = process.argv.slice(2)
  if (!uri || !origen || !destino || !['--verificar', '--copiar-con-escrituras-pausadas'].includes(modo)) {
    throw new Error('Configura MONGODB_MIGRATION_URI y usa --verificar o --copiar-con-escrituras-pausadas, seguidos por origen y destino.')
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
  try {
    await client.connect()
    const colecciones = await migrar({ client, origen, destino, copiar: modo === '--copiar-con-escrituras-pausadas' })
    console.log(JSON.stringify({ origen, destino, colecciones }, null, 2))
  } finally { await client.close() }
}

if (require.main === module) main().catch(error => {
  console.error('Migración interrumpida:', error.message)
  process.exitCode = 1
})

module.exports = { migrar, colecciones }
