// ─── Sync Manager ─────────────────────────────────────────────────────────────
// Cuando vuelve la conexión, reintenta los requests pendientes

import apiClient from '@/lib/api/client'
import { getPendingRequests, deletePendingRequest } from './db'

export async function syncPendingRequests(): Promise<void> {
  if (!navigator.onLine) return

  const pending = await getPendingRequests()
  if (pending.length === 0) return

  console.log(`[Sync] ${pending.length} request(s) pendiente(s)`)

  for (const req of pending) {
    try {
      await apiClient.request({ method: req.method, url: req.url, data: req.body })
      if (req.id) await deletePendingRequest(req.id)
      console.log(`[Sync] ✓ ${req.method} ${req.url}`)
    } catch {
      console.warn(`[Sync] ✗ No se pudo sincronizar ${req.method} ${req.url}`)
    }
  }
}

// ─── Registrar Service Worker y escuchar eventos online ──────────────────────
export function initOfflineSync(): void {
  if (typeof window === 'undefined') return

  // Sync cuando vuelve la conexión
  window.addEventListener('online', () => {
    console.log('[Sync] Conexión restaurada — iniciando sync...')
    syncPendingRequests()
  })

  // Escucha mensajes del Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_TRIGGERED') {
        syncPendingRequests()
      }
    })
  }
}

// ─── Registrar el Service Worker ─────────────────────────────────────────────
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('[SW] Registrado:', registration.scope)

    // Pedir permiso para Background Sync
    if ('sync' in registration) {
        const syncRegistration = registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> }
        }
        await syncRegistration.sync.register('sync-pending-requests')
    }
  } catch (error) {
    console.error('[SW] Error al registrar:', error)
  }
}