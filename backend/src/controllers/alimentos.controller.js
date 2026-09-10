const mongoose = require('mongoose')

const Alimento = require('../models/Alimento')

/*
 * ----------------------------------------------------
 * LISTAR / BUSCAR ALIMENTOS
 * ----------------------------------------------------
 *
 * GET /api/alimentos
 *
 * Ejemplos:
 *
 * /api/alimentos
 * /api/alimentos?q=tortilla
 * /api/alimentos?grupo=Cereales
 * /api/alimentos?q=pollo&grupo=Alimentos de origen animal
 */

async function obtenerAlimentos(req, res) {
  try {
    const {
      q = '',
      grupo = '',
      activo = 'true',
      page = 1,
      limit = 30,
    } = req.query

    const filtro = {}

    /*
     * ACTIVO
     */

    if (activo === 'true') {
      filtro.activo = true
    }

    if (activo === 'false') {
      filtro.activo = false
    }

    /*
     * GRUPO
     */

    if (grupo.trim()) {
      filtro.grupo = {
        $regex: grupo.trim(),
        $options: 'i',
      }
    }

    /*
     * BÚSQUEDA
     */

    if (q.trim()) {
      const busqueda = q
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      filtro.$or = [
        {
          nombre: {
            $regex: q.trim(),
            $options: 'i',
          },
        },

        {
          nombreNormalizado: {
            $regex: busqueda,
            $options: 'i',
          },
        },

        {
          grupo: {
            $regex: q.trim(),
            $options: 'i',
          },
        },

        {
          subgrupo: {
            $regex: q.trim(),
            $options: 'i',
          },
        },

        {
          tags: {
            $regex: q.trim(),
            $options: 'i',
          },
        },
      ]
    }

    /*
     * PAGINACIÓN
     */

    const pagina =
      Math.max(
        Number.parseInt(page, 10) || 1,
        1,
      )

    const limite =
      Math.min(
        Math.max(
          Number.parseInt(limit, 10) || 30,
          1,
        ),
        100,
      )

    const skip =
      (pagina - 1) * limite

    /*
     * CONSULTA
     */

    const [
      alimentos,
      total,
    ] = await Promise.all([
      Alimento.find(filtro)
        .sort({
          nombre: 1,
        })
        .skip(skip)
        .limit(limite)
        .lean(),

      Alimento.countDocuments(
        filtro,
      ),
    ])

    return res.json({
      alimentos,

      pagination: {
        page: pagina,
        limit: limite,
        total,
        pages: Math.ceil(
          total / limite,
        ),
      },
    })
  } catch (error) {
    console.error(
      'Error obteniendo alimentos:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible obtener los alimentos',
    })
  }
}

/*
 * ----------------------------------------------------
 * OBTENER ALIMENTO POR ID
 * ----------------------------------------------------
 */

async function obtenerAlimentoPorId(
  req,
  res,
) {
  try {
    const { id } =
      req.params

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        message:
          'ID de alimento inválido',
      })
    }

    const alimento =
      await Alimento.findById(id)

    if (!alimento) {
      return res.status(404).json({
        message:
          'Alimento no encontrado',
      })
    }

    return res.json({
      alimento,
    })
  } catch (error) {
    console.error(
      'Error obteniendo alimento:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible obtener el alimento',
    })
  }
}

/*
 * ----------------------------------------------------
 * CREAR ALIMENTO
 * ----------------------------------------------------
 */

async function crearAlimento(
  req,
  res,
) {
  try {
    const {
      nombre,
      grupo,
      subgrupo,
      porcion,
      equivalentes,
      nutrimentos,
      preparacion,
      marca,
      categoriaNutria,
      tags,
      fuentes,
      origen,
      revisado,
    } = req.body

    if (
      !nombre ||
      !nombre.trim()
    ) {
      return res.status(400).json({
        message:
          'El nombre del alimento es obligatorio',
      })
    }

    if (
      !grupo ||
      !grupo.trim()
    ) {
      return res.status(400).json({
        message:
          'El grupo alimenticio es obligatorio',
      })
    }

    /*
     * EVITAR DUPLICADOS EXACTOS
     */

    const nombreNormalizado =
      nombre
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )

    const existente =
      await Alimento.findOne({
        nombreNormalizado,
        grupo: {
          $regex: `^${escaparRegex(
            grupo.trim(),
          )}$`,
          $options: 'i',
        },
      })

    if (existente) {
      return res.status(409).json({
        message:
          'Ya existe un alimento con ese nombre dentro del mismo grupo',
      })
    }

    const alimento =
      await Alimento.create({
        nombre:
          nombre.trim(),

        grupo:
          grupo.trim(),

        subgrupo:
          subgrupo?.trim() ||
          '',

        porcion:
          porcion || {},

        equivalentes:
          equivalentes ?? 1,

        nutrimentos:
          nutrimentos || {},

        preparacion:
          preparacion?.trim() ||
          '',

        marca:
          marca?.trim() ||
          '',

        categoriaNutria:
          categoriaNutria?.trim() ||
          '',

        tags:
          Array.isArray(tags)
            ? tags
            : [],

        fuentes:
          Array.isArray(fuentes)
            ? fuentes
            : [],

        origen:
          origen || 'manual',

        revisado:
          Boolean(revisado),
      })

    return res.status(201).json({
      message:
        'Alimento creado correctamente',

      alimento,
    })
  } catch (error) {
    console.error(
      'Error creando alimento:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible crear el alimento',
    })
  }
}

/*
 * ----------------------------------------------------
 * ACTUALIZAR ALIMENTO
 * ----------------------------------------------------
 */

async function actualizarAlimento(
  req,
  res,
) {
  try {
    const { id } =
      req.params

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        message:
          'ID de alimento inválido',
      })
    }

    const alimento =
      await Alimento.findById(id)

    if (!alimento) {
      return res.status(404).json({
        message:
          'Alimento no encontrado',
      })
    }

    const camposPermitidos = [
      'nombre',
      'grupo',
      'subgrupo',
      'porcion',
      'equivalentes',
      'nutrimentos',
      'preparacion',
      'marca',
      'categoriaNutria',
      'tags',
      'fuentes',
      'origen',
      'revisado',
    ]

    camposPermitidos.forEach(
      (campo) => {
        if (
          req.body[campo] !==
          undefined
        ) {
          alimento[campo] =
            req.body[campo]
        }
      },
    )

    /*
     * VALIDACIONES MÍNIMAS
     */

    if (
      !alimento.nombre ||
      !alimento.nombre.trim()
    ) {
      return res.status(400).json({
        message:
          'El nombre del alimento es obligatorio',
      })
    }

    if (
      !alimento.grupo ||
      !alimento.grupo.trim()
    ) {
      return res.status(400).json({
        message:
          'El grupo alimenticio es obligatorio',
      })
    }

    alimento.nombre =
      alimento.nombre.trim()

    alimento.grupo =
      alimento.grupo.trim()

    /*
     * GUARDAR
     *
     * El middleware pre-save del modelo
     * actualizará nombreNormalizado.
     */

    await alimento.save()

    return res.json({
      message:
        'Alimento actualizado correctamente',

      alimento,
    })
  } catch (error) {
    console.error(
      'Error actualizando alimento:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible actualizar el alimento',
    })
  }
}

/*
 * ----------------------------------------------------
 * ACTIVAR / DESACTIVAR
 * ----------------------------------------------------
 */

async function cambiarEstadoAlimento(
  req,
  res,
) {
  try {
    const { id } =
      req.params

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        message:
          'ID de alimento inválido',
      })
    }

    const alimento =
      await Alimento.findById(id)

    if (!alimento) {
      return res.status(404).json({
        message:
          'Alimento no encontrado',
      })
    }

    alimento.activo =
      !alimento.activo

    await alimento.save()

    return res.json({
      message:
        alimento.activo
          ? 'Alimento activado correctamente'
          : 'Alimento desactivado correctamente',

      alimento,
    })
  } catch (error) {
    console.error(
      'Error cambiando estado del alimento:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible cambiar el estado del alimento',
    })
  }
}

/*
 * ----------------------------------------------------
 * GRUPOS DISPONIBLES
 * ----------------------------------------------------
 */

async function obtenerGrupos(
  req,
  res,
) {
  try {
    const grupos =
      await Alimento.distinct(
        'grupo',
        {
          activo: true,
        },
      )

    grupos.sort((a, b) =>
      a.localeCompare(
        b,
        'es',
      ),
    )

    return res.json({
      grupos,
    })
  } catch (error) {
    console.error(
      'Error obteniendo grupos:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible obtener los grupos alimenticios',
    })
  }
}

/*
 * ----------------------------------------------------
 * UTILIDAD
 * ----------------------------------------------------
 */

function escaparRegex(texto) {
  return texto.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )
}

module.exports = {
  obtenerAlimentos,
  obtenerAlimentoPorId,
  crearAlimento,
  actualizarAlimento,
  cambiarEstadoAlimento,
  obtenerGrupos,
}