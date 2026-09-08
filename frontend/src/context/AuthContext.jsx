import { useCallback, useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('nutria_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await client.get('/auth/me')
        setUser(data.user)
      } catch {
        localStorage.removeItem('nutria_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const loginGoogle = useCallback(async (credential) => {
    const { data } = await client.post('/auth/google', {
      credential,
    })

    localStorage.setItem('nutria_token', data.token)
    setUser(data.user)

    return data.user
  }, [])

  const loginPaciente = useCallback(async (credentials) => {
    const { data } = await client.post('/auth/paciente/login', credentials)

    localStorage.setItem('nutria_token', data.token)
    setUser(data.user)

    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nutria_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      loading,
      loginGoogle,
      loginPaciente,
      logout,
      user,
    }),
    [loading, loginGoogle, loginPaciente, logout, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}