import apiClient from './client'
import type { Notificacion } from '@/types'

export const notificacionesApi = {
  listar: async (): Promise<Notificacion[]> => {
    const res = await apiClient.get<Notificacion[]>('/notificaciones')
    return res.data
  },

  marcarLeida: async (id: number): Promise<void> => {
    await apiClient.patch(`/notificaciones/${id}/leer`)
  },
}