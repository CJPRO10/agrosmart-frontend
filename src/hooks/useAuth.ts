// -------Hook de autenticación -------
'use client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'
import type { LoginRequest, RegistroProductorRequest } from '@/types'

export function useAuth() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout, setLoading, hasRole } = useAuthStore()

  const login = async (data: LoginRequest) => {
    setLoading(true)
    try {
      const response = await authApi.login(data)
      setUser(response)
      router.push('/inicio')
    } finally {
      setLoading(false)
    }
  }

  const registrar = async (data: RegistroProductorRequest) => {
    setLoading(true)
    try {
      await authApi.registrarProductor(data)
      router.push('/login?registered=true')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    storeLogout()
    router.push('/login')
  }

  return { user, isAuthenticated, isLoading, login, registrar, logout, hasRole }
}