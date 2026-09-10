require('dotenv').config()

const mongoose = require('mongoose')

const {
  connectDatabase,
} = require('../config/database')

const Alimento = require('../models/Alimento')

const alimentos = [
  {
    nombre: 'Tortilla de maíz',
    grupo: 'Cereales y tubérculos',
    subgrupo: 'Sin grasa',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 30,
      descripcion: '1 pieza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 64,
      proteina: 1.4,
      carbohidratos: 13.6,
      grasas: 0.8,
      fibra: 1.5,
      sodio: null,
    },

    tags: [
      'tortilla',
      'maiz',
      'mexico',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Arroz blanco cocido',
    grupo: 'Cereales y tubérculos',
    subgrupo: 'Sin grasa',

    porcion: {
      cantidad: 0.5,
      unidad: 'taza',
      gramos: 80,
      descripcion: '1/2 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 103,
      proteina: 2.1,
      carbohidratos: 22.3,
      grasas: 0.2,
      fibra: 0.3,
      sodio: null,
    },

    tags: [
      'arroz',
      'cereal',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Avena cocida',
    grupo: 'Cereales y tubérculos',
    subgrupo: 'Sin grasa',

    porcion: {
      cantidad: 0.75,
      unidad: 'taza',
      gramos: 180,
      descripcion: '3/4 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 120,
      proteina: 4.3,
      carbohidratos: 21,
      grasas: 2.2,
      fibra: 3,
      sodio: null,
    },

    tags: [
      'avena',
      'cereal',
      'desayuno',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Pan integral',
    grupo: 'Cereales y tubérculos',
    subgrupo: 'Sin grasa',

    porcion: {
      cantidad: 1,
      unidad: 'rebanada',
      gramos: 30,
      descripcion: '1 rebanada',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 74,
      proteina: 3,
      carbohidratos: 13,
      grasas: 1,
      fibra: 2,
      sodio: null,
    },

    tags: [
      'pan',
      'integral',
      'cereal',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Frijoles de la olla',
    grupo: 'Leguminosas',
    subgrupo: '',

    porcion: {
      cantidad: 0.5,
      unidad: 'taza',
      gramos: 90,
      descripcion: '1/2 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 114,
      proteina: 7.5,
      carbohidratos: 20,
      grasas: 0.5,
      fibra: 7,
      sodio: null,
    },

    tags: [
      'frijol',
      'frijoles',
      'leguminosa',
      'mexico',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Pechuga de pollo cocida',
    grupo: 'Alimentos de origen animal',
    subgrupo: 'Muy bajo aporte de grasa',

    porcion: {
      cantidad: 1,
      unidad: 'porción',
      gramos: 30,
      descripcion: '30 g',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 50,
      proteina: 9,
      carbohidratos: 0,
      grasas: 1.1,
      fibra: 0,
      sodio: null,
    },

    tags: [
      'pollo',
      'pechuga',
      'proteina',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Huevo entero',
    grupo: 'Alimentos de origen animal',
    subgrupo: 'Moderado aporte de grasa',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 50,
      descripcion: '1 pieza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 72,
      proteina: 6.3,
      carbohidratos: 0.4,
      grasas: 4.8,
      fibra: 0,
      sodio: null,
    },

    tags: [
      'huevo',
      'proteina',
      'desayuno',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Clara de huevo',
    grupo: 'Alimentos de origen animal',
    subgrupo: 'Muy bajo aporte de grasa',

    porcion: {
      cantidad: 2,
      unidad: 'piezas',
      gramos: 66,
      descripcion: '2 claras',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 34,
      proteina: 7.2,
      carbohidratos: 0.5,
      grasas: 0.1,
      fibra: 0,
      sodio: null,
    },

    tags: [
      'clara',
      'huevo',
      'proteina',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Queso panela',
    grupo: 'Alimentos de origen animal',
    subgrupo: 'Moderado aporte de grasa',

    porcion: {
      cantidad: 1,
      unidad: 'porción',
      gramos: 40,
      descripcion: '40 g',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 80,
      proteina: 7,
      carbohidratos: 1,
      grasas: 5,
      fibra: 0,
      sodio: null,
    },

    tags: [
      'queso',
      'panela',
      'lacteo',
      'mexico',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Leche descremada',
    grupo: 'Leche',
    subgrupo: 'Descremada',

    porcion: {
      cantidad: 1,
      unidad: 'taza',
      gramos: 240,
      descripcion: '1 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 85,
      proteina: 8,
      carbohidratos: 12,
      grasas: 0.5,
      fibra: 0,
      sodio: null,
    },

    tags: [
      'leche',
      'descremada',
      'lacteo',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Aguacate',
    grupo: 'Aceites y grasas',
    subgrupo: 'Sin proteína',

    porcion: {
      cantidad: 0.33,
      unidad: 'pieza',
      gramos: 50,
      descripcion: 'Aproximadamente 1/3 de pieza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 80,
      proteina: 1,
      carbohidratos: 4,
      grasas: 7.4,
      fibra: 3.4,
      sodio: null,
    },

    tags: [
      'aguacate',
      'grasa',
      'mexico',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Aceite de oliva',
    grupo: 'Aceites y grasas',
    subgrupo: 'Sin proteína',

    porcion: {
      cantidad: 1,
      unidad: 'cucharadita',
      gramos: 5,
      descripcion: '1 cucharadita',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 45,
      proteina: 0,
      carbohidratos: 0,
      grasas: 5,
      fibra: 0,
      sodio: 0,
    },

    tags: [
      'aceite',
      'oliva',
      'grasa',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Plátano',
    grupo: 'Frutas',
    subgrupo: '',

    porcion: {
      cantidad: 0.5,
      unidad: 'pieza',
      gramos: 80,
      descripcion: '1/2 pieza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 71,
      proteina: 0.9,
      carbohidratos: 18.3,
      grasas: 0.2,
      fibra: 2.1,
      sodio: null,
    },

    tags: [
      'platano',
      'banana',
      'fruta',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Manzana',
    grupo: 'Frutas',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 130,
      descripcion: '1 pieza pequeña',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 68,
      proteina: 0.3,
      carbohidratos: 18,
      grasas: 0.2,
      fibra: 3,
      sodio: null,
    },

    tags: [
      'manzana',
      'fruta',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Naranja',
    grupo: 'Frutas',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 140,
      descripcion: '1 pieza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 66,
      proteina: 1.3,
      carbohidratos: 16,
      grasas: 0.2,
      fibra: 3.4,
      sodio: null,
    },

    tags: [
      'naranja',
      'fruta',
      'citricos',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Papaya',
    grupo: 'Frutas',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'taza',
      gramos: 140,
      descripcion: '1 taza en cubos',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 60,
      proteina: 0.7,
      carbohidratos: 15,
      grasas: 0.4,
      fibra: 2.4,
      sodio: null,
    },

    tags: [
      'papaya',
      'fruta',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Jitomate',
    grupo: 'Verduras',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 120,
      descripcion: '1 pieza mediana',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 22,
      proteina: 1.1,
      carbohidratos: 4.8,
      grasas: 0.2,
      fibra: 1.5,
      sodio: null,
    },

    tags: [
      'jitomate',
      'tomate',
      'verdura',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Nopal cocido',
    grupo: 'Verduras',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'taza',
      gramos: 150,
      descripcion: '1 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 24,
      proteina: 1.6,
      carbohidratos: 5,
      grasas: 0.2,
      fibra: 3,
      sodio: null,
    },

    tags: [
      'nopal',
      'nopales',
      'verdura',
      'mexico',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Zanahoria',
    grupo: 'Verduras',
    subgrupo: '',

    porcion: {
      cantidad: 1,
      unidad: 'pieza',
      gramos: 60,
      descripcion: '1 pieza mediana',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 25,
      proteina: 0.6,
      carbohidratos: 5.8,
      grasas: 0.1,
      fibra: 1.7,
      sodio: null,
    },

    tags: [
      'zanahoria',
      'verdura',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },

  {
    nombre: 'Brócoli cocido',
    grupo: 'Verduras',
    subgrupo: '',

    porcion: {
      cantidad: 0.5,
      unidad: 'taza',
      gramos: 78,
      descripcion: '1/2 taza',
    },

    equivalentes: 1,

    nutrimentos: {
      kcal: 27,
      proteina: 1.9,
      carbohidratos: 5.6,
      grasas: 0.3,
      fibra: 2.6,
      sodio: null,
    },

    tags: [
      'brocoli',
      'verdura',
    ],

    fuentes: [
      {
        nombre: 'NutriA',
        edicion: 'Dataset inicial',
        referencia: 'Pendiente de validación nutricional',
      },
    ],

    origen: 'manual',
    revisado: false,
    activo: true,
  },
]

function normalizarNombre(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

async function ejecutarSeed() {
  try {
    await connectDatabase()

    console.log('')
    console.log('Cargando catálogo inicial de alimentos...')
    console.log('')

    let creados = 0
    let actualizados = 0

    for (const alimento of alimentos) {
      const nombreNormalizado =
        normalizarNombre(
          alimento.nombre,
        )

      const existente =
        await Alimento.findOne({
          nombreNormalizado,
        })

      if (existente) {
        await Alimento.updateOne(
          {
            _id: existente._id,
          },
          {
            $set: {
              ...alimento,
              nombreNormalizado,
            },
          },
        )

        actualizados += 1

        console.log(
          `Actualizado: ${alimento.nombre}`,
        )

        continue
      }

      await Alimento.create({
        ...alimento,
        nombreNormalizado,
      })

      creados += 1

      console.log(
        `Creado: ${alimento.nombre}`,
      )
    }

    console.log('')
    console.log('------------------------------')
    console.log('Seed de alimentos terminado')
    console.log('------------------------------')
    console.log(`Creados: ${creados}`)
    console.log(
      `Actualizados: ${actualizados}`,
    )
    console.log(
      `Total: ${alimentos.length}`,
    )
    console.log('')
  } catch (error) {
    console.error('')
    console.error(
      'Error ejecutando seed de alimentos:',
    )
    console.error(error)

    process.exitCode = 1
  } finally {
    try {
      await mongoose.connection.close()

      console.log(
        'Conexión a MongoDB cerrada',
      )
    } catch (error) {
      console.error(
        'Error cerrando MongoDB:',
        error,
      )
    }
  }
}

ejecutarSeed()