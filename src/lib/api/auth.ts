import apiClient, { TOKEN_KEY } from './client'
import type { LoginRequest, LoginResponse, RegistroProductorRequest } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data)
    // Guarda el token automáticamente
    localStorage.setItem(TOKEN_KEY, res.data.token)
    return res.data
  },

  registrarProductor: async (data: RegistroProductorRequest): Promise<void> => {
    await apiClient.post('/auth/registro/productor', data)
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('agro_user')
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated: (): boolean => {
    return Boolean(authApi.getToken())
  },
}