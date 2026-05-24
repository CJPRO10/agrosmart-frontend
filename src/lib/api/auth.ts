import apiClient, { TOKEN_KEY } from './client'
import type { LoginResponse, RegistroProductorRequest } from '@/types'

interface LoginRequest {
  correo: string
  contrasena: string
}

// Guarda también en cookie para que el middleware pueda leerlo
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data)
    // Guardar en localStorage (para el cliente)
    localStorage.setItem(TOKEN_KEY, res.data.token)
    // Guardar en cookie (para el middleware)
    setCookie('agro_auth_token', res.data.token)
    return res.data
  },

  registrarProductor: async (data: RegistroProductorRequest): Promise<void> => {
    await apiClient.post('/auth/registro/productor', data)
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('agro_user')
    deleteCookie('agro_auth_token')
    deleteCookie('agro_user')
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated: (): boolean => {
    return Boolean(authApi.getToken())
  },
}