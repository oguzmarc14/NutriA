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

  return { perfil, loading, error, recargar }
}

export default usePerfilPaciente
