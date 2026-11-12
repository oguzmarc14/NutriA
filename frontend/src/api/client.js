import axios from 'axios'
import { avisarAccion, resultadoDeOperacion } from '../utils/alertasAccion'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('nutria_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

client.interceptors.response.use(response => {
  const { method, url } = response.config
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const message = resultadoDeOperacion(method, url, response.data)
    if (message) avisarAccion(message)
  }
  return response
})

export default client
