import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function useOfflineStatus() {
  const { isOnline, setOnline } = useUIStore()

  useEffect(() => {
    setOnline(navigator.onLine)

    const handleOnline  = () => {
      setOnline(true)
      // Forzar recarga de la página al volver online
      window.location.reload()
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