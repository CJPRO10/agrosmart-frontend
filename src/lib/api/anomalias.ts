import apiClient from './client'
import type { Anomalia, AnomaliaRequest } from '@/types'

export const anomaliasApi = {
  listar: async (): Promise<Anomalia[]> => {
    const res = await apiClient.get<Anomalia[]>('/anomalias')
    return res.data
  },

  crear: async (data: AnomaliaRequest): Promise<Anomalia> => {
    const res = await apiClient.post<Anomalia>('/anomalias', data)
    return res.data
  },

  actualizar: async (id: number, data: Partial<AnomaliaRequest>): Promise<Anomalia> => {
    const res = await apiClient.put<Anomalia>(`/anomalias/${id}`, data)
    return res.data
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/anomalias/${id}`)
  },
}