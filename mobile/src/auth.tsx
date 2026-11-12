import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { ApiError, request, type Session, type User } from './api'
import { isRole } from './access'

const key = 'nutria.session'
const storage = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }

type Auth = {
  session: Session | null
  loading: boolean
  restoreError: string
  retry: () => void
  signIn: (provider: 'google' | 'paciente/login', body: object) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [restoreError, setRestoreError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function restore() {
      try {
        const token = await SecureStore.getItemAsync(key, storage)
        if (!token || signal.aborted) return
        const { user } = await request<{ user: User }>('/auth/me', { token, signal })
        if (!isRole(user.role)) throw new Error('Rol desconocido')
        if (!signal.aborted) setSession({ token, user })
      } catch (error) {
        if (signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          try {
            await SecureStore.deleteItemAsync(key, storage)
            return
          } catch {
            // Keep the recovery screen available when storage fails.
          }
        }
        if (!signal.aborted) setRestoreError('No se pudo recuperar la sesión.')
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }
    void restore()
    return () => controller.abort()
  }, [attempt])

  async function signIn(provider: 'google' | 'paciente/login', body: object) {
    const next = await request<Session>(`/auth/${provider}`, { body })
    if (!next.token || !isRole(next.user?.role)) throw new Error('Sesión inválida.')
    await SecureStore.setItemAsync(key, next.token, storage)
    setSession(next)
  }

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(key, storage)
    setSession(null)
    setRestoreError('')
  }, [])

  return (
    <AuthContext.Provider value={{
      session, loading, restoreError, signIn, signOut,
      retry: () => {
        setLoading(true)
        setRestoreError('')
        setAttempt(value => value + 1)
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProvider requerido')
  return auth
}
