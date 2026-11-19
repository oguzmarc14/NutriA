import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ApiError, request } from './api'
import { useAuth } from './auth'

export function useResource<T>(path: string | null) {
  const { session, signOut } = useAuth()
  const token = session?.token
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{ path: string; version: number; token: string; data?: T; error?: string }>()

  useFocusEffect(useCallback(() => {
    if (!path || !token) return
    const controller = new AbortController()
    const { signal } = controller
    const key = { path, version, token }

    void request<T>(path, { token, signal }).then(data => {
      if (!signal.aborted) setResult({ ...key, data })
    }).catch(async (cause: unknown) => {
      if (signal.aborted) return
      let error = cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.'
      if (cause instanceof ApiError && cause.status === 401) {
        try {
          await signOut()
          return
        } catch {
          error = 'La sesión expiró. No se pudo borrar del dispositivo.'
        }
      }
      if (!signal.aborted) setResult({ ...key, error })
    })
    return () => controller.abort()
  }, [path, token, signOut, version]))

  const current = result?.path === path && result?.version === version && result?.token === token ? result : undefined
  return {
    data: current?.data,
    error: current?.error,
    loading: !!path && !current,
    reload: () => setVersion(value => value + 1),
  }
}
