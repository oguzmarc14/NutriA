import { useEffect, useState } from 'react'
import { useAuth } from './auth'
import { ApiError, request } from './api'

export function useList<T>(path: string, key?: string) {
  const { session, signOut } = useAuth()
  const token = session?.token
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ path: string; attempt: number; rows: T[]; error: string }>()
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const { signal } = controller
    async function load() {
      try {
        const data = await request<T[] | Record<string, T[]>>(path, { token, signal })
        const rows = key && !Array.isArray(data) ? data[key] : data
        if (!Array.isArray(rows)) throw new Error('La API devolvió una lista inválida.')
        if (!signal.aborted) setResult({ path, attempt, rows, error: '' })
      } catch (cause) {
        if (signal.aborted) return
        let error = cause instanceof Error ? cause.message : 'No se pudo cargar la lista.'
        if (cause instanceof ApiError && cause.status === 401) {
          try {
            await signOut()
            return
          } catch {
            error = 'La sesión expiró. No se pudo borrar la sesión del dispositivo.'
          }
        }
        if (!signal.aborted) setResult({ path, attempt, rows: [], error })
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt, key, path, token, signOut])
  const current = result?.path === path && result.attempt === attempt ? result : undefined
  return { rows: current?.rows ?? [], error: current?.error, loading: !current,
    reload: () => setAttempt(value => value + 1) }
}
