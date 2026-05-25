// IndexedDB para almacenamiento offline
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface AgroSmartDB extends DBSchema {
  // Cache de datos del backend
  siembras:        { key: number; value: unknown }
  fincas:          { key: number; value: unknown }
  tareas:          { key: number; value: unknown }
  anomalias:       { key: number; value: unknown }
  recomendaciones: { key: number; value: unknown }
  notificaciones:  { key: number; value: unknown }
  cultivos:        { key: number; value: unknown }
  estados:         { key: number; value: unknown }
  // Cola de operaciones pendientes para sincronizar
  pendingRequests: {
    key: number
    value: {
      id?: number
      url: string
      method: string
      body: unknown
      timestamp: number
    }
  }
}

let db: IDBPDatabase<AgroSmartDB> | null = null

export async function getDB(): Promise<IDBPDatabase<AgroSmartDB>> {
  if (db) return db
  db = await openDB<AgroSmartDB>('agrosmart-db', 2, {
    upgrade(database) {
      const stores = [
        'siembras', 'fincas', 'tareas', 'anomalias',
        'recomendaciones', 'notificaciones', 'cultivos', 'estados'
      ] as const
      stores.forEach(store => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: undefined, autoIncrement: false })
        }
      })
      if (!database.objectStoreNames.contains('pendingRequests')) {
        database.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
  return db
}

// Guardar lista de items en cache
export async function cacheData(store: string, items: unknown[]) {
  try {
    const database = await getDB()
    const tx = database.transaction(store as never, 'readwrite')
    await (tx.store as unknown as { clear: () => Promise<void> }).clear()
    for (const item of items) {
      await (tx.store as unknown as { add: (v: unknown) => Promise<unknown> }).add(item)
    }
    await tx.done
  } catch { /* ignorar errores de IndexedDB */ }
}

// Leer items del cache
export async function getCachedData(store: string): Promise<unknown[]> {
  try {
    const database = await getDB()
    return await database.getAll(store as never)
  } catch {
    return []
  }
}

// Agregar petición pendiente
export async function addPendingRequest(url: string, method: string, body: unknown) {
  try {
    const database = await getDB()
    await database.add('pendingRequests', { url, method, body, timestamp: Date.now() })
  } catch { /* ignorar */ }
}

// Obtener peticiones pendientes
export async function getPendingRequests() {
  try {
    const database = await getDB()
    return await database.getAll('pendingRequests')
  } catch {
    return []
  }
}

// Limpiar peticiones pendientes
export async function clearPendingRequests() {
  try {
    const database = await getDB()
    await database.clear('pendingRequests')
  } catch { /* ignorar */ }
}
