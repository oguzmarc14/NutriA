import { useCallback, useEffect, useState } from 'react'
import client from '../api/client'

function usePerfilPaciente() {
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await client.get('/mi-perfil')
      setPerfil(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible cargar tu informacion')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function cargarPerfilInicial() {
      try {
        const { data } = await client.get('/mi-perfil')
        setPerfil(data)
      } catch (err) {
        setError(err.response?.data?.message || 'No fue posible cargar tu informacion')
      } finally {
        setLoading(false)
      }
    }

    cargarPerfilInicial()
  }, [])

  function guardarRegistroLocal(registro) {
    if (!registro) return
    setPerfil(actual => {
      if (!actual) return actual
      const restantes = (actual.seguimientosComida || []).filter(item =>
        String(item.plan) !== String(registro.plan) || String(item.comida) !== String(registro.comida) ||
        item.fecha !== registro.fecha,
      )
      return { ...actual, seguimientosComida: [registro, ...restantes] }
    })
  }

  return { perfil, loading, error, recargar, guardarRegistroLocal }
}

export default usePerfilPaciente
