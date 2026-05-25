import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ApiError } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'
const TOKEN_KEY = 'agro_auth_token'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})
apiClient.interceptors.request.use((config) => {
  if (!navigator.onLine) {
    return Promise.reject(new Error('Sin conexión a internet'))
  }
  return config
})
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Tipo para la respuesta de error del backend Spring Boot
interface BackendErrorResponse {
  message?: string
  error?: string
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }

    const apiError: ApiError = {
      mensaje: error.response?.data?.message ?? error.response?.data?.error ?? 'Error de conexión con el servidor',
      status:  error.response?.status ?? 0,
      timestamp: new Date().toISOString(),
    }

    return Promise.reject(apiError)
  }
)

export default apiClient
export { TOKEN_KEY, BASE_URL }