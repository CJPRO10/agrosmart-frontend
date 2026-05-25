import axios from 'axios'
import { addPendingRequest } from '@/lib/offline/db'

export const TOKEN_KEY = 'agro_auth_token'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Request: agregar token JWT
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Sin conexión — guardar en cola de pendientes para sincronizar después
    if (!error.response && error.config) {
      const method = error.config.method?.toUpperCase()
      // Solo guardar mutaciones (POST, PUT, PATCH, DELETE)
      if (['POST','PUT','PATCH','DELETE'].includes(method ?? '')) {
        await addPendingRequest(
          error.config.baseURL + error.config.url,
          method,
          error.config.data ? JSON.parse(error.config.data) : null
        )
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
