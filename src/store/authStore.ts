// ─── Store de Autenticación (Zustand) ────────────────────────────────────────
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, Rol } from '@/types'
import { authApi } from '@/lib/api/auth'

const TOKEN_KEY = 'agro_auth_token'

// Sincroniza el token en localStorage Y cookie cada vez que se carga el store
function sincronizarToken(token?: string) {
  if (typeof window === 'undefined') return
  const t = token ?? localStorage.getItem(TOKEN_KEY)
  if (!t) return
  // Renovar cookie con 7 días cada vez que el usuario visita la app
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  document.cookie = `agro_auth_token=${t};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

interface AuthState {
  user: LoginResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: LoginResponse) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  hasRole: (role: Rol | Rol[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,

      setUser: (user) => {
        sincronizarToken()
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        authApi.logout()
        set({ user: null, isAuthenticated: false })
      },

      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (role) => {
        const userRole = get().user?.rol
        if (!userRole) return false
        if (Array.isArray(role)) return role.includes(userRole)
        return userRole === role
      },
    }),
    {
      name: 'agro_user',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Cada vez que se rehidrata el store (recarga de página), sincroniza el token
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          sincronizarToken()
        }
      },
    }
  )
)