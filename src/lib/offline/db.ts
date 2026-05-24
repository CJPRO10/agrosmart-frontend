// ------- IndexedDB con idb -------
// Almacena datos localmente cuando no hay conexión al backend

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface AgroSmartDB extends DBSchema {
  // Pendientes de sincronización (POST/PUT/PATCH/DELETE fallidos)
  pendingRequests: {
    key: number
    value: {
      id?: number
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      url: string
      body: unknown
      createdAt: string
      retries: number
    }
    indexes: { 'by-url': string }
  }
  // Cache de datos para lectura offline
  cache: {
    key: string      // ej: 'fincas', 'tareas', 'anomalias'
    value: {
      key: string
      data: unknown
      cachedAt: string
    }
  }
}

let db: IDBPDatabase<AgroSmartDB> | null = null

export async function getDB(): Promise<IDBPDatabase<AgroSmartDB>> {
  if (db) return db

  db = await openDB<AgroSmartDB>('agrosmart-db', 1, {
    upgrade(database) {
      // Tabla de requests pendientes
      const pendingStore = database.createObjectStore('pendingRequests', {
        keyPath: 'id',
        autoIncrement: true,
      })
      pendingStore.createIndex('by-url', 'url')

      // Tabla de cache
      database.createObjectStore('cache', { keyPath: 'key' })
    },
  })

  return db
}

// ------- Guardar en cache para lectura offline -------
export async function saveToCache(key: string, data: unknown): Promise<void> {
  const database = await getDB()
  await database.put('cache', { key, data, cachedAt: new Date().toISOString() })
}

// ------- Leer del cache -------
export async function readFromCache<T>(key: string): Promise<T | null> {
  const database = await getDB()
  const entry = await database.get('cache', key)
  return entry ? (entry.data as T) : null
}

// ------- Guardar request pendiente para sync posterior -------
export async function savePendingRequest(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body: unknown
): Promise<void> {
  const database = await getDB()
  await database.add('pendingRequests', {
    method,
    url,
    body,
    createdAt: new Date().toISOString(),
    retries: 0,
  })
}

// ------- Obtener todos los pendientes -------
export async function getPendingRequests() {
  const database = await getDB()
  return database.getAll('pendingRequests')
}

// ------- Eliminar un pendiente (ya sincronizado) -------
export async function deletePendingRequest(id: number): Promise<void> {
  const database = await getDB()
  await database.delete('pendingRequests', id)
}