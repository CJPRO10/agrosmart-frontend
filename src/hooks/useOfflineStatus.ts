'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { sincronizarPendientes } from '@/lib/offline/syncManager'

export function useOfflineStatus() {
  const { isOnline, setOnline } = useUIStore()

  useEffect(() => {
    setOnline(navigator.onLine)

    const handleOnline = async () => {
      setOnline(true)
      // Sincronizar peticiones pendientes al volver online
      try {
        const sincronizados = await sincronizarPendientes()
        if (sincronizados > 0) {
          console.log(`${sincronizados} cambios sincronizados`)
          // Recargar la página para mostrar datos actualizados
          window.location.reload()
        }
      } catch { /* ignorar errores de sincronización */ }
    }

    const handleOffline = () => setOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  return isOnline
}
