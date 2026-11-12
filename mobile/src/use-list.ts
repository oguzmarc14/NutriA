import { useResource } from './use-resource'

export function useList<T>(path: string, key?: string) {
  const { data, error, loading, reload } = useResource<T[] | Record<string, T[]>>(path)
  const list = data && key && !Array.isArray(data) ? data[key] : data
  return {
    rows: Array.isArray(list) ? list : [],
    error: error || (data && !Array.isArray(list) ? 'La API devolvió una lista inválida.' : undefined),
    loading,
    reload,
  }
}
