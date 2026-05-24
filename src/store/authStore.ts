// -------Store de Autenticación (Zustand) -------
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, Rol } from '@/types'
import { authApi } from '@/lib/api/auth'

interface AuthState {
  user: LoginResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  // Acciones
  setUser: (user: LoginResponse) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  hasRole: (role: Rol | Rol[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

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
      name: 'agro_user',        // clave en localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)