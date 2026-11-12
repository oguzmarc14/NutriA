import type { Role } from './access'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  patientId: string | null
}

export type Session = { token: string; user: User }

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function request<T>(path: string, options: {
  token?: string
  body?: object
  method?: 'POST' | 'PATCH' | 'PUT'
  signal?: AbortSignal
} = {}): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
  if (!base?.startsWith('https://')) {
    throw new Error('Configura la URL HTTPS de la API en EXPO_PUBLIC_API_URL.')
  }
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.body) headers['Content-Type'] = 'application/json'
  const response = await fetch(base + path, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers,
    signal: options.signal,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, response.status < 500 && typeof data?.message === 'string'
      ? data.message : 'El servicio no está disponible. Intenta de nuevo.')
  }
  if (data === null) throw new Error('La API devolvió una respuesta inesperada.')
  return data as T
}
