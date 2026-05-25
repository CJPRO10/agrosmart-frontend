// Sincroniza peticiones pendientes cuando vuelve el internet
import { getPendingRequests, clearPendingRequests } from './db'
import { TOKEN_KEY } from '@/lib/api/client'

export async function sincronizarPendientes(): Promise<number> {
  const pendientes = await getPendingRequests()
  if (pendientes.length === 0) return 0

  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  let exitosos = 0

  for (const req of pendientes) {
    const r = req as { url: string; method: string; body: unknown }
    try {
      const res = await fetch(r.url, {
        method: r.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: r.body ? JSON.stringify(r.body) : undefined,
      })
      if (res.ok) exitosos++
    } catch { /* si falla, dejar para el próximo intento */ }
  }

  if (exitosos === pendientes.length) {
    await clearPendingRequests()
  }

  return exitosos
}
