import type { Role } from '@/features/auth/access'

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
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  signal?: AbortSignal
} = {}): Promise<T> {
  const base = (process.env.EXPO_PUBLIC_API_URL || 'https://nutria-utdh.onrender.com/api').trim().replace(/\/+$/, '')
  if (!base?.startsWith('https://')) {
    throw new Error('Configura la URL HTTPS de la API en EXPO_PUBLIC_API_URL.')
  }
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.body) headers['Content-Type'] = 'application/json'
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()
  const timer = setTimeout(abort, 15000)
  let response: Response
  let data: any
  try {
    response = await fetch(base + path, {
      method: options.method ?? (options.body ? 'POST' : 'GET'),
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers, signal: controller.signal,
    })
    data = await response.json().catch(() => null)
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener('abort', abort)
  }
  if (!response.ok) {
    throw new ApiError(response.status, response.status < 500 && typeof data?.message === 'string'
      ? data.message : 'El servicio no está disponible. Intenta de nuevo.')
  }
  if (data === null) throw new Error('La API devolvió una respuesta inesperada.')
  return data as T
}
