'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import type { Rol } from '@/types'

const RUTAS_POR_ROL: Record<Rol, string[]> = {
  PRODUCTOR: [
    '/inicio', '/mi-finca', '/personal', '/cultivos', '/tareas',
    '/anomalias', '/recomendaciones', '/clima', '/finanzas',
    '/reportes', '/perfil', '/notificaciones',
  ],
  OPERARIO: [
    '/inicio', '/cultivos', '/tareas', '/anomalias',
    '/recomendaciones', '/clima', '/perfil', '/notificaciones',
  ],
  AUXILIAR: [
    '/inicio', '/cultivos', '/tareas', '/anomalias',
    '/recomendaciones', '/perfil', '/notificaciones',
  ],
  ADMINISTRADOR: [
    '/inicio', '/usuarios', '/perfil', '/notificaciones',
  ],
}

export function useRoleGuard(pathname: string) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!user?.rol) return

    const rol = user.rol as Rol
    const rutasPermitidas = RUTAS_POR_ROL[rol] ?? []
    const permitida = rutasPermitidas.some(
      ruta => pathname === ruta || pathname.startsWith(ruta + '/')
    )

    if (!permitida) {
      router.push('/inicio')
    }
  }, [isAuthenticated, user, pathname, router])
}