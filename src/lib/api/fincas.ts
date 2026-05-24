import apiClient from './client'
import type { Finca, FincaRequest } from '@/types'

export const fincasApi = {
  listar: async (): Promise<Finca[]> => {
    const res = await apiClient.get<Finca[]>('/fincas')
    return res.data
  },

  buscarPorNombre: async (nombre: string): Promise<Finca[]> => {
    const res = await apiClient.get<Finca[]>(`/fincas/nombre/${nombre}`)
    return res.data
  },

  crear: async (data: FincaRequest): Promise<Finca> => {
    const res = await apiClient.post<Finca>('/fincas', data)
    return res.data
  },

  actualizar: async (idFinca: number, data: Partial<FincaRequest>): Promise<Finca> => {
    const res = await apiClient.put<Finca>(`/fincas/${idFinca}`, data)
    return res.data
  },

  eliminar: async (idFinca: number): Promise<void> => {
    await apiClient.delete(`/fincas/${idFinca}`)
  },
}