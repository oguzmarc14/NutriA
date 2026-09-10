require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const {
  connectDatabase,
} = require('../config/database')

const Alimento = require('../models/Alimento')

const DIRECTORIO_ALIMENTOS = path.join(
  __dirname,
  '..',
  'data',
  'alimentos',
)

function normalizarTexto(texto = '') {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function obtenerArchivosJson() {
  if (!fs.existsSync(DIRECTORIO_ALIMENTOS)) {
    throw new Error(
      `No existe el directorio de alimentos: ${DIRECTORIO_ALIMENTOS}`,
    )
  }

  return fs
    .readdirSync(DIRECTORIO_ALIMENTOS)
    .filter((archivo) => archivo.endsWith('.json'))
    .sort()
}

function cargarAlimentosDesdeArchivo(nombreArchivo) {
  const rutaArchivo = path.join(
    DIRECTORIO_ALIMENTOS,
    nombreArchivo,
  )

  const contenido = fs.readFileSync(
    rutaArchivo,
    'utf-8',
  )

  let datos

  try {
    datos = JSON.parse(contenido)
  } catch (error) {
    throw new Error(
      `JSON inválido en ${nombreArchivo}: ${error.message}`,
    )
  }

  if (!Array.isArray(datos)) {
    throw new Error(
      `${nombreArchivo} debe contener un arreglo JSON`,
    )
  }

  return datos.map((alimento) => ({
    ...alimento,
    __archivoOrigen: nombreArchivo,
  }))
}

function cargarCatalogo() {
  const archivos = obtenerArchivosJson()
  const alimentos = []

  for (const archivo of archivos) {
    const registros = cargarAlimentosDesdeArchivo(
      archivo,
    )

    console.log(
      `📄 ${archivo}: ${registros.length} alimentos`,
    )

    alimentos.push(...registros)
  }

  return {
    archivos,
    alimentos,
  }
}

function validarAlimento(alimento) {
  const errores = []

  if (!alimento.nombre?.trim()) {
    errores.push('nombre')
  }

  if (!alimento.grupo?.trim()) {
    errores.push('grupo')
  }

  if (errores.length > 0) {
    throw new Error(
      `Registro inválido en ${alimento.__archivoOrigen}: faltan ${errores.join(', ')}`,
    )
  }
}

async function guardarAlimento(alimento) {
  validarAlimento(alimento)

  const {
    __archivoOrigen,
    ...datosAlimento
  } = alimento

  const nombreNormalizado = normalizarTexto(
    datosAlimento.nombre,
  )

  const resultado = await Alimento.updateOne(
    {
      nombreNormalizado,
    },
    {
      $set: {
        ...datosAlimento,
        nombreNormalizado,
      },
    },
    {
      upsert: true,
      runValidators: true,
    },
  )

  return {
    creado: resultado.upsertedCount > 0,
    actualizado:
      resultado.matchedCount > 0 &&
      resultado.modifiedCount > 0,
    sinCambios:
      resultado.matchedCount > 0 &&
      resultado.modifiedCount === 0,
    archivo: __archivoOrigen,
    nombre: datosAlimento.nombre,
  }
}

async function ejecutarSeed() {
  try {
    console.log('🥗 Iniciando importación del catálogo de alimentos...')

    const {
      archivos,
      alimentos,
    } = cargarCatalogo()

    console.log(
      `📚 Archivos encontrados: ${archivos.length}`,
    )
    console.log(
      `🍎 Registros encontrados: ${alimentos.length}`,
    )

    if (alimentos.length === 0) {
      console.log(
        'ℹ️ Los archivos JSON todavía están vacíos. No hay alimentos que importar.',
      )
      return
    }

    await connectDatabase()

    let creados = 0
    let actualizados = 0
    let sinCambios = 0

    for (const alimento of alimentos) {
      const resultado = await guardarAlimento(
        alimento,
      )

      if (resultado.creado) {
        creados += 1
        console.log(
          `✅ Creado: ${resultado.nombre}`,
        )
      } else if (resultado.actualizado) {
        actualizados += 1
        console.log(
          `🔄 Actualizado: ${resultado.nombre}`,
        )
      } else {
        sinCambios += 1
        console.log(
          `➖ Sin cambios: ${resultado.nombre}`,
        )
      }
    }

    console.log('\n✅ Importación finalizada')
    console.log(`   Creados: ${creados}`)
    console.log(`   Actualizados: ${actualizados}`)
    console.log(`   Sin cambios: ${sinCambios}`)
    console.log(`   Total procesados: ${alimentos.length}`)
  } catch (error) {
    console.error(
      '❌ Error al importar alimentos:',
      error.message,
    )

    process.exitCode = 1
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  }
}

ejecutarSeed()
